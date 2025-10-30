import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    
    async function updateCount() {
      try {
        const response = await axios.post('http://localhost:3000/server/count', { count });
        console.log('Data fetched:', response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    updateCount();
  }, [count])

  

  return (
    <>
      <h1>Hello World!</h1>
      <div className="card">
        <button onClick={() => {setCount(prev => prev + 1)}}>
          count is {count}
        </button>
      </div>
    </>
  )
}

export default App
