from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DECIMAL, Date, DateTime, ARRAY
import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    description = Column(String)
    metadata_ = Column("metadata", JSONB, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # school_id removed: Column(UUID(as_uuid=True), ForeignKey("schools.id"))

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    admission_number = Column(String, unique=True, index=True)
    institution_id = Column(UUID(as_uuid=True), nullable=True) # References institutions.id
    department_id = Column(UUID(as_uuid=True), nullable=True)   # References departments.id
    # school_id removed: Column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=True)
    first_name = Column(String)
    last_name = Column(String)
    course_of_study = Column(String)
    current_year = Column(Integer)
    skills = Column(ARRAY(String)) 
    interests = Column(ARRAY(String))
    preferred_locations = Column(ARRAY(String))
    cv_url = Column(String)
    resume_text = Column(String)
    requires_stipend = Column(Boolean, default=False)
    min_stipend_amount = Column(DECIMAL(10, 2))
    mpesa_number = Column(String)
    auto_apply_enabled = Column(Boolean, default=False)
    career_path = Column(String)
    photo_url = Column(String)  # For profile picture placeholder
    academic_analysis = Column(JSONB, default={})
    
    learning_progress = relationship("StudentLearning", back_populates="student")
    academic_records = relationship("StudentAcademicRecord", back_populates="student")

class StudentAcademicRecord(Base):
    __tablename__ = "student_academic_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    unit_code = Column(String, nullable=False)
    unit_name = Column(String, nullable=False)
    grade = Column(String)
    semester = Column(String)
    academic_year = Column(Integer)
    synced_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    
    student = relationship("Student", back_populates="academic_records")

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    description = Column(String)
    provider = Column(String) # Coursera, etc.
    url = Column(String)
    category = Column(String) # Technical, Soft Skills
    field = Column(String)    # Software Dev, Data Science
    level = Column(String)    # beginner, intermediate
    is_free = Column(Boolean, default=True)
    tags = Column(JSONB)      # ["python", "django"]

class StudentLearning(Base):
    __tablename__ = "student_learning_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    resource_id = Column(UUID(as_uuid=True), ForeignKey("learning_resources.id"))
    status = Column(String, default="IN_PROGRESS")
    completion_date = Column(DateTime)
    certificate_url = Column(String)
    progress = Column(Integer, default=0)
    
    student = relationship("Student", back_populates="learning_progress")
    resource = relationship("LearningResource")

class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    industry = Column(String)
    location = Column(String)
    website = Column(String)
    logo_url = Column(String)
    is_blacklisted = Column(Boolean, default=False)
    
    opportunities = relationship("Opportunity", back_populates="company")

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    
    company = relationship("Company", back_populates="opportunities")
    department = relationship("Department")
    title = Column(String)
    description = Column(String)
    requirements = Column(String)  
    skills_required = Column(ARRAY(String)) 
    location = Column(String)
    stipend_amount = Column(DECIMAL(10, 2))
    vacancies = Column(Integer, default=1)
    application_deadline = Column(DateTime)
    auto_accept = Column(Boolean, default=False)
    status = Column(String)  # open, closed, filled
    type = Column(String, default="ATTACHMENT") # ATTACHMENT, INTERNSHIP, JOB
    duration_months = Column(Integer, default=3)
    auto_filter_config = Column(JSONB, default={})
    scheduled_for = Column(DateTime)

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id"))
    status = Column(String, default="PENDING")
    match_score = Column(DECIMAL(5, 2))
    match_reason = Column(String)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    auto_generated_docs = Column(JSONB)
    institution_signature = Column(String)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    offer_expires_at = Column(DateTime(timezone=True))
    
    student = relationship("Student")
    opportunity = relationship("Opportunity")

class Placement(Base):
    __tablename__ = "placements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    status = Column(String, default="active") # active, completed, terminated
    start_date = Column(Date, default=datetime.datetime.utcnow().date)
    end_date = Column(Date)
    performance_rating = Column(DECIMAL(3, 2))
    feedback = Column(String)
    
    application = relationship("Application")
    student = relationship("Student")
    company = relationship("Company")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), nullable=False)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

class DocumentHub(Base):
    __tablename__ = "document_hub"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True)) # References users.id
    type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    metadata_ = Column("metadata", JSONB)
    status = Column(String, default="PENDING")
    is_auto_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    digital_signature = Column(String)
