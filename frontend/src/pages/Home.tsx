import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-5xl font-bold text-coffee-800 mb-4">Coffee Shop</h1>
      <p className="text-coffee-600 text-lg mb-8">
        Fresh brews, warm vibes.
      </p>
      <Link
        to="/menu"
        className="bg-coffee-600 hover:bg-coffee-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
      >
        View Menu
      </Link>
    </main>
  )
}
