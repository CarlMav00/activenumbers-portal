import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (!token) return <AuthLayout title="Invalid link"><div className="text-center py-4"><p className="text-sm text-slate-500 mb-6">This link is missing its token.</p><Link to="/forgot-password" className="btn-primary">Request a new link</Link></div></AuthLayout>
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try { await resetPassword(token, form.password); navigate('/login') }
    catch (err) { setError(err.response?.data?.message || 'Reset failed. Link may have expired.') }
    finally { setLoading(false) }
  }
  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input type="password" className="input-field" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required autoFocus />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input type="password" className="input-field" placeholder="Same password again" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <><Spinner /> Setting password...</> : 'Set new password'}
        </button>
      </form>
    </AuthLayout>
  )
}
