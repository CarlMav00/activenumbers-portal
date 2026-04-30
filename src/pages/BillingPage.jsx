import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import api from '../lib/api'

export default function BillingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [billing, setBilling] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const successMsg = searchParams.get('subscribed') ? 'Subscription activated!'
    : searchParams.get('topup') ? 'Credits added to your balance!'
    : searchParams.get('card') ? 'Payment method saved!'
    : null

  useEffect(() => {
    Promise.all([
      api.get('/billing/credits'),
      api.get('/billing/transactions').catch(() => ({ data: { transactions: [] } })),
      api.get('/billing/subscription').catch(() => ({ data: { plan: 'free', status: 'none' } })),
    ]).then(([creditsRes, txRes, subRes]) => {
      const credits = creditsRes.data.balance ?? 0
      const sub = subRes.data
      const txs = txRes.data.transactions || txRes.data.data || []
      setBilling({ credits, subscription: sub })
      setTransactions(Array.isArray(txs) ? txs : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const formatCents = (c) => c != null ? `$${(c / 100).toFixed(2)}` : '—'

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold text-navy">Billing</h1>
          <Link to="/billing/card?topup=true" className="btn-primary text-sm">
            Add credits
          </Link>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="card p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : (
          <>
            {/* Balance + subscription */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Credit Balance</p>
                <p className="font-mono text-3xl font-semibold text-navy">{formatCents(billing?.credits)}</p>
                <p className="text-xs text-slate-400 mt-1">Used for all verifications</p>
                <Link to="/billing/card?topup=true" className="inline-block mt-3 text-xs text-blue-brand hover:underline">Add credits →</Link>
              </div>
              <div className="card p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Subscription</p>
                <p className="text-xl font-semibold text-navy capitalize">{billing?.subscription?.plan || 'Free'}</p>
                {billing?.subscription?.currentPeriodEnd && billing?.subscription?.plan !== 'free' && (
                  <p className="text-xs text-slate-400 mt-1">Renews {formatDate(billing.subscription.currentPeriodEnd)}</p>
                )}
                <Link to="/plans" className="inline-block mt-3 text-xs text-blue-brand hover:underline">
                  {billing?.subscription?.plan && billing.subscription.plan !== 'free' ? 'Manage plan →' : 'Upgrade plan →'}
                </Link>
              </div>
            </div>

            {/* Transaction history */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium text-navy text-sm">Transaction History</h2>
              </div>
              {transactions.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400">No transactions yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map((tx, i) => {
                    const isCredit = tx.type === 'credit' || tx.type === 'subscription'
                    return (
                      <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/billing/receipts/${tx.id}`)}>
                        <div>
                          <p className="text-sm font-medium text-navy capitalize">{tx.description || tx.type?.replace(/_/g, ' ') || 'Transaction'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.createdAt || tx.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`font-mono text-sm font-medium ${isCredit ? 'text-emerald-600' : 'text-navy'}`}>
                            {isCredit ? '+' : '-'}{formatCents(tx.amount)}
                          </p>
                          <span className="text-xs text-slate-400 hover:text-navy">Receipt →</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  )
}
