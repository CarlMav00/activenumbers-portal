import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try { await register(form.email, form.password); setDone(true) }
    catch (err) { setError(err.response?.data?.message || 'Registration failed.') }
    finally { setLoading(false) }
  }
  if (done) return (
    <AuthLayout title="Check your email">
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-navy font-medium mb-2">Verification email sent</p>
        <p className="text-sm text-slate-500 mb-6">Click the link sent to <strong>{form.email}</strong> to activate your account and get your $0.50 free credit.</p>
        <Link to="/login" className="btn-secondary">Back to sign in</Link>
      </div>
    </AuthLayout>
  )
  return (
    <AuthLayout title="Create your account" subtitle="Start with $0.50 free credit — no card required">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input-field" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input-field" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input type="password" className="input-field" placeholder="Same password again" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <><Spinner /> Creating account...</> : "Create free account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Have an account? <Link to="/login" className="text-blue-brand font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
