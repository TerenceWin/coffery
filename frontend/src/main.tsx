import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './styles/bossDashboard.css'
import './styles/customerDashboard.css'
import './styles/dashboardLayout.css'
import './styles/hero.css'
import './styles/languageSwticher.css'
import './styles/loginPage.css'
import './styles/modal.css'
import './styles/utility.css'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
