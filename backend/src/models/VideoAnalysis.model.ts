import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoAnalysis extends Document {
  videoId: string;
  videoUrl: string;
  analyzedAt: Date;
  totalComments: number;
  analyzedComments: number;
  comments: Array<{
    commentId: string;
    maskedAuthor: string;
    text: string;
    publishedAt: Date;
    likeCount: number;
    sentiment: string;
    confidence: number;
  }>;
  insights: {
    monthlyDistribution: Record<string, number>;
    sentimentAnalysis: {
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
    };
    topKeywords: Record<string, number>;
  };
}

const VideoAnalysisSchema = new Schema({
  videoId: { type: String, required: true, index: true },
  videoUrl: { type: String, required: true },
  analyzedAt: { type: Date, default: Date.now },
  totalComments: Number,
  analyzedComments: Number,
  comments: [{
    commentId: String,
    maskedAuthor: String,
    text: String,
    publishedAt: Date,
    likeCount: Number,
    sentiment: String,
    confidence: Number
  }],
  insights: {
    monthlyDistribution: Schema.Types.Mixed,
    sentimentAnalysis: {
      raw: {
        agree: Number,
        disagree: Number,
        neutral: Number
      },
      percentages: {
        agreePercentage: String,
        disagreePercentage: String,
        neutralPercentage: String
      }
    },
    topKeywords: Schema.Types.Mixed
  }
});

export default mongoose.model<IVideoAnalysis>('VideoAnalysis', VideoAnalysisSchema);