import io
from typing import List, Dict, Any
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

class TranscriptService:
    @staticmethod
    async def analyze_performance(records: List[Dict[str, Any]], student_name: str = "the student") -> Dict[str, Any]:
        """
        True ML-driven analysis of academic records using LLMs.
        """
        from app.services.llm_service import llm_service
        import json

        if not records:
            return {
                "insights": "[SYSTEM_MSG] INSUFFICIENT_ACADEMIC_DATA_POINTS. COMPLETE_FULL_SEMESTER_UNITS_TO_ACTIVATE_NEURAL_ANYSIS.",
                "detected_clusters": []
            }

        recorded_units = len(records)
        units_text = ", ".join([f"{r.get('unit_name', 'Unknown')}: {r.get('grade', 'F')} (Mark: {r.get('mark', 'N/A')})" for r in records])
        
        prompt = f"""
        [AISHA_NEURAL_ANALYTIC_NODE]
        OPERATIONAL_CONTEXT: Deep architectural analysis of student academic trajectory.
        STUDENT_NAME: {student_name}
        INPUT_STREAM: {units_text}
        
        **STRICT_PROHIBITIONS (CRITICAL):**
        - **DO NOT** use generic templates like "The individual has...", "The individual is familiar with...", etc.
        - **DO NOT** use repetitive starting phrases for paragraphs.
        - **DO NOT** use dummy or placeholder analysis.
        - **AVOID** vague generalizations.
        
        **REQUIRED DESIGN SPECIFICATIONS:**
        - **PRECISION**: Use specific unit names and marks from the INPUT_STREAM to justify insights.
        - **FORMATTING**: Use **bolding** for unit names and key technical concepts.
        - **EMOJIS**: Include exactly 4 professional emojis (🎯, 🚀, 💡, ⚡) naturally within the text.
        - **STYLE**: Direct, modern, and no-nonsense. Use "You" or "{student_name}" instead of "The individual".
        - **INSIGHTS_LENGTH**: One concise, high-impact paragraph (max 4-5 lines).
        
        **EXPECTED JSON OUTPUT:**
        - **insights**: A precision-engineered analysis of specific academic strengths/gaps.
        - **recommendation**: A surgical, data-driven career directive.
        - **status**: One word (e.g., EXCELLENT, ADVANCING, STABLE).
        """
        
        schema = {
            "insights": "string",
            "recommendation": "string",
            "status": "string",
            "detected_clusters": ["string"]
        }
        
        try:
            analysis = await llm_service.analyze_structured(prompt, schema)
            if "error" in analysis:
                return {
                    "status": "LLM_OFFLINE",
                    "recommendation": "[SYSTEM] AI_ENGINE_UNAVAILABLE. RETRY_LATER.",
                    "insights": "[SYSTEM] THE_AISHA_NEURAL_ENGINE_IS_CURRENTLY_RECALIBRATING.",
                    "detected_clusters": []
                }
            return analysis
        except Exception as e:
            return {
                "status": "ERROR",
                "recommendation": "AISHA Neural Engine: Analyzing academic architectural nodes.",
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
        elements.append(Paragraph(f"<b>Registry Status:</b> {analysis.get('status', 'N/A')}", styles['Normal']))
        elements.append(Paragraph(f"<b>Skill Insights:</b> {analysis.get('insights', 'N/A')}", styles['Normal']))
        elements.append(Paragraph(f"<b>AI Recommendation:</b> {analysis.get('recommendation', 'N/A')}", styles['Normal']))
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
