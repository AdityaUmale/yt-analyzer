import { Request, Response } from 'express';
import { YouTubeService, Comment } from '../services/youtube.service';
import { GeminiService, SentimentAnalysisResult } from '../services/gemini.service';
import VideoAnalysis from '../models/VideoAnalysis.model';

const youtubeService = new YouTubeService();
const geminiService = new GeminiService();

interface AnalyzedComment extends Comment {
  sentiment: string;
  confidence: number;
}

// Add helper functions for insights
const getMonthlyDistribution = (comments: Comment[]) => {
  const distribution: { [key: string]: number } = {};
  
  comments.forEach(comment => {
    const date = new Date(comment.publishedAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    distribution[monthYear] = (distribution[monthYear] || 0) + 1;
  });
  
  return Object.entries(distribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [month, count]) => ({ ...acc, [month]: count }), {});
};

const getTopKeywords = (comments: Comment[], topK: number = 10) => {
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
  const wordCount: { [key: string]: number } = {};
  
  comments.forEach(comment => {
    const words = comment.text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topK)
    .reduce((acc, [word, count]) => ({ ...acc, [word]: count }), {});
};

export const getVideoComments = async (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    // Check if analysis exists
    const videoId = youtubeService.extractVideoId(videoUrl);
    const existingAnalysis = await VideoAnalysis.findOne({ videoId });
    
    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Retrieved from cache',
        data: existingAnalysis
      });
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
    
    // Calculate insights
    const monthlyDistribution = getMonthlyDistribution(comments);
    
    const sentimentStats = {
      agree: analyzedComments.filter(c => c.sentiment === 'agree').length,
      disagree: analyzedComments.filter(c => c.sentiment === 'disagree').length,
      neutral: analyzedComments.filter(c => c.sentiment === 'neutral').length
    };

    const totalAnalyzed = analyzedComments.length;
    const sentimentPercentages = {
      agreePercentage: (sentimentStats.agree / totalAnalyzed * 100).toFixed(2),
      disagreePercentage: (sentimentStats.disagree / totalAnalyzed * 100).toFixed(2),
      neutralPercentage: (sentimentStats.neutral / totalAnalyzed * 100).toFixed(2)
    };

    const topKeywords = getTopKeywords(comments);

    // Mask usernames before storing
    const maskedComments = analyzedComments.map(comment => ({
      ...comment,
      maskedAuthor: `user_${comment.authorDisplayName.slice(0, 2)}${Math.random().toString(36).slice(2, 8)}`
    }));

    // Store in MongoDB
    const videoAnalysis = new VideoAnalysis({
      videoId,
      videoUrl,
      totalComments: comments.length,
      analyzedComments: analyzedComments.length,
      comments: maskedComments,
      insights: {
        monthlyDistribution,
        sentimentAnalysis: {
          raw: sentimentStats,
          percentages: sentimentPercentages
        },
        topKeywords
      }
    });

    await videoAnalysis.save();

    return res.status(200).json({
      success: true,
      message: 'Analysis completed and stored',
      data: videoAnalysis
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