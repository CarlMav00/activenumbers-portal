import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import logoSrc from '../assets/logo.js'
import api from '../lib/api'

function invoiceNumber(id) {
  return 'AN-' + id.replace(/-/g, '').substring(0, 10).toUpperCase()
}

function typeLabel(type) {
  switch (type) {
    case 'subscription': return 'Subscription payment'
    case 'credit': return 'Credit top-up'
    case 'charge': return 'Verification charge'
    case 'refund': return 'Refund'
    default: return type?.replace(/_/g, ' ') || 'Transaction'
  }
}

export default function ReceiptPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/billing/transactions/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError('Receipt not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
  const formatCents = (c) => c != null ? `$${(c / 100).toFixed(2)} CAD` : '—'
  const isCredit = data?.transaction?.type === 'credit' || data?.transaction?.type === 'subscription'

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/billing" className="text-sm text-slate-400 hover:text-navy">← Back to billing</Link>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print / Save PDF
          </button>
        </div>

        {loading && <div className="card p-10 text-center text-slate-400 text-sm">Loading...</div>}
        {error && <div className="card p-10 text-center text-sm text-red-500">{error}</div>}

        {data && (
          <div className="card p-8 print:shadow-none print:border-none" id="receipt">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <img src={logoSrc} alt="Active Numbers" className="h-10 w-auto mb-2" />
                <p className="text-xs text-slate-400">activenumbers.io</p>
                <p className="text-xs text-slate-400">hello@activenumbers.io</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Receipt</p>
                <p className="font-mono text-sm font-semibold text-navy mt-1">{invoiceNumber(data.transaction.id)}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(data.transaction.createdAt)}</p>
                <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${data.transaction.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {data.transaction.status === 'succeeded' ? 'Paid' : data.transaction.status}
                </span>
              </div>
            </div>

            {/* Bill to */}
            <div className="mb-8">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Bill to</p>
              <p className="text-sm font-medium text-navy">{data.user?.full_name || 'Account holder'}</p>
              <p className="text-sm text-slate-500">{data.user?.email}</p>
            </div>

            {/* Line items */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
              <div className="bg-slate-50 px-5 py-3 grid grid-cols-12 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <span className="col-span-8">Description</span>
                <span className="col-span-2 text-center">Type</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-12 items-center border-t border-gray-100">
                <span className="col-span-8 text-sm text-navy">{data.transaction.description || typeLabel(data.transaction.type)}</span>
                <span className="col-span-2 text-center text-xs text-slate-400 capitalize">{typeLabel(data.transaction.type)}</span>
                <span className="col-span-2 text-right font-mono text-sm font-medium text-navy">{formatCents(data.transaction.amount)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-8">
              <div className="w-56">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCents(data.transaction.amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mb-3">
                  <span>Tax</span>
                  <span className="font-mono">$0.00 CAD</span>
                </div>
                <div className="flex justify-between font-semibold text-navy border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="font-mono">{formatCents(data.transaction.amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-5 text-xs text-slate-400 text-center space-y-1">
              <p>Active Numbers · activenumbers.io · hello@activenumbers.io</p>
              <p>Thank you for your business.</p>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
