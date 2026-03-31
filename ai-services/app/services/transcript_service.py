import io
from typing import List, Dict, Any
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

class TranscriptService:
    @staticmethod
    async def analyze_performance(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        True ML-driven analysis of academic records using LLMs.
        """
        from app.services.llm_service import llm_service
        import json

        if not records:
            return {
                "status": "INSUFFICIENT_DATA",
                "strengths": [],
                "recommendation": "Maintain consistent study habits.",
                "insights": "Please complete more units to unlock deep ML skill analysis.",
                "detected_clusters": []
            }

        recorded_units = len(records)
        units_text = ", ".join([f"{r.get('unit_name', 'Unknown')}: {r.get('grade', 'F')} (Mark: {r.get('mark', 'N/A')})" for r in records])
        
        prompt = f"""
        As an AI Career Architect, analyze these {recorded_units} academic units: {units_text}
        
        Provide a high-fidelity, data-driven analysis using sophisticated technical vocabulary.
        
        **FORMATTING PROTOCOL:**
        - Use **BOLD** (like **this**) for all technical terms, core competencies, and critical methodologies.
        - Use Bullet Points (- ) for lists of specific skills, strengths, or observations.
        - Structure the 'insights' as a dense, professional architectural brief.
        - Avoid "story-telling" or narrative fluff. Be direct and analytical.
        
        Focus on:
        1. **Pedagogical Significance**: Map units (e.g. 'Data Structures') to cognitive capabilities (e.g. 'algorithmic rigor').
        2. **Skill Synthesis**: Group units into advanced clusters (e.g. 'Distributed Systems & Optimization').
        3. **Trajectory**: A unique career recommendation based on their academic strengths.
        
        Every analysis must be unique, professional, and architecturally focused.
        """
        
        schema = {
            "status": "string (e.g. 'EXCELLENT', 'PROFICIENT', 'DEVELOPING')",
            "strengths": ["list of 3-5 specific strengths derived from units"],
            "recommendation": "string containing a unique, deep recommendation",
            "insights": "string containing a highly customized, well-researched analysis of their performance and potential",
            "detected_clusters": ["list of 2-4 overarching skill clusters"]
        }
        
        try:
            analysis = await llm_service.analyze_structured(prompt, schema)
            if "error" in analysis:
                return {
                    "status": "LLM_ERROR",
                    "strengths": [],
                    "recommendation": "AISHA Neural Engine: Analyzing academic architectural nodes for optimal career trajectory alignment.",
                    "insights": "We're updating our AI models. Keep up the good work!",
                    "detected_clusters": ["General"]
                }
            return analysis
        except Exception as e:
            return {
                "status": "ERROR",
                "strengths": [],
                "recommendation": "AISHA Neural Engine: Analyzing academic architectural nodes for optimal career trajectory alignment.",
                "insights": f"ML Error: {e}",
                "detected_clusters": ["General"]
            }

    @staticmethod
    def generate_pdf_report(student_name: str, records: List[Dict[str, Any]], analysis: Dict[str, Any]) -> bytes:
        """
        Generate a professional PDF report focusing on skills and performance.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            alignment=1,
            spaceAfter=20,
            textColor=colors.HexColor("#008B8B")
        )
        elements.append(Paragraph(f"AI-Driven Skill Registry & Academic Report", title_style))
        elements.append(Paragraph(f"Student: {student_name}", styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))

        # Analysis Summary Box
        elements.append(Paragraph("AI Skill Registry Summary", styles['Heading2']))
        elements.append(Paragraph(f"<b>Registry Status:</b> {analysis['status']}", styles['Normal']))
        elements.append(Paragraph(f"<b>Skill Insights:</b> {analysis['insights']}", styles['Normal']))
        elements.append(Paragraph(f"<b>AI Recommendation:</b> {analysis['recommendation']}", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))

        # Transcript Table
        elements.append(Paragraph("Detailed Academic Records", styles['Heading2']))
        
        data = [["Unit Code", "Unit Name", "Year", "Sem", "Mark", "Grade"]]
        sorted_records = sorted(records, key=lambda x: (x.get('academic_year', ''), x.get('semester', '')))
        
        for r in sorted_records:
            data.append([
                str(r.get("unit_code", "")),
                str(r.get("unit_name", "")),
                str(r.get("academic_year", "")),
                str(r.get("semester", "")),
                str(r.get("mark", "N/A")) if r.get("mark") is not None else "N/A",
                str(r.get("grade", ""))
            ])

        t = Table(data, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#008B8B")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)

        doc.build(elements)
        pdf_val = buffer.getvalue()
        buffer.close()
        return pdf_val
