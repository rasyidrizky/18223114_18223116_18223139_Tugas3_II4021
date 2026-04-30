import express from 'express';
import cors from 'cors';
import db_instance from './config/Database.js';
import authRoutes from './routes/authRoutes.js'

const app = express();

app.use(cors());
app.use(express.json());

db_instance.getDatabase();

app.use('/api/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`))