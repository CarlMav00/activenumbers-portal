import { useState, useEffect } from 'react'
import PortalLayout from '../components/layout/PortalLayout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

function Section({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs text-blue-brand hover:underline flex-shrink-0">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function AccountPage() {
  const { user } = useAuth()

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', password: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // API keys
  const [apiKeys, setApiKeys] = useState([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState(null)
  const [keyError, setKeyError] = useState('')

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [webhookSuccess, setWebhookSuccess] = useState(false)
  const [webhookError, setWebhookError] = useState('')

  useEffect(() => {
    // Load API keys
    api.get('/api-keys').then(res => {
      setApiKeys(res.data.data || res.data || [])
    }).catch(() => {}).finally(() => setKeysLoading(false))

    // Load webhook
    api.get('/portal/account').then(res => {
      const url = res.data.data?.webhookUrl || res.data.webhookUrl || ''
      setWebhookUrl(url)
    }).catch(() => {})
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.password !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    if (pwForm.password.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.password })
      setPwSuccess(true)
      setPwForm({ current: '', password: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleCreateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setKeyError('')
    setCreatingKey(true)
    try {
      const { data } = await api.post('/api-keys', { name: newKeyName.trim() })
      const key = data.data || data
      setNewKeyValue(key.key || key.apiKey)
      setApiKeys(prev => [...prev, key])
      setNewKeyName('')
    } catch (err) {
      setKeyError(err.response?.data?.message || 'Failed to create API key.')
    } finally {
      setCreatingKey(false)
    }
  }

  const handleRevokeKey = async (keyId) => {
    if (!confirm('Revoke this API key? Any integrations using it will stop working immediately.')) return
    try {
      await api.delete(`/api-keys/${keyId}`)
      setApiKeys(prev => prev.filter(k => k.id !== keyId))
    } catch (err) {
      setKeyError(err.response?.data?.message || 'Failed to revoke key.')
    }
  }

  const handleWebhookSave = async (e) => {
    e.preventDefault()
    setWebhookError('')
    setWebhookLoading(true)
    try {
      await api.post('/portal/webhook', { url: webhookUrl })
      setWebhookSuccess(true)
      setTimeout(() => setWebhookSuccess(false), 3000)
    } catch (err) {
      setWebhookError(err.response?.data?.message || 'Failed to save webhook URL.')
    } finally {
      setWebhookLoading(false)
    }
  }

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-semibold text-navy">Account</h1>

        {/* Account info */}
        <Section title="Account Details">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-medium text-navy">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Plan</p>
              <p className="text-sm font-medium text-navy capitalize">{user?.plan || 'Free'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Account ID</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-slate-500 truncate">{user?.id}</p>
                {user?.id && <CopyButton text={user.id} />}
              </div>
            </div>
          </div>
        </Section>

        {/* Change password */}
        <Section title="Change Password">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current password</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required />
            </div>
            <div>
              <label className="label">New password</label>
              <input type="password" className="input-field" placeholder="Minimum 8 characters"
                value={pwForm.password} onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input type="password" className="input-field" placeholder="Same password again"
                value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            {pwError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{pwError}</div>}
            {pwSuccess && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">Password changed successfully.</div>}
            <button type="submit" className="btn-primary" disabled={pwLoading}>
              {pwLoading ? <><Spinner /> Updating...</> : 'Update password'}
            </button>
          </form>
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          {newKeyValue && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-medium text-amber-800 mb-2">⚠️ Copy this key now — it won't be shown again</p>
              <div className="flex items-center gap-2 bg-white rounded border border-amber-200 px-3 py-2">
                <code className="text-xs font-mono text-navy flex-1 truncate">{newKeyValue}</code>
                <CopyButton text={newKeyValue} />
              </div>
              <button onClick={() => setNewKeyValue(null)} className="text-xs text-amber-600 hover:underline mt-2">Dismiss</button>
            </div>
          )}

          {keysLoading ? (
            <p className="text-sm text-slate-400">Loading keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">No API keys yet. Create one to start integrating.</p>
          ) : (
            <div className="space-y-2 mb-5">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{key.name}</p>
                    <p className="text-xs font-mono text-slate-400 truncate">{key.keyPrefix || key.key_prefix || 'an_'}••••••••••••</p>
                  </div>
                  <button onClick={() => handleRevokeKey(key.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline flex-shrink-0">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

          {keyError && <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{keyError}</div>}

          <form onSubmit={handleCreateKey} className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Key name e.g. Production"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              maxLength={50}
            />
            <button type="submit" className="btn-secondary flex-shrink-0" disabled={creatingKey || !newKeyName.trim()}>
              {creatingKey ? <Spinner /> : 'Create key'}
            </button>
          </form>
        </Section>

        {/* Webhook */}
        <Section title="Webhook">
          <p className="text-sm text-slate-500 mb-4">
            Receive a POST request to your URL when a job completes. Includes the full results payload.
          </p>
          <form onSubmit={handleWebhookSave} className="space-y-4">
            <div>
              <label className="label">Webhook URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://yourapp.com/webhooks/activenumbers"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
              />
            </div>
            {webhookError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{webhookError}</div>}
            {webhookSuccess && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">Webhook URL saved.</div>}
            <button type="submit" className="btn-primary" disabled={webhookLoading}>
              {webhookLoading ? <><Spinner /> Saving...</> : 'Save webhook URL'}
            </button>
          </form>
        </Section>

        {/* Danger zone */}
        <Section title="Data & Privacy">
          <p className="text-sm text-slate-500 mb-4">
            Under PIPEDA you have the right to request deletion of your personal data.
            Contact us and we will process your request within 30 days.
          </p>
          <a href="mailto:privacy@activenumbers.io?subject=Data deletion request" className="btn-secondary text-sm">
            Request data deletion
          </a>
        </Section>
      </div>
    </PortalLayout>
  )
}
