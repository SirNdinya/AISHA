import pytest
from app.models import Department, Student, Opportunity, Application
import uuid

def test_create_department():
    dept = Department(
        name="Computer Science",
        code="CS",
        institution_id=uuid.uuid4()
    )
    assert dept.name == "Computer Science"
    assert dept.code == "CS"

def test_create_student():
    student = Student(
        first_name="John",
        last_name="Doe",
        admission_number="CS/001/2024",
        user_id=uuid.uuid4()
    )
    assert student.first_name == "John"
    assert student.admission_number == "CS/001/2024"

def test_create_opportunity():
    opp = Opportunity(
        title="Software Engineering Intern",
        company_id=uuid.uuid4(),
        vacancies=2
    )
    assert opp.title == "Software Engineering Intern"
    assert opp.vacancies == 2

def test_create_application():
    app = Application(
        student_id=uuid.uuid4(),
        opportunity_id=uuid.uuid4(),
        status="PENDING"
    )
    assert app.status == "PENDING"
