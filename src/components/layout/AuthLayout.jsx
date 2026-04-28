import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.js'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="https://activenumbers.io" className="flex items-center gap-2.5 mb-8">
        <img src={logoSrc} alt="Active Numbers" className="h-10 w-auto" />
      </Link>
      <div className="card w-full max-w-md p-8">
        {title && (
          <div className="mb-6">
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif"}} className="text-2xl font-semibold text-navy mb-1.5">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      <p className="mt-6 text-xs text-slate-400">
        © {new Date().getFullYear()} Active Numbers Inc. ·{' '}
        <a href="https://activenumbers.io/privacy" className="hover:text-navy underline underline-offset-2">Privacy</a>
        {' · '}
        <a href="https://activenumbers.io/terms" className="hover:text-navy underline underline-offset-2">Terms</a>
      </p>
    </div>
  )
}
