import pandas as pd
from sqlalchemy.orm import Session
from app import models, models_docs
from app.services.document_service import DocumentService
import io
import uuid
from typing import BinaryIO, Dict

class BatchService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.doc_service: DocumentService = DocumentService(db)

    def process_student_import(self, file_content: bytes, institution_id: str) -> Dict[str, int]:
        """
        Parse CSV and bulk create students.
        CSV Columns: student_number, first_name, last_name, specialization, email
        """
        df = pd.read_csv(io.BytesIO(file_content))
        
        created_count: int = 0
        assigned_docs: int = 0
        
        # Determine default template for this institution (if any)
        template = self.db.query(models_docs.DocumentTemplate).filter_by(
            institution_id=institution_id
        ).first()

        for _, row in df.iterrows():
            # Check if exists
            exists = self.db.query(models.Student).filter_by(
                admission_number=str(row['student_number'])
            ).first()
            
            if not exists:
                student = models.Student(
                    id=uuid.uuid4(),
                    user_id=uuid.uuid4(), # In real app, create Auth User first
                    admission_number=str(row['student_number']),
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    course_of_study=row.get('specialization', row.get('course', 'Computer Science'))
                )
                self.db.add(student)
                
                # Auto-Assign Docs
                if template:
                    self.db.flush() # Get ID
                    self.doc_service.generate_student_document(str(template.id), str(student.id))
                    assigned_docs += 1
                
                created_count += 1
        
        self.db.commit()
        return {
            "students_created": created_count,
            "documents_generated": assigned_docs
        }
