import { Request, Response, NextFunction } from 'express';
import { YouTubeService } from '../services/youtube.service';

const youtubeService = new YouTubeService();

export const getVideoComments = (req: Request, res: Response, next: NextFunction) => {
  const asyncHandler = async () => {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    const comments = await youtubeService.fetchComments(videoUrl);
    
    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  };

  asyncHandler().catch(next); // Catch any errors and pass them to next
};