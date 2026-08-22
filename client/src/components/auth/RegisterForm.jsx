import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'

// Backend register endpoint expects: { name, email, password }
export default function RegisterForm() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email format'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setIsLoading(true)
    try {
      // Backend expects: name, email, password
      await register({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
      })
      // New users are immediately active → go to student dashboard
      navigate('/dashboard')
    } catch (err) {
      const message = err?.response?.data?.error || 'Registration failed. Please try again.'
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
        Create Your Account
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6 font-mono">
        $ register --new
      </p>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="John"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Doe"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            error={errors.lastName}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          error={errors.password}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Register
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <a
          href="/login"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Login
        </a>
      </p>
    </Card>
  )
}