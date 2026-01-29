import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Nem importálunk CSS-t, mert mindent átrakunk az App-ba!
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)