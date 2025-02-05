import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import dns from 'dns';
import mongoose from 'mongoose';
import Url from './models/urlModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('connected', () => console.log('✅ Mongoose connected to DB'));

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(`${process.cwd()}/views/index.html`);
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// ✅ Check if a domain exists
const checkDomainExist = async (url) => {
  try {
    const hostName = new URL(url).hostname;
    console.log(`Checking DNS for: ${hostName}`);

    return new Promise((resolve) => {
      dns.lookup(hostName, (err) => resolve(!err));
    });
  } catch (error) {
    return false;
  }
};

// ✅ Save URL and generate short ID
const saveUrl = async (inputUrl) => {
  try {
    const existingUrl = await Url.findOne({ originalUrl: inputUrl });
    if (existingUrl) return existingUrl;

    const lastUrl = await Url.findOne().sort({ shortId: -1 });
    const newShortId = lastUrl ? lastUrl.shortId + 1 : 1;

    const newUrl = new Url({ originalUrl: inputUrl, shortId: newShortId });
    await newUrl.save();
    return newUrl;
  } catch (error) {
    console.error("Error saving URL:", error);
    return null;
  }
};

// ✅ Handle URL shortening
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ error: 'Missing URL' });

  const isUrlOk = await checkDomainExist(url);
  if (!isUrlOk) return res.json({ error: 'Invalid URL' });

  const savedUrl = await saveUrl(url);
  if (!savedUrl) return res.json({ error: 'Failed to save URL' });

  res.json({ original_url: savedUrl.originalUrl, short_url: savedUrl.shortId });
});

// ✅ Handle redirection from short URL
app.get('/api/shorturl/:number', async (req, res) => {
  const { number } = req.params;
  if (!number) return res.json({ error: 'Invalid input' });

  try {
    const requestedUrl = await Url.findOne({ shortId: number });
    if (!requestedUrl) return res.json({ error: 'No short URL found' });

    res.redirect(requestedUrl.originalUrl);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.json({ error: 'Wrong format' });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
