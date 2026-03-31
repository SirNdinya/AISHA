import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { SignatureService } from './SignatureService';

export class DocumentAutoFillService {
    /**
     * Generates a PDF document for a student based on a template and department data.
     */
    static async generateStudentDocument(
        templateName: string,
        student: any,
        department: any,
        institution: any
    ): Promise<{ filePath: string; signature: string; filename: string }> {
        return new Promise((resolve, reject) => {
            const filename = `doc_${student.id.substring(0, 8)}_${Date.now()}.pdf`;
            // Ensure directory exists
            const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header Section
            doc.fillColor('#0d1117').font('Helvetica-Bold').fontSize(22).text(institution.name.toUpperCase(), { align: 'center' });
            doc.font('Helvetica').fontSize(12).text(department.name, { align: 'center' });
            doc.moveDown();

            doc.strokeColor('#a78bfa').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(2);

            // Document Title
            doc.fillColor('#0d1117').fontSize(18).text(templateName, { align: 'center', underline: true });
            doc.moveDown(2);

            // Content Section
            doc.fontSize(12).fillColor('#333');
            const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.text(`DATE: ${date}`, { align: 'right' });
            doc.moveDown();

            const bodyText = `This is to officially confirm that ${student.first_name} ${student.last_name}, registered under admission number ${student.admission_number}, is a bonafide student of ${institution.name} within the ${department.name}. 

This document serves as an official endorsement for industrial attachment and professional placement. All details contained herein are anchored to the AISHA Sovereign Blockchain for verification.`;

            doc.text(bodyText, { align: 'justify', lineGap: 5 });
            doc.moveDown(4);

            // Signature Line
            const signature = SignatureService.signDocument(filename, department.user_id, 'DEPARTMENT_ADMIN');

            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(250, doc.y).stroke();
            doc.fontSize(10).text('DEPARTMENTAL ADMINISTRATOR', 50, doc.y + 5);
            doc.text(institution.name, 50, doc.y + 20);

            // Footer / Verification QR placeholder
            doc.fontSize(8).fillColor('gray').text('VERIFY THIS DOCUMENT AT: https://aisha.mmust.ac.ke/verify', 0, 700, { align: 'center' });
            doc.text(`BLOCKCHAIN ANCHOR: ${signature}`, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve({ filePath, signature, filename }));
            stream.on('error', (err) => reject(err));
        });
    }
}
