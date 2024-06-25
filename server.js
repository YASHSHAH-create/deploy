require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/generate', async (req, res) => {
  const userInput = req.body.input;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(userInput);
    const response = await result.response;
    const text = await response.text();
    res.json({ answer: text });
  } catch (error) {
    console.error('Error fetching data from Gemini API:', error);
    res.status(500).json({ error: 'Error fetching data from Gemini API' });
  }
});

app.post('/api/postTweet', async (req, res) => {
  const tweetText = req.body.tweet;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="text"]', { visible: true });
    await page.type('input[name="text"]', process.env.TWITTER_USERNAME);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // Wait for username input field

    await page.type('input[name="text"]', process.env.TWITTER_EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // Wait for email input field

    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', process.env.TWITTER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const tweetTextareaSelector = 'div[data-testid="tweetTextarea_0"]';
    await page.waitForSelector(tweetTextareaSelector, { visible: true });
    await page.type(tweetTextareaSelector, tweetText);

    const tweetButtonSelector = 'div[data-testid="tweetButtonInline"]';
    await page.waitForSelector(tweetButtonSelector, { visible: true });
    await page.click(tweetButtonSelector);

    await browser.close();

    res.json({ status: 'Tweet posted successfully!' });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ error: 'Error posting tweet' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
