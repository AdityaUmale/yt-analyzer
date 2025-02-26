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
exports.YouTubeService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
class YouTubeService {
    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
    /**
     * Fetch comments for a YouTube video
     */
    fetchComments(videoUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const videoId = this.extractVideoId(videoUrl);
                if (!videoId) {
                    throw new Error('Invalid YouTube URL');
                }
                let comments = [];
                let nextPageToken = undefined;
                // Fetch first batch of comments
                do {
                    const response = yield axios_1.default.get(`${BASE_URL}/commentThreads`, {
                        params: {
                            part: 'snippet',
                            videoId: videoId,
                            maxResults: 100, // Maximum allowed by YouTube API
                            pageToken: nextPageToken,
                            key: API_KEY
                        }
                    });
                    const items = response.data.items || [];
                    // Extract relevant comment data
                    const batchComments = items.map((item) => {
                        const snippet = item.snippet.topLevelComment.snippet;
                        return {
                            id: item.id,
                            text: snippet.textDisplay,
                            authorDisplayName: snippet.authorDisplayName,
                            publishedAt: snippet.publishedAt,
                            likeCount: snippet.likeCount
                        };
                    });
                    comments = [...comments, ...batchComments];
                    nextPageToken = response.data.nextPageToken;
                    // To avoid hitting API limits, you might want to add a delay here
                    // if you're fetching a lot of comments
                } while (nextPageToken);
                return comments;
            }
            catch (error) {
                console.error('Error fetching YouTube comments:', error);
                throw error;
            }
        });
    }
}
exports.YouTubeService = YouTubeService;
