import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initScroll } from './lib/scroll.js'
import './styles/index.css'

// Reveal styles only apply once we know scripts are running.
document.documentElement.classList.add('js')
initScroll()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
