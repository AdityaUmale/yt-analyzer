// src/types.ts

/**
 * Represents a YouTube comment with sentiment analysis
 */
export interface Comment {
    maskedAuthor: string;
    text: string;
    publishedAt: Date;
    likeCount: number;
    sentiment: 'agree' | 'disagree' | 'neutral';
    confidence: number;
    _id: string;
  }
  
  /**
   * Monthly distribution of comments
   */
  export interface MonthlyDistribution {
    [key: string]: number;  // Format: "YYYY-MM": count
  }
  
  /**
   * Sentiment analysis results
   */
  export interface SentimentAnalysis {
    raw: {
      agree: number;
      disagree: number;
      neutral: number;
    };
    percentages: {
      agreePercentage: string;
      disagreePercentage: string;
      neutralPercentage: string;
    };
  }
  
  /**
   * Complete video analysis including comments and insights
   */
  export interface VideoAnalysis {
    _id: string;
    videoId: string;
    videoUrl: string;
    totalComments: number;
    analyzedComments: number;
    comments: Comment[];
    insights: {
      monthlyDistribution: MonthlyDistribution;
      sentimentAnalysis: SentimentAnalysis;
      topKeywords: Record<string, number>;
    };
    analyzedAt: Date;
  }