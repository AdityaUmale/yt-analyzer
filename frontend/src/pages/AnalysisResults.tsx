import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface SentimentPercentages {
  agreePercentage: string;
  disagreePercentage: string;
  neutralPercentage: string;
}

interface SentimentRaw {
  agree: number;
  disagree: number;
  neutral: number;
}

interface SentimentAnalysis {
  raw: SentimentRaw;
  percentages: SentimentPercentages;
}

interface MonthlyDistribution {
  [key: string]: number;
}

interface TopKeywords {
  [key: string]: number;
}

interface Insights {
  monthlyDistribution: MonthlyDistribution;
  sentimentAnalysis: SentimentAnalysis;
  topKeywords: TopKeywords;
}

interface Comment {
  id: string;
  text: string;
  authorDisplayName: string;
  maskedAuthor: string;
  publishedAt: string;
  sentiment: 'agree' | 'disagree' | 'neutral';
  confidence: number;
}

interface AnalysisData {
  videoId: string;
  videoUrl: string;
  totalComments: number;
  analyzedComments: number;
  comments: Comment[];
  insights: Insights;
}

interface MonthlyDataItem {
  month: string;
  count: number;
}

export default function AnalysisResults() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Retrieve the data from localStorage
    const storedData = localStorage.getItem("videoAnalysis")
    if (storedData) {
      setAnalysisData(JSON.parse(storedData))
    } else {
      // Redirect back if no data found
      navigate("/")
    }
  }, [navigate])

  if (!analysisData) {
    return <div className="flex min-h-screen items-center justify-center bg-[#131823] text-white">Loading...</div>
  }

  // Format percentages
  const agreePercent = parseFloat(analysisData.insights.sentimentAnalysis.percentages.agreePercentage).toFixed(1)
  const disagreePercent = parseFloat(analysisData.insights.sentimentAnalysis.percentages.disagreePercentage).toFixed(1)
  const neutralPercent = parseFloat(analysisData.insights.sentimentAnalysis.percentages.neutralPercentage).toFixed(1)

  // Convert monthly distribution object to array for chart
  const monthlyData: MonthlyDataItem[] = Object.entries(analysisData.insights.monthlyDistribution).map(([month, count]) => {
    // Convert YYYY-MM to readable month name
    // Fix for the first error - either use the year variable or destructure only what you need
    const [, monthNum] = month.split('-')  // Remove 'year' if you're not using it

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = monthNames[parseInt(monthNum) - 1]
    
    return {
      month: monthName,
      count: Number(count)
    }
  })

  // Get top keywords
  const keywordsData = Object.entries(analysisData.insights.topKeywords)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 7)

  // Export to CSV function
  const exportToCSV = () => {
    // Header row
    let csvContent = "ID,Author,Text,Published At,Sentiment,Confidence\n"
    
    // Add comment data
    analysisData.comments.forEach(comment => {
      const row = [
        comment.id,
        comment.maskedAuthor,
        `"${comment.text.replace(/"/g, '""')}"`, // Escape quotes in text
        comment.publishedAt,
        comment.sentiment,
        comment.confidence
      ].join(',')
      
      csvContent += row + "\n"
    })
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `youtube-comments-${analysisData.videoId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-[#131823] text-white p-6">
      <div className="w-screen mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Analysis Results</h1>
          <button
            onClick={exportToCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Distribution Card */}
          <div className="bg-[#1c2431] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Sentiment Distribution</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span>Agree</span>
                  <span>{agreePercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${agreePercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span>Disagree</span>
                  <span>{disagreePercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full" 
                    style={{ width: `${disagreePercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between mb-1">
                  <span>Neutral</span>
                  <span>{neutralPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${neutralPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Statistics Card */}
          <div className="bg-[#1c2431] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Comment Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#232b3a] p-4 rounded-lg">
                <div className="text-gray-400">Total Comments</div>
                <div className="text-3xl font-bold">{analysisData.totalComments}</div>
              </div>
              <div className="bg-[#223024] p-4 rounded-lg">
                <div className="text-green-400">Agree</div>
                <div className="text-3xl font-bold text-green-400">
                  {analysisData.insights.sentimentAnalysis.raw.agree}
                </div>
              </div>
              <div className="bg-[#302224] p-4 rounded-lg">
                <div className="text-red-400">Disagree</div>
                <div className="text-3xl font-bold text-red-400">
                  {analysisData.insights.sentimentAnalysis.raw.disagree}
                </div>
              </div>
              <div className="bg-[#222a39] p-4 rounded-lg">
                <div className="text-blue-400">Neutral</div>
                <div className="text-3xl font-bold text-blue-400">
                  {analysisData.insights.sentimentAnalysis.raw.neutral}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Distribution Card */}
          <div className="bg-[#1c2431] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#a0aec0' }} 
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    tick={{ fill: '#a0aec0' }} 
                    axisLine={{ stroke: '#333' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Keywords Card */}
          <div className="bg-[#1c2431] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Top Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {keywordsData.map(([word], index) => (
                <div 
                  key={index} 
                  className="bg-[#232b3a] px-3 py-2 rounded-lg text-sm"
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sample Comments Section */}
        <div className="mt-6 bg-[#1c2431] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Sample Comments</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analysisData.comments.slice(0, 10).map((comment, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  comment.sentiment === 'agree' 
                    ? 'bg-[#223024] border-l-4 border-green-500' 
                    : comment.sentiment === 'disagree' 
                    ? 'bg-[#302224] border-l-4 border-red-500' 
                    : 'bg-[#222a39] border-l-4 border-blue-500'
                }`}
              >
                <div className="font-medium text-sm mb-1">{comment.maskedAuthor}</div>
                <div className="mb-2">{comment.text}</div>
                <div className="text-xs text-gray-400">
                  {new Date(comment.publishedAt).toLocaleDateString()} • 
                  <span className={
                    comment.sentiment === 'agree' 
                      ? 'text-green-400 ml-1' 
                      : comment.sentiment === 'disagree' 
                      ? 'text-red-400 ml-1' 
                      : 'text-blue-400 ml-1'
                  }>
                    {comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)} 
                    ({(comment.confidence * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white underline"
          >
            Analyze another video
          </button>
        </div>
      </div>
    </div>
  )
}