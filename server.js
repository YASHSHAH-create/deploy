
require('dotenv').config();

// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const puppeteer = require('puppeteer');

// Initialize Express app
const app = express();
const port = 3000;

// Initialize Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Middleware setup
app.use(bodyParser.json());
app.use(express.static('public'));

// Route to handle API requests for generating response
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
    const browser = await puppeteer.launch({
      headless: false
    });
    const page = await browser.newPage();

    await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });

    console.log('Waiting for username input...');
    await page.waitForSelector('input[name="text"]', { visible: true });
    await page.type('input[name="text"]', 'YashSha73564414'); // Replace with your Twitter username
    await page.keyboard.press('Enter');
    await page.waitForSelector('input[name="text"]', { visible: true });
    await page.type('input[name="text"]', 'yash11122er@gmail.com'); // Replace with your Twitter username
    await page.keyboard.press('Enter');

    console.log('Waiting for password input...');
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', 'yshah123r'); // Replace with your Twitter password
    await page.keyboard.press('Enter');

    console.log('Waiting for navigation after login...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Login successful!');

    console.log('Attempting to post tweet...');

    // Wait for the tweet text area to become visible on the page
    const tweetTextareaSelector = 'div[data-testid="tweetTextarea_0"]';
    await page.waitForSelector(tweetTextareaSelector, { visible: true });

    // Type the tweet text into the text area
    await page.type(tweetTextareaSelector, tweetText);

    // Wait for the tweet button to become visible on the page
    const tweetButtonSelector = 'button[data-testid="tweetButtonInline"]';
    await page.waitForSelector(tweetButtonSelector, { visible: true });

    // Click on the tweet button to post the tweet
    await page.click(tweetButtonSelector);

    console.log('Tweet posted successfully!');

    await browser.close();

    res.json({ status: 'Tweet posted successfully!' });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ error: 'Error posting tweet' });
  }
});

// Route to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
