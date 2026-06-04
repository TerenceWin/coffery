import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-coffee-300 mb-4">404</h1>
      <p className="text-coffee-600 text-xl mb-8">Page not found.</p>
      <Link to="/" className="text-coffee-600 hover:text-coffee-800 underline font-medium">
        Back to Home
      </Link>
    </main>
  )
}
