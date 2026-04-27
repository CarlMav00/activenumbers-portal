import { Link } from 'react-router-dom'
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="https://activenumbers.io" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center shadow-sm">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" stroke="#93C5FD" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 2v12M3 6l7 4 7-4" stroke="#93C5FD" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-serif text-xl font-semibold text-navy tracking-tight">Active Numbers</span>
      </Link>
      <div className="card w-full max-w-md p-8">
        {title && (
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-semibold text-navy mb-1.5">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      <p className="mt-6 text-xs text-slate-400">
        © {new Date().getFullYear()} Active Numbers Inc.
      </p>
    </div>
  )
}
