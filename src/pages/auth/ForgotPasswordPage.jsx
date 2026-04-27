import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await forgotPassword(email) } catch {}
    finally { setLoading(false); setSent(true) }
  }
  if (sent) return (
    <AuthLayout title="Check your email">
      <div className="text-center py-4">
        <p className="text-navy font-medium mb-2">Reset link sent</p>
        <p className="text-sm text-slate-500 mb-6">If <strong>{email}</strong> is registered you will receive a reset link shortly.</p>
        <Link to="/login" className="btn-secondary">Back to sign in</Link>
      </div>
    </AuthLayout>
  )
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we will send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input-field" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <><Spinner /> Sending...</> : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="text-blue-brand font-medium hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  )
}
