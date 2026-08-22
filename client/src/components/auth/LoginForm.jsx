import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Role, getDashboardPath } from '../../constants'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)

      // After login, redirect based on role (backend only uses active/suspended status)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      const role = storedUser.role

      if (role === Role.MAIN_ADMIN) {
        navigate('/admin')
      } else if (role === Role.CATEGORY_ADMIN) {
        navigate('/admin/trainings')
      } else if (role === Role.STUDENT) {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      const message =
        err?.response?.data?.error || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
        Welcome Back
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6 font-mono">
        $ login
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Login
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <a
          href="/register"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Register
        </a>
      </p>
    </Card>
  )
}
