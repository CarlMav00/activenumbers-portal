import { useAuth } from '../context/AuthContext'
export default function DashboardPage() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="font-serif text-2xl text-navy font-semibold mb-2">Portal Phase 1 Complete</h1>
        <p className="text-sm text-slate-500 mb-2">Signed in as <strong>{user?.email}</strong></p>
        <p className="text-xs text-slate-400 mb-6">Dashboard coming in Phase 2</p>
        <button onClick={logout} className="btn-secondary text-sm">Sign out</button>
      </div>
    </div>
  )
}
