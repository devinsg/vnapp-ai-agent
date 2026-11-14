import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.set('port', process.env.PORT || 5001);
app.set('host', process.env.HOST || 'localhost');
app.set('secretKey', process.env.SECRET_KEY || 'vnapp-ai');

app.get('/api/status', function (req, res) {
  return res.status(200).json({
    status: true,
    timestamp: new Date().toISOString(),
  });
});

const PORT = app.get('port');
const HOST = app.get('host');
app.listen(PORT, () => {
  console.log(`Backend Agent đang chạy tại ${HOST} cổng ${PORT}`);
});