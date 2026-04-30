import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import api from '../lib/api'

const PLAN_RATES = { starter: 0.045, growth: 0.040, scale: 0.035, free: 0.05 }

function getTimeNotice(count) {
  if (count >= 100000) return 'Very large lists (100k+) typically take 2 hours or more. We\'ll email your results when ready.'
  if (count >= 500) return 'Large lists typically process in 30 minutes or more. We\'ll email your results when ready.'
  return null
}

export default function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [file, setFile] = useState(null)
  const [rowCount, setRowCount] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [insufficientFunds, setInsufficientFunds] = useState(false)
  const [overageInfo, setOverageInfo] = useState(null)
  const [balance, setBalance] = useState(null)
  const [plan, setPlan] = useState('free')

  useEffect(() => {
    Promise.all([
      api.get('/billing/credits').catch(() => null),
      api.get('/billing/subscription').catch(() => null),
    ]).then(([creditsRes, subRes]) => {
      if (creditsRes?.data?.balance != null) setBalance(creditsRes.data.balance)
      if (subRes?.data?.plan) setPlan(subRes.data.plan)
    })
  }, [])

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.match(/\.(csv|txt)$/i)) { setError('Please upload a CSV or TXT file.'); return }
    setError('')
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim())
      setRowCount(lines.length)
    }
    reader.readAsText(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleUpload = async (confirmOverage = false) => {
    if (!file) return
    setUploading(true)
    setError('')
    setInsufficientFunds(false)
    if (!confirmOverage) setOverageInfo(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (confirmOverage) formData.append('confirmOverage', 'true')
      const { data } = await api.post('/jobs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const jobId = data.data?.jobId || data.data?.job?.id || data.jobId || data.job?.id
      navigate(`/jobs/${jobId}`)
    } catch (err) {
      if (err.response?.status === 402) {
        const body = err.response.data
        if (body?.code === 'OVERAGE_CONFIRMATION_REQUIRED') {
          setOverageInfo(body.breakdown)
        } else {
          setInsufficientFunds(true)
        }
      } else {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Upload failed. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const pricePerNumber = PLAN_RATES[plan] ?? 0.05
  const cost = rowCount != null ? (rowCount * pricePerNumber).toFixed(2) : null

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-navy">Upload a List</h1>
          <p className="text-sm text-slate-500 mt-1">Upload a CSV or TXT file with one phone number per row.</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? 'border-blue-brand bg-blue-light' : 'border-gray-200 hover:border-blue-brand hover:bg-blue-50'} ${file ? 'hidden' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className="w-11 h-11 bg-blue-light border border-blue-border rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-blue-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            </div>
            <p className="text-sm text-slate-500"><span className="text-blue-brand font-medium">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">CSV or TXT · one number per row · max 50MB</p>
          </div>

          {/* File confirmed */}
          {file && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{rowCount != null ? `${rowCount.toLocaleString()} numbers detected` : 'Reading file...'}</p>
              </div>
              <button onClick={() => { setFile(null); setRowCount(null) }} className="text-xs text-slate-400 hover:text-navy underline flex-shrink-0">Change</button>
            </div>
          )}

          {/* Cost preview */}
          {cost != null && (
            <div className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">{rowCount?.toLocaleString()} numbers × ${pricePerNumber.toFixed(3)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {balance != null
                    ? `Charged from your credit balance of $${(balance / 100).toFixed(2)} CAD`
                    : 'Charged from your credit balance'}
                </p>
              </div>
              <p className="font-mono text-lg font-semibold text-navy">${cost}</p>
            </div>
          )}

          {rowCount != null && getTimeNotice(rowCount) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
              <p className="text-xs text-blue-700">{getTimeNotice(rowCount)}</p>
            </div>
          )}

          {overageInfo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 space-y-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                <p className="text-sm font-medium text-amber-800">Monthly limit exceeded — confirm overage charge</p>
              </div>
              <div className="text-xs text-amber-700 space-y-1">
                <div className="flex justify-between"><span>{overageInfo.includedCount.toLocaleString()} numbers at plan rate</span><span>${(overageInfo.includedCents / 100).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{overageInfo.overageCount.toLocaleString()} numbers at overage rate (${(overageInfo.overageRateCents / 100).toFixed(3)}/ea)</span><span>${(overageInfo.overageCents / 100).toFixed(2)}</span></div>
                <div className="flex justify-between font-medium text-amber-800 border-t border-amber-200 pt-1 mt-1"><span>Total charge</span><span>${(overageInfo.totalCents / 100).toFixed(2)}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOverageInfo(null)} className="btn-secondary text-xs flex-1">Cancel</button>
                <button onClick={() => handleUpload(true)} disabled={uploading} className="btn-primary text-xs flex-1">
                  {uploading ? <><Spinner /> Processing...</> : 'Confirm & pay'}
                </button>
              </div>
            </div>
          )}

          {insufficientFunds && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Insufficient credit balance</p>
              <p className="text-xs text-amber-700 mt-0.5">You don't have enough credit to verify this list.</p>
              <Link to="/billing" className="inline-block mt-2 text-xs font-medium text-amber-800 underline underline-offset-2">Add credits on the billing page →</Link>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full"
          >
            {uploading ? (
              <><Spinner /> Uploading...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                {file ? `Upload & verify ${rowCount ? rowCount.toLocaleString() + ' numbers' : ''}` : 'Select a file first'}
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Files are deleted after 90 days · PIPEDA compliant
          </p>
        </div>
      </div>
    </PortalLayout>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
