import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface Comment {
  id: string;
  text: string;
  authorDisplayName: string;
  publishedAt: string;
  likeCount: number;
}

export class YouTubeService {
  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  /**
   * Fetch comments for a YouTube video
   */
  async fetchComments(videoUrl: string): Promise<Comment[]> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      let comments: Comment[] = [];
      let nextPageToken: string | undefined = undefined;
      
      // Fetch first batch of comments
      do {
        const response: { data: { items?: any[], nextPageToken?: string } } = await axios.get(`${BASE_URL}/commentThreads`, {
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
        const batchComments = items.map((item: any) => {
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
    } catch (error) {
      console.error('Error fetching YouTube comments:', error);
      throw error;
    }
  }
}