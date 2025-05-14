import { useState, useEffect } from 'react';

function Answer() {
  const [answer, setAnswer] = useState('test message');

  useEffect(() => {
    // Function to fetch the latest data
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/get-answer');
        const data = await response.json();
        setAnswer(data.data || 'test message');
      } catch (error) {
        console.error('Error fetching data:', error);
        // If there's an error, keep the default message
      }
    };

    // Fetch immediately when the page loads
    fetchData();

    // Set up polling to check for updates every few seconds
    const intervalId = setInterval(fetchData, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h1>Latest Answer</h1>
      <p>The most recent data is: <span id="answer">{answer}</span></p>
    </div>
  );
}

export default Answer;
