import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { rateLimitedBatch } from '../utils/rate-limiter';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

export interface SentimentAnalysisResult {
  text: string;
  sentiment: 'agree' | 'disagree' | 'neutral';
  confidence: number;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!API_KEY) {
      throw new Error('Gemini API key is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Analyze the sentiment of a single comment
   */
  async analyzeSentiment(commentText: string, videoContext: string): Promise<SentimentAnalysisResult> {
    try {
      const prompt = `
      Video Context: ${videoContext}
      
      Comment: "${commentText}"
      
      Task: Analyze whether this comment agrees with the video content, disagrees with it, or is neutral/unrelated.
      
      Return ONLY a JSON object with the following structure:
      {
        "sentiment": "agree" or "disagree" or "neutral",
        "confidence": [a number between 0 and 1]
      }
      
      Don't include any explanations, just the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResult = response.text();
      
      // Extract the JSON object from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('Failed to parse JSON from Gemini response:', textResult);
        return {
          text: commentText,
          sentiment: 'neutral',
          confidence: 0.5
        };
      }
      
      const jsonResult = JSON.parse(jsonMatch[0]);
      
      return {
        text: commentText,
        sentiment: jsonResult.sentiment,
        confidence: jsonResult.confidence
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Default to neutral sentiment in case of error
      return {
        text: commentText,
        sentiment: 'neutral',
        confidence: 0.5
      };
    }
  }

  /**
   * Batch analyze multiple comments for efficiency
   */
  async batchAnalyzeSentiment(comments: { id: string; text: string }[], videoUrl: string): Promise<Record<string, SentimentAnalysisResult>> {
    const results: Record<string, SentimentAnalysisResult> = {};
    
    // Use the rate limiter
    const analyzeComment = async (comment: { id: string; text: string }) => {
      const result = await this.analyzeSentiment(comment.text, videoUrl);
      return { id: comment.id, result };
    };
    
    const batchResults = await rateLimitedBatch(
      comments,
      analyzeComment,
      10, // Process 10 comments at a time
      1000 // Wait 1 second between batches
    );
    
    // Convert results to the expected format
    batchResults.forEach(item => {
      results[item.id] = item.result;
    });
    
    return results;
  }
}