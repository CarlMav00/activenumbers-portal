import { useState, useEffect } from 'react'
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

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState(user?.plan || 'free')

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
          <a href="mailto:hello@activenumbers.io?subject=Enterprise inquiry" className="btn-secondary flex-shrink-0 text-sm">
            Contact us
          </a>
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
    </PortalLayout>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
