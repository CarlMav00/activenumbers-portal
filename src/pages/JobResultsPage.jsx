import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import api from '../lib/api'

const GRADE_STYLES = { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', E: 'grade-e', F: 'grade-f' }
const GRADE_LABELS = {
  A: 'Verified — confirmed in-service',
  B: 'Verified — meets all conditions',
  C: 'Verified — recent activity',
  D: 'Verified — limited activity',
  E: 'Low confidence',
  F: 'Unverified',
}

function GradeBadge({ grade, large }) {
  return (
    <span className={`inline-flex items-center justify-center rounded border font-mono font-semibold ${large ? 'w-10 h-10 text-base' : 'w-7 h-7 text-xs'} ${GRADE_STYLES[grade] || 'grade-f'}`}>
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${s[status] || s.pending}`}>
      {status === 'processing' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"/>}
      {status}
    </span>
  )
}

export default function JobResultsPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef()

  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`)
      const j = data.data || data
      setJob(j)
      setNumbers(j.numbers || j.results || [])
      return j.status
    } catch (err) {
      setError('Could not load job.')
      return 'error'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob().then(status => {
      if (status === 'pending' || status === 'processing') {
        pollRef.current = setInterval(async () => {
          const s = await fetchJob()
          if (s === 'complete' || s === 'failed' || s === 'error') {
            clearInterval(pollRef.current)
          }
        }, 3000)
      }
    })
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await api.get(`/jobs/${jobId}/download`)
      const url = data.data?.url || data.url
      window.open(url, '_blank')
    } catch {
      setError('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const gradeCounts = numbers.reduce((acc, n) => {
    const g = n.grade || n.confidenceGrade || 'F'
    acc[g] = (acc[g] || 0) + 1
    return acc
  }, {})

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/dashboard" className="text-sm text-slate-400 hover:text-navy">Dashboard</Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm text-navy font-medium">Job Results</span>
            </div>
            <h1 className="font-serif text-2xl font-semibold text-navy">{job?.fileName || job?.file_name || 'Job Results'}</h1>
            {job && <p className="text-sm text-slate-400 mt-0.5">{formatDate(job.createdAt || job.created_at)} · {job.totalNumbers || job.total_numbers || 0} numbers</p>}
          </div>
          {job?.status === 'complete' && (
            <button onClick={handleDownload} disabled={downloading} className="btn-primary flex-shrink-0">
              {downloading ? <><Spinner /> Preparing...</> : <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download CSV
              </>}
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="card p-12 text-center">
            <Spinner />
            <p className="text-sm text-slate-400 mt-3">Loading job...</p>
          </div>
        ) : job ? (
          <>
            {/* Status card */}
            <div className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={job.status} />
                {(job.status === 'pending' || job.status === 'processing') && (
                  <p className="text-sm text-slate-500">Processing your list — this usually takes under a minute…</p>
                )}
                {job.status === 'complete' && (
                  <p className="text-sm text-slate-500">Verification complete · results ready to download</p>
                )}
                {job.status === 'failed' && (
                  <p className="text-sm text-red-500">Job failed — please contact support</p>
                )}
              </div>
              {job.amountCharged != null && (
                <p className="font-mono text-sm font-medium text-navy">${(job.amountCharged / 100).toFixed(2)} charged</p>
              )}
            </div>

            {/* Grade summary */}
            {job.status === 'complete' && Object.keys(gradeCounts).length > 0 && (
              <div className="card p-5">
                <h2 className="text-sm font-medium text-navy mb-4">Grade Summary</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {['A','B','C','D','E','F'].map(g => (
                    <div key={g} className="text-center">
                      <GradeBadge grade={g} large />
                      <p className="text-lg font-semibold text-navy mt-2">{gradeCounts[g] || 0}</p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5">{GRADE_LABELS[g].split('—')[0].trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numbers table */}
            {numbers.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-navy">Results ({numbers.length.toLocaleString()} numbers)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Number</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Grade</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {numbers.slice(0, 100).map((n, i) => {
                        const grade = n.grade || n.confidenceGrade || 'F'
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-mono text-navy">{n.phoneNumber || n.phone_number || n.number}</td>
                            <td className="px-6 py-3"><GradeBadge grade={grade} /></td>
                            <td className="px-6 py-3 text-slate-500">{GRADE_LABELS[grade]}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {numbers.length > 100 && (
                    <div className="px-6 py-3 border-t border-gray-100 text-xs text-slate-400">
                      Showing first 100 of {numbers.length.toLocaleString()} — download CSV for full results
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing state — no numbers yet */}
            {(job.status === 'pending' || job.status === 'processing') && numbers.length === 0 && (
              <div className="card p-12 text-center">
                <div className="w-12 h-12 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin w-6 h-6 text-blue-brand" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
                <p className="text-sm font-medium text-navy mb-1">Verifying your numbers</p>
                <p className="text-xs text-slate-400">This page will update automatically when complete</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </PortalLayout>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
