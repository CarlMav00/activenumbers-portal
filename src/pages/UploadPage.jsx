import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import api from '../lib/api'

const PRICE_PER_NUMBER = 0.05

export default function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [file, setFile] = useState(null)
  const [rowCount, setRowCount] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/jobs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const jobId = data.data?.jobId || data.data?.job?.id || data.jobId || data.job?.id
      navigate(`/jobs/${jobId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const cost = rowCount != null ? (rowCount * PRICE_PER_NUMBER).toFixed(2) : null

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
                <p className="text-sm text-slate-500">{rowCount?.toLocaleString()} numbers × $0.05</p>
                <p className="text-xs text-slate-400 mt-0.5">Charged from your credit balance</p>
              </div>
              <p className="font-mono text-lg font-semibold text-navy">${cost}</p>
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
