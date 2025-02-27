import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function YouTubeCommentsAnalyzer() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await axios.post("https://yt-analyzer-2.onrender.com/api/youtube/comments", {
        videoUrl: url
      })

      if (response.data.success) {
        localStorage.setItem("videoAnalysis", JSON.stringify(response.data.data))
        navigate("/results")
      } else {
        setError("Analysis failed. Please try again.")
      }
    } catch (err) {
      console.error("Error analyzing video:", err)
      setError("An error occurred while connecting to the server. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50">
      <Card className="w-screen">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold text-purple-600">
            YouTube Comments Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="youtube-url" className="text-sm font-medium text-gray-700">
              YouTube Video URL
            </label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button 
            onClick={handleAnalyze} 
            className="w-full text-black"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze Comments"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}