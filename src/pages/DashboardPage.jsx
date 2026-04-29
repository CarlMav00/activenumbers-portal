import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const GRADE_STYLES = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', E: 'grade-e', F: 'grade-f' }

function GradeBadge({ grade }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-medium ${GRADE_STYLES[grade] || 'grade-f'}`}>
      {grade}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium capitalize ${s[status] || s.pending}`}>
      {status === 'processing' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"/>}
      {status}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/jobs?limit=5'),
      api.get('/billing/credits'),
    ]).then(([jobsRes, accountRes]) => {
      setJobs(jobsRes.data.data?.jobs || jobsRes.data.jobs || [])
      setCredits(accountRes.data.balance ?? null)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const formatCents = (c) => c != null ? `$${(c / 100).toFixed(2)}` : '—'

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Welcome back, {user?.email}</p>
          </div>
          <Link to="/upload" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Upload List
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Credit Balance</p>
            <p className="font-mono text-2xl font-semibold text-navy">{loading ? '—' : formatCents(credits)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Plan</p>
            <p className="text-2xl font-semibold text-navy capitalize">{user?.plan || 'Free'}</p>
          </div>
          <div className="card p-5 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Jobs Run</p>
            <p className="text-2xl font-semibold text-navy">{loading ? '—' : jobs.length}</p>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-medium text-navy">Recent Jobs</h2>
            <Link to="/upload" className="text-sm text-blue-brand hover:underline">New job →</Link>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <p className="text-sm font-medium text-navy mb-1">No jobs yet</p>
              <p className="text-xs text-slate-400 mb-4">Upload your first CSV to get started</p>
              <Link to="/upload" className="btn-primary text-sm">Upload a list</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{job.fileName || job.file_name || 'Untitled job'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(job.createdAt || job.created_at)} · {job.totalNumbers || job.total_numbers || 0} numbers</p>
                  </div>
                  <StatusBadge status={job.status} />
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Link to="/plans" className="card p-5 hover:border-blue-brand transition-colors group">
              <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <p className="text-sm font-medium text-navy">Upgrade plan</p>
              <p className="text-xs text-slate-400 mt-0.5">Get lower per-number rates</p>
            </Link>
            <Link to="/account" className="card p-5 hover:border-blue-brand transition-colors group">
              <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
              </div>
              <p className="text-sm font-medium text-navy">API access</p>
              <p className="text-xs text-slate-400 mt-0.5">Generate API keys</p>
            </Link>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
