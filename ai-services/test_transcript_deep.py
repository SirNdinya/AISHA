import asyncio
from app.services.transcript_service import TranscriptService

records = [
    {"unit_code": "COM-101", "unit_name": "Intro to Programming", "academic_year": 1, "semester": "Sem 1", "grade": "A", "mark": 92},
    {"unit_code": "COM-102", "unit_name": "Data Structures", "academic_year": 1, "semester": "Sem 2", "grade": "B", "mark": 68},
    {"unit_code": "CYB-201", "unit_name": "Intro to Cyber Security", "academic_year": 2, "semester": "Sem 1", "grade": "A", "mark": 88}
]

async def main():
    print("Testing ML Analysis...")
    analysis = await TranscriptService.analyze_performance(records)
    print("ANALYSIS RESULTS:")
    for k, v in analysis.items():
        print(f"{k}: {v}")
    
    print("\nTesting PDF Generation...")
    pdf_bytes = TranscriptService.generate_pdf_report("John Doe", records, analysis)
    with open("test_transcript.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"PDF Generated! Size: {len(pdf_bytes)} bytes")

if __name__ == "__main__":
    asyncio.run(main())
