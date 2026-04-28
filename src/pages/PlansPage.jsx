import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    rate: '$0.045',
    volume: 'Up to 2,500 / mo',
    overage: '$0.05 / number overage',
    features: ['Batch upload', 'API access', 'Webhook delivery', 'CSV download'],
    priceEnvKey: 'VITE_STRIPE_STARTER_PRICE_ID',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 249,
    rate: '$0.04',
    volume: 'Up to 6,500 / mo',
    overage: '$0.045 / number overage',
    features: ['Batch upload', 'API access', 'Webhook delivery', 'Priority queue'],
    popular: true,
    priceEnvKey: 'VITE_STRIPE_GROWTH_PRICE_ID',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 599,
    rate: '$0.035',
    volume: 'Up to 17,000 / mo',
    overage: '$0.04 / number overage',
    features: ['Batch upload', 'API access', 'Webhook delivery', 'Priority queue'],
    priceEnvKey: 'VITE_STRIPE_SCALE_PRICE_ID',
  },
]

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 8 6">
      <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const MAX_MSG = 500

function ContactModal({ user, onClose }) {
  const [form, setForm] = useState({
    from: user?.email || '',
    subject: 'Enterprise inquiry',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const overlayRef = useRef(null)

  const remaining = MAX_MSG - form.message.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) return
    setSending(true)
    setErr('')
    try {
      await api.post('/contact', {
        from: form.from,
        subject: form.subject,
        message: form.message,
      })
      setSent(true)
    } catch {
      setErr('Something went wrong. Please email us directly at hello@activenumbers.io.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-lg font-semibold text-navy">Contact us</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="font-medium text-navy mb-1">Message sent</p>
            <p className="text-sm text-slate-500 mb-5">We'll get back to you at {form.from}.</p>
            <button onClick={onClose} className="btn-primary text-sm">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="label">Your email</label>
              <input
                type="email"
                className="input-field"
                value={form.from}
                onChange={e => setForm(p => ({ ...p, from: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Subject</label>
              <input
                type="text"
                className="input-field"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input-field resize-none"
                rows={5}
                maxLength={MAX_MSG}
                placeholder="Tell us about your use case, expected volume, or any questions…"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                required
              />
              <p className={`text-xs mt-1 text-right ${remaining <= 50 ? 'text-amber-500' : 'text-slate-400'}`}>
                {remaining} characters remaining
              </p>
            </div>
            {err && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{err}</div>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" className="btn-primary flex-1 text-sm" disabled={sending || !form.message.trim()}>
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState(user?.plan || 'free')
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    api.get('/billing/subscription').then(res => {
      const plan = res.data.data?.plan || res.data.plan
      if (plan) setCurrentPlan(plan)
    }).catch(() => {})
  }, [])

  const handleSelect = async (plan) => {
    setError('')
    setLoading(plan.id)
    try {
      // Check if they have a card on file first
      const cardRes = await api.get('/billing/payment-methods')
      const hasCard = cardRes.data.data?.hasCard || cardRes.data.hasCard || false
      if (!hasCard) {
        // Send to add card page with plan intent
        navigate(`/billing/card?plan=${plan.id}`)
        return
      }
      // Subscribe directly
      const { data } = await api.post('/billing/subscribe', { plan: plan.id })
      if (data.data?.clientSecret || data.clientSecret) {
        navigate('/billing?subscribed=true')
      } else {
        navigate('/billing?subscribed=true')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until the end of the billing period.')) return
    setLoading('cancel')
    try {
      await api.post('/billing/cancel')
      setCurrentPlan('free')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel subscription.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-navy">Plans</h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentPlan === 'free'
              ? 'You are on the Free plan — $0.50 credit included, $0.05 per number.'
              : `You are on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`}
          </p>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

        {/* One-off option */}
        <div className="card p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-navy">Pay as you go</p>
            <p className="text-sm text-slate-500 mt-0.5">$0.05 per number · no commitment · top up your balance any time</p>
          </div>
          <button onClick={() => navigate('/billing/card?topup=true')} className="btn-secondary flex-shrink-0 text-sm">
            Add credits
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id
            const isLoading = loading === plan.id
            return (
              <div key={plan.id} className={`card p-6 flex flex-col relative ${plan.popular ? 'ring-2 ring-blue-brand' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-brand text-white text-xs font-medium px-3 py-1 rounded-full">Most popular</span>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="font-serif text-3xl font-semibold text-navy">${plan.price}</span>
                    <span className="text-slate-400 text-sm mb-1">/mo</span>
                  </div>
                  <p className="text-sm font-medium text-navy mt-1">{plan.rate} / number</p>
                  <p className="text-xs text-slate-400">{plan.volume}</p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-slate-400 mb-4">{plan.overage}</p>

                {isCurrent ? (
                  <div className="text-center">
                    <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1.5 rounded-lg">Current plan</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={!!loading}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${plan.popular ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}
                  >
                    {isLoading ? <span className="flex items-center justify-center gap-2"><Spinner />Processing...</span> : `Get ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Enterprise */}
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-navy">Enterprise</p>
            <p className="text-sm text-slate-500 mt-0.5">17,000+ numbers/mo · custom pricing · dedicated support</p>
          </div>
          <button onClick={() => setContactOpen(true)} className="btn-secondary flex-shrink-0 text-sm">
            Contact us
          </button>
        </div>

        {/* Cancel subscription */}
        {currentPlan !== 'free' && (
          <div className="mt-8 text-center">
            <button onClick={handleCancel} disabled={!!loading} className="text-sm text-slate-400 hover:text-red-500 underline underline-offset-2 transition-colors">
              {loading === 'cancel' ? 'Cancelling...' : 'Cancel subscription'}
            </button>
          </div>
        )}
      </div>
      {contactOpen && <ContactModal user={user} onClose={() => setContactOpen(false)} />}
    </PortalLayout>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
