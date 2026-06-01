import 'dotenv/config';
import express from 'express';
import path from 'path';
import apiRouter from './routes/api';
import icalRouter from './routes/ical';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', apiRouter);
app.use('/ical', icalRouter);

app.listen(PORT, () => {
  console.log(`Fostplus iCal webserver running on http://localhost:${PORT}`);
});

export default app;
