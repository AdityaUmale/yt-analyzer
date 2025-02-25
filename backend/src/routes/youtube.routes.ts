import { Router, Request, Response } from 'express';
import { getVideoComments, testAPI } from '../controllers/youtube.controller';

const router = Router();

router.post('/comments', (req: Request, res: Response) => {
    getVideoComments(req, res);
});

router.get('/test', (req: Request, res: Response) => {
    testAPI(req, res);
});

export default router;