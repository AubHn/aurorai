import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/aurorai-logo.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Logging in with', email, password)
    // TODO: Add real login logic
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <img src={logo} alt="AurorAI Logo" className="w-60 mx-auto" />
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-black p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold text-center text-white mb-6">Login</h2>

        <label className="block mb-4">
          <span className="block text-sm font-medium text-white mb-1">Email address</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#fcb900] focus:outline-none"
          />
        </label>

        <label className="block mb-6">
          <span className="block text-sm font-medium text-white mb-1">Password</span>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#fcb900] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-[#fcb900] hover:bg-yellow-400 text-white font-bold py-2 rounded-lg transition-colors"
        >
          Login
        </button>

        <div className="my-4 text-center text-white">or</div>

        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="w-full bg-[#fcb900] hover:bg-yellow-400 text-white font-bold py-2 rounded-lg transition-colors"
        >
          Sign in
        </button>

        <p className="text-sm text-center text-white mt-4 hover:underline cursor-pointer">
          Forgot password?
        </p>
      </form>
    </div>
  )
}
