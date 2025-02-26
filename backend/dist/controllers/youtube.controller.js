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
exports.testAPI = exports.getVideoComments = void 0;
const youtube_service_1 = require("../services/youtube.service");
const gemini_service_1 = require("../services/gemini.service");
const VideoAnalysis_model_1 = __importDefault(require("../models/VideoAnalysis.model"));
const youtubeService = new youtube_service_1.YouTubeService();
const geminiService = new gemini_service_1.GeminiService();
// Add helper functions for insights
const getMonthlyDistribution = (comments) => {
    const distribution = {};
    comments.forEach(comment => {
        const date = new Date(comment.publishedAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        distribution[monthYear] = (distribution[monthYear] || 0) + 1;
    });
    return Object.entries(distribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [month, count]) => (Object.assign(Object.assign({}, acc), { [month]: count })), {});
};
const getTopKeywords = (comments, topK = 10) => {
    const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
    const wordCount = {};
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
        .reduce((acc, [word, count]) => (Object.assign(Object.assign({}, acc), { [word]: count })), {});
};
const getVideoComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }
        // Check if analysis exists
        const videoId = youtubeService.extractVideoId(videoUrl);
        const existingAnalysis = yield VideoAnalysis_model_1.default.findOne({ videoId });
        if (existingAnalysis) {
            return res.status(200).json({
                success: true,
                message: 'Retrieved from cache',
                data: existingAnalysis
            });
        }
        // Fetch comments from YouTube
        console.log(`Fetching comments for ${videoUrl}...`);
        const comments = yield youtubeService.fetchComments(videoUrl);
        // Limit the number of comments to analyze to avoid excessive API usage
        const commentsToAnalyze = comments.slice(0, 20); // Start with 20 comments for testing
        // Prepare comments for sentiment analysis
        const commentData = commentsToAnalyze.map(comment => ({
            id: comment.id,
            text: comment.text
        }));
        // Analyze sentiment using Gemini
        console.log('Analyzing comment sentiment...');
        const sentimentResults = yield geminiService.batchAnalyzeSentiment(commentData, videoUrl);
        // Combine comments with sentiment analysis
        const analyzedComments = commentsToAnalyze.map(comment => {
            var _a, _b;
            return (Object.assign(Object.assign({}, comment), { sentiment: ((_a = sentimentResults[comment.id]) === null || _a === void 0 ? void 0 : _a.sentiment) || 'neutral', confidence: ((_b = sentimentResults[comment.id]) === null || _b === void 0 ? void 0 : _b.confidence) || 0.5 }));
        });
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
        const maskedComments = analyzedComments.map(comment => (Object.assign(Object.assign({}, comment), { maskedAuthor: `user_${comment.authorDisplayName.slice(0, 2)}${Math.random().toString(36).slice(2, 8)}` })));
        // Store in MongoDB
        const videoAnalysis = new VideoAnalysis_model_1.default({
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
        yield videoAnalysis.save();
        return res.status(200).json({
            success: true,
            message: 'Analysis completed and stored',
            data: videoAnalysis
        });
    }
    catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});
exports.getVideoComments = getVideoComments;
// Add a test endpoint
const testAPI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).json({
            success: true,
            message: 'API is working'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
});
exports.testAPI = testAPI;
