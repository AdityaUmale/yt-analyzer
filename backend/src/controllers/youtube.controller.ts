import { Request, Response } from 'express';
import { YouTubeService, Comment } from '../services/youtube.service';
import { GeminiService, SentimentAnalysisResult } from '../services/gemini.service';

const youtubeService = new YouTubeService();
const geminiService = new GeminiService();

interface AnalyzedComment extends Comment {
  sentiment: string;
  confidence: number;
}

export const getVideoComments = async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    // Fetch comments from YouTube
    console.log(`Fetching comments for ${videoUrl}...`);
    const comments = await youtubeService.fetchComments(videoUrl);
    
    // Limit the number of comments to analyze to avoid excessive API usage
    const commentsToAnalyze = comments.slice(0, 100); // Analyze first 100 comments
    
    // Prepare comments for sentiment analysis
    const commentData = commentsToAnalyze.map(comment => ({
      id: comment.id,
      text: comment.text
    }));
    
    // Analyze sentiment using Gemini
    console.log('Analyzing comment sentiment...');
    const sentimentResults = await geminiService.batchAnalyzeSentiment(commentData, videoUrl);
    
    // Combine comments with sentiment analysis
    const analyzedComments: AnalyzedComment[] = commentsToAnalyze.map(comment => ({
      ...comment,
      sentiment: sentimentResults[comment.id]?.sentiment || 'neutral',
      confidence: sentimentResults[comment.id]?.confidence || 0.5
    }));
    
    // Categorize comments
    const agreeing = analyzedComments.filter(c => c.sentiment === 'agree').length;
    const disagreeing = analyzedComments.filter(c => c.sentiment === 'disagree').length;
    const neutral = analyzedComments.filter(c => c.sentiment === 'neutral').length;
    
    return res.status(200).json({
      success: true,
      totalComments: comments.length,
      analyzedComments: analyzedComments.length,
      sentimentSummary: {
        agree: agreeing,
        disagree: disagreeing,
        neutral: neutral,
        agreePercentage: (agreeing / analyzedComments.length * 100).toFixed(2),
        disagreePercentage: (disagreeing / analyzedComments.length * 100).toFixed(2),
        neutralPercentage: (neutral / analyzedComments.length * 100).toFixed(2)
      },
      data: analyzedComments
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};

// Add a test endpoint
export const testAPI = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'API is working'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};