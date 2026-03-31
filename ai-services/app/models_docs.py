from sqlalchemy import Column, String, Boolean, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String)  # e.g., "NITA Form", "Insurance Cover"
    file_path = Column(String) # Path to the stored blank PDF
    signature_key_public = Column(String) # Public key to verify signatures
    signature_key_private = Column(String) # Private key (Encrypted in real app!) to sign
    
    student_documents = relationship("StudentDocument", back_populates="template")

class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("document_templates.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    file_path = Column(String) # Path to filled PDF
    digital_signature = Column(String) # The signature hash
    is_verified = Column(Boolean, default=False)
    
    template = relationship("DocumentTemplate", back_populates="student_documents")
