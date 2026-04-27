import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import PortalLayout from '../components/layout/PortalLayout'
import api from '../lib/api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: 'DM Sans, sans-serif',
      color: '#0F1E35',
      '::placeholder': { color: '#94A3B8' },
    },
    invalid: { color: '#EF4444' },
  },
  hidePostalCode: false,
}

function CardForm({ plan, topup }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('10.00')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setError('')
    setLoading(true)

    try {
      // Get setup intent from backend
      const { data } = await api.post('/billing/setup-intent')
      const clientSecret = data.data?.clientSecret || data.clientSecret

      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      })

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      // Card saved — now handle next action
      if (topup) {
        // Top up balance
        const amountCents = Math.round(parseFloat(amount) * 100)
        await api.post('/billing/topup', { amount: amountCents })
        navigate('/billing?topup=true')
      } else if (plan) {
        // Subscribe to plan
        await api.post('/billing/subscribe', { plan })
        navigate('/billing?subscribed=true')
      } else {
        navigate('/billing?card=saved')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {topup && (
        <div>
          <label className="label">Top-up amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="5"
              step="0.01"
              className="input-field pl-8"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Minimum $5.00 · added to your credit balance immediately</p>
        </div>
      )}

      <div>
        <label className="label">Card details</label>
        <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-brand focus-within:border-transparent transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>}

      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full">
        {loading ? <><Spinner />{topup ? 'Adding funds...' : plan ? 'Saving card & subscribing...' : 'Saving card...'}</> :
          topup ? `Add $${amount} to balance` : plan ? 'Save card & subscribe' : 'Save card'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Secured by Stripe · your card details are never stored on our servers
      </p>
    </form>
  )
}

export default function AddCardPage() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')
  const topup = searchParams.get('topup') === 'true'

  const title = topup ? 'Add Credits' : plan ? `Subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Add Payment Method'
  const subtitle = topup ? 'Add funds to your credit balance' : plan ? 'Save a card to start your subscription' : 'Save a card for future payments'

  return (
    <PortalLayout>
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link to={plan ? '/plans' : '/billing'} className="text-sm text-slate-400 hover:text-navy mb-3 inline-block">← Back</Link>
          <h1 className="font-serif text-2xl font-semibold text-navy">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="card p-6">
          <Elements stripe={stripePromise}>
            <CardForm plan={plan} topup={topup} />
          </Elements>
        </div>
      </div>
    </PortalLayout>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}
