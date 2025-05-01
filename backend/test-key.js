// save as test-key.js in your backend folder
require('dotenv').config();
const axios = require('axios');

console.log("Testing with API key:", process.env.OPENAI_API_KEY.substring(0, 5) + "...");

axios.post(
  'https://api.openai.com/v1/chat/completions',
  {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello" }]
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
)
.then(response => {
  console.log("SUCCESS! API is working.");
  console.log(response.data);
})
.catch(error => {
  console.error("ERROR with OpenAI API:");
  if (error.response) {
    console.error(error.response.status, error.response.data);
  } else {
    console.error(error.message);
  }
});