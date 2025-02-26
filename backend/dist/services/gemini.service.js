"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const rate_limiter_1 = require("../utils/rate-limiter");
dotenv_1.default.config();
const API_KEY = process.env.GEMINI_API_KEY;
class GeminiService {
    constructor() {
        if (!API_KEY) {
            throw new Error('Gemini API key is not set in environment variables');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    analyzeSentiment(commentText, videoContext) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.model.generateContent(prompt);
                const response = yield result.response;
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
            }
            catch (error) {
                console.error('Error analyzing sentiment:', error);
                return {
                    text: commentText,
                    sentiment: 'neutral',
                    confidence: 0.5
                };
            }
        });
    }
    /**
     * Batch analyze multiple comments for efficiency
     */
    batchAnalyzeSentiment(comments, videoUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = {};
            // Use the rate limiter
            const analyzeComment = (comment) => __awaiter(this, void 0, void 0, function* () {
                const result = yield this.analyzeSentiment(comment.text, videoUrl);
                return { id: comment.id, result };
            });
            const batchResults = yield (0, rate_limiter_1.rateLimitedBatch)(comments, analyzeComment, 5, // Process 5 comments at a time
            2000 // Wait 2 seconds between batches
            );
            // Convert results to the expected format
            batchResults.forEach(item => {
                results[item.id] = item.result;
            });
            return results;
        });
    }
}
exports.GeminiService = GeminiService;
