import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import lawRoutes from './routes/lawRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/laws', lawRoutes);
app.use('/api/subjects', subjectRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Low Analysis API is running', version: '0.1.0' });
});

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

