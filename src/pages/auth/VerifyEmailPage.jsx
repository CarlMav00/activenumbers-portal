import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import api from '../../lib/api'
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    if (!token) { setStatus('error'); return }
    api.get('/auth/verify-email?token=' + token).then(() => setStatus('success')).catch(() => setStatus('error'))
  }, [token])
  if (status === 'loading') return <AuthLayout title="Verifying..."><div className="flex justify-center py-8"><svg className="animate-spin h-8 w-8 text-blue-brand" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div></AuthLayout>
  if (status === 'success') return (
    <AuthLayout title="Email verified">
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-navy font-medium mb-2">Your account is active</p>
        <p className="text-sm text-slate-500 mb-6">Your $0.50 free credit has been applied.</p>
        <Link to="/login" className="btn-primary">Sign in</Link>
      </div>
    </AuthLayout>
  )
  return (
    <AuthLayout title="Verification failed">
      <div className="text-center py-4">
        <p className="text-sm text-slate-500 mb-6">This link is invalid or expired. Please register again.</p>
        <Link to="/register" className="btn-primary">Create a new account</Link>
      </div>
    </AuthLayout>
  )
}
