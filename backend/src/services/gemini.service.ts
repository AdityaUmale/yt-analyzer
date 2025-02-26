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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

async analyzeSentiment(commentText: string, videoContext: string): Promise<SentimentAnalysisResult> {
    try {
      const prompt = `
      You are a YouTube comment sentiment analyzer. Analyze this comment and determine if it expresses agreement or disagreement with the video content.

      Comment to analyze: "${commentText}"

      Rules for classification:
      - agree: Comments showing support, praise, appreciation, positive feedback, or agreement
      - disagree: Comments showing criticism, disapproval, negative feedback, or disagreement
      - neutral: Comments that are factual, questions, or unrelated to the content

      Examples:
      - "This is so helpful, exactly what I needed!" → agree
      - "I don't think this is correct, you're missing important points" → disagree
      - "What software are you using?" → neutral

      Respond with ONLY a JSON object in this format:
      {
        "sentiment": "agree" or "disagree" or "neutral",
        "confidence": [number between 0 and 1]
      }`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResult = response.text();
      
      console.log('Raw Gemini response:', textResult); // Debug log
      
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
      
      // Validate the response
      if (!['agree', 'disagree', 'neutral'].includes(jsonResult.sentiment)) {
        console.error('Invalid sentiment value:', jsonResult.sentiment);
        return {
          text: commentText,
          sentiment: 'neutral',
          confidence: 0.5
        };
      }

      return {
        text: commentText,
        sentiment: jsonResult.sentiment,
        confidence: jsonResult.confidence
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
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
      5, // Process 5 comments at a time
      2000 // Wait 2 seconds between batches
    );
    
    // Convert results to the expected format
    batchResults.forEach(item => {
      results[item.id] = item.result;
    });
    
    return results;
  }
}