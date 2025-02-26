# YouTube Comments Analyzer

A full-stack web application that analyzes YouTube video comments using sentiment analysis to categorize viewer sentiment and generate insights.

## Features

- Fetch comments from any YouTube video using the YouTube API
- Analyze comment sentiment using Google's Gemini AI API
- Categorize comments into "agree", "disagree", or "neutral" sentiments
- Generate insights:
  - Monthly distribution of comments
  - Sentiment analysis statistics
  - Top recurring keywords
- Dark-themed, responsive dashboard
- Export results to CSV
- Secure data storage in MongoDB with privacy protections

## Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- YouTube Data API v3
- Google Gemini API

### Frontend
- React
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Recharts for data visualization

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- YouTube API key
- Google Gemini API key

### Environment Variables

Create `.env` files for both backend and frontend:

**Backend (.env)**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/yt-analyzer
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000/api
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/adityaumale/yt-analyzer.git
cd yt-analyzer
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd ../frontend
npm run dev
```

3. Access the application at `http://localhost:5173`

## How It Works

### Backend Logic

1. **YouTube Service**:
   - Extracts video ID from YouTube URL
   - Uses YouTube API to fetch comments
   - Handles pagination to retrieve all available comments

2. **Gemini Service**:
   - Processes comment text using Google's Gemini API
   - Analyzes sentiment to categorize comments as "agree", "disagree", or "neutral"
   - Returns confidence scores for each categorization

3. **Analysis Controller**:
   - Coordinates the data flow between services
   - Generates insights from raw data:
     - Monthly distribution of comments
     - Sentiment percentages
     - Keyword extraction and frequency analysis
   - Masks usernames for privacy protection
   - Stores processed data in MongoDB

### Frontend Logic

1. **Input Page**:
   - Provides a simple form to enter a YouTube video URL
   - Validates input and sends to backend for processing
   - Shows loading state during analysis

2. **Results Dashboard**:
   - Displays analysis results in visual format
   - Shows sentiment distribution with progress bars
   - Presents monthly comment trends in bar chart
   - Displays top keywords in the comments
   - Shows sample comments with their sentiment analysis
   - Allows exporting results to CSV

## API Endpoints

- `POST /api/youtube/comments`: Analyze comments from a YouTube video
  - Request body: `{ "videoUrl": "https://www.youtube.com/watch?v=..." }`
  - Response: Analysis data including insights and processed comments

- `GET /api/youtube/test`: Test API connection
  - Response: `{ "success": true, "message": "API is working" }`

## Privacy Considerations

- User identities are masked in stored data
- Only public comments are analyzed
- No personal data is retained beyond what's necessary for analysis

