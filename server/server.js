import express from 'express';
import cors from 'cors';
import db_instance from './config/Database.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

db_instance.getDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`))