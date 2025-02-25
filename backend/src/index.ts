import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import youtubeRoutes from './routes/youtube.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/youtube', youtubeRoutes);



app.get('/', (req, res) => {
  res.send('YouTube Comment Analysis API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});