from sqlalchemy.orm import Session
from app import models_docs, models
from app.services.blockchain_service import BlockchainService
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives import serialization
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
from typing import Optional
import io
import os
import base64

class DocumentService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.storage_path: str = "storage/documents"
        self.blockchain: BlockchainService = BlockchainService()
        os.makedirs(self.storage_path, exist_ok=True)

    def generate_keys(self):
        """Generate a new RSA key pair for an institution's template."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        public_key = private_key.public_key()
        
        pem_private = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        pem_public = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return pem_private.decode('utf-8'), pem_public.decode('utf-8')

    def sign_data(self, data: bytes, private_key_str: str) -> str:
        """Sign bytes using private key."""
        private_key = serialization.load_pem_private_key(
            private_key_str.encode('utf-8'),
            password=None
        )
        signature = private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode('utf-8')

    def verify_signature(self, data: bytes, signature_str: str, public_key_str: str) -> bool:
        """Verify signature using public key."""
        public_key = serialization.load_pem_public_key(
            public_key_str.encode('utf-8')
        )
        try:
            signature = base64.b64decode(signature_str)
            public_key.verify(
                signature,
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False

    def create_template(self, institution_id: str, name: str, file_bytes: bytes) -> models_docs.DocumentTemplate:
        """Save a new document template and generate keys."""
        priv, pub = self.generate_keys()
        
        # Save file
        filename = f"{institution_id}_{name.replace(' ', '_')}.pdf"
        path = os.path.join(self.storage_path, filename)
        with open(path, "wb") as f:
            f.write(file_bytes)
            
        template = models_docs.DocumentTemplate(
            institution_id=institution_id,
            name=name,
            file_path=path,
            signature_key_private=priv,
            signature_key_public=pub
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def generate_student_document(self, template_id: str, student_id: str) -> Optional[models_docs.StudentDocument]:
        """Overlay student info onto template and sign."""
        template = self.db.query(models_docs.DocumentTemplate).filter_by(id=template_id).first()
        student = self.db.query(models.Student).filter_by(id=student_id).first()
        
        if not template or not student:
            return None

        # 1. READ Template
        reader = PdfReader(template.file_path)
        writer = PdfWriter()

        # 2. CREATE Overlay
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        # Assuming standard form layout (e.g., top right for Name)
        can.drawString(100, 650, f"Student Name: {student.first_name} {student.last_name}")
        can.drawString(100, 630, f"Reg No: {student.admission_number}")
        can.drawString(100, 610, f"Course: {student.course_of_study}")
        can.save()
        packet.seek(0)
        overlay_pdf = PdfReader(packet)
        
        # 3. MERGE
        page = reader.pages[0]
        page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)

        # 4. SAVE
        out_filename = f"{student_id}_{template.name}.pdf"
        out_path = os.path.join(self.storage_path, out_filename)
        
        with open(out_path, "wb") as f:
            writer.write(f)
            
        # 5. SIGN
        # We sign the CONTENT of the new PDF
        with open(out_path, "rb") as f:
            content = f.read()
        
        signature = self.sign_data(content, template.signature_key_private)
        
        doc = models_docs.StudentDocument(
            template_id=template.id,
            student_id=student.id,
            file_path=out_path,
            digital_signature=signature,
            is_verified=True # System generated = Verified
        )
        # 6. PERSIST first so doc.id is populated, then ANCHOR TO BLOCKCHAIN
        self.db.add(doc)
        self.db.flush()  # Flush to get the auto-generated doc.id without committing
        self.blockchain.anchor_document(str(doc.id), signature, str(student.id))
        
        return doc

    def verify_document_integrity(self, document_id: str) -> bool:
        """Check if a stored document matches its signature."""
        doc = self.db.query(models_docs.StudentDocument).filter_by(id=document_id).first()
        if not doc:
            return False
            
        template = doc.template
        with open(doc.file_path, "rb") as f:
            content = f.read()
            
        is_valid = self.verify_signature(content, doc.digital_signature, template.signature_key_public)
        return is_valid
