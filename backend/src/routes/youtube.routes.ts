import { Router } from 'express';
import { getVideoComments } from '../controllers/youtube.controller';

const router = Router();

// Fix: Use the correct router method
router.post('/comments', getVideoComments);

export default router;