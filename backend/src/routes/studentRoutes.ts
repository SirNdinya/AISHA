import { Router } from 'express';
import { StudentController } from '../controllers/StudentController';
import multer from 'multer';
import path from 'path';
import { authenticate, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const studentController = new StudentController();

// Multer Configuration
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/cvs/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'cv-' + uniqueSuffix + ext);
    }
});

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const uploadCV = multer({ storage: cvStorage });
const uploadProfile = multer({ storage: profileStorage });

// Protect all routes after this middleware
router.use(authenticate);
router.use(restrictTo('STUDENT'));

router.get('/profile', studentController.getProfile);
router.patch('/profile', studentController.updateProfile);
router.get('/dashboard-stats', studentController.getDashboardStats);
router.get('/match-intelligence', studentController.getMatchIntelligence);
router.get('/automation-log', studentController.getAutomationLog);
router.get('/learning-path', studentController.getLearningPath);
router.get('/discover-online', studentController.discoverOnlineOpportunities);
router.get('/search-courses', studentController.searchCourses);
router.get('/academic-records', studentController.getAcademicRecords);
router.get('/transcript-report', studentController.getTranscriptReport);
router.get('/transcript-report/download', studentController.downloadTranscriptReport);
router.post('/sync-profile', studentController.syncProfileByReg);
router.post('/:id/generate-ai-resume', studentController.generateAIResume);

// Documents & Profile Media
router.post('/documents/upload', uploadCV.single('cv'), studentController.uploadCV);
router.post('/profile-picture', uploadProfile.single('profile_picture'), studentController.uploadProfilePicture);

// Generic Routes (Admin/Debug usage)
router.get('/', studentController.getAll);
router.get('/:id', studentController.getOne);

export default router;
