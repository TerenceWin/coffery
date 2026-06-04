import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import NotFound from './pages/NotFound'

function App() {
  return (
    <div className="min-h-screen bg-coffee-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
