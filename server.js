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
const genAI = new GoogleGenerativeAI('AIzaSyBlLb4C8z8P4-y2qByi4GMewJXJAMZhPPg');

// Middleware setup
app.use(bodyParser.json());

// Route to serve the HTML content
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini API Helper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 300px;
            overflow-y: auto;
            /* Enable scrolling if content overflows */
            max-height: 80vh;
            /* Limit max height to 80% of viewport */
        }

        h1 {
            margin-bottom: 20px;
        }

        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
        }

        button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        button:hover {
            background-color: #0056b3;
        }

        button.loading {
            cursor: not-allowed;
        }

        button .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #fff;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
            position: absolute;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        #response {
            margin-top: 20px;
            font-size: 14px;
            color: #333;
            white-space: pre-wrap;
            text-align: left;
            /* Ensure response text is left-aligned */
        }

        .copy-button,
        .tweet-button {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        }

        .copy-button:hover,
        .tweet-button:hover {
            background-color: #218838;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1><strong>Generate your tweet..</strong></h1>
        <input type="text" id="userInput" placeholder="Enter your text">
        <button id="generateButton" onclick="generateAnswer()">Generate</button>
        <p id="response"></p>
        <button class="copy-button" id="copyButton" onclick="copyResponse()" style="display: none;" disabled>Copy
            Response</button>
        <button class="tweet-button" id="tweetButton" onclick="postTweet()" style="display: none;" disabled>Post as
            Tweet</button>
    </div>

    <script>
        async function generateAnswer() {
            const userInput = document.getElementById('userInput').value;
            const responseElement = document.getElementById('response');
            const generateButton = document.getElementById('generateButton');
            const copyButton = document.getElementById('copyButton');
            const tweetButton = document.getElementById('tweetButton');

            generateButton.innerHTML = '<div class="spinner"></div>';
            generateButton.classList.add('loading');

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ input: userInput })
                });

                const data = await response.json();
                responseElement.innerHTML = \`<strong>\${data.answer}</strong>\`; // Wrap in <strong> tags for bold formatting

                // Show buttons after response
                copyButton.style.display = 'inline-block';
                tweetButton.style.display = 'inline-block';

                copyButton.disabled = false; // Enable copy button after response
                tweetButton.disabled = false; // Enable tweet button after response

                animateResponse(); // Trigger animation
            } catch (error) {
                responseElement.innerText = 'Error fetching answer';
            } finally {
                generateButton.innerHTML = 'Generate';
                generateButton.classList.remove('loading');
            }
        }

        async function postTweet() {
            const responseElement = document.getElementById('response').innerText;
            try {
                const response = await fetch('/api/postTweet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tweet: responseElement })
                });
                const data = await response.json();
                alert("Tweet posted successfully!"); // Show success or error message
            } catch (error) {
                console.error('Error posting tweet:', error);
                alert('Error posting tweet');
            }
        }

        function animateResponse() {
            const responseElement = document.getElementById('response');
            responseElement.style.animation = 'none';  // Clear previous animation
            responseElement.offsetHeight; /* trigger reflow */
            responseElement.style.animation = null;  // Restart animation
        }

        function copyResponse() {
            const responseElement = document.getElementById('response');
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = responseElement.innerText;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
        }
    </script>
</body>

</html>
  `);
});

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
console.error(‘Error posting tweet:’, error);
res.status(500).json({ error: ‘Error posting tweet’ });
}
});

// Start the server
app.listen(port, () => {
console.log(Server is running at http://localhost:${port});
});
