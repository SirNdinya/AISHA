
import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { AdminController } from '../controllers/AdminController';

const router = Router();
const deptController = new DepartmentController();
const adminController = new AdminController();

import { emailService } from '../services/EmailService';

router.get('/departments', deptController.list);
router.get('/broadcasts/active', adminController.getActiveBroadcasts);
router.get('/settings/global', adminController.getGlobalSettings);

router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        await emailService.sendContactEmail(name, email, subject, message);
        return res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending contact email:', error);
        return res.status(500).json({ error: 'An error occurred while sending your message.' });
    }
});

export default router;
