import { BrowserRouter, Routes, Route } from "react-router-dom"
import YouTubeCommentsAnalyzer from "./pages/youtube-comments-analyzer"
import AnalysisResults from "./pages/AnalysisResults"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<YouTubeCommentsAnalyzer />} />
        <Route path="/results" element={<AnalysisResults />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App