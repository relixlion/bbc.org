'use client'
import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function PrimaryButton({
  children, onClick, disabled, className = '', type = 'button',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`btn btn-primary ${className}`}>
      {children}
    </button>
  )
}

// Keep GreenButton as alias for backwards compat
export const GreenButton = PrimaryButton

export function AmberButton({
  children, onClick, disabled, className = '',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn btn-amber ${className}`}>
      {children}
    </button>
  )
}

export const GoldButton = AmberButton

export function GhostButton({
  children, onClick, disabled, className = '',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn btn-ghost ${className}`}>
      {children}
    </button>
  )
}

export function Input({
  label, className = '', ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <input {...props} className={`input-field ${className}`} />
    </div>
  )
}

export function Select({
  label, className = '', children, ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <select {...props} className={`input-field ${className}`}>{children}</select>
    </div>
  )
}

export function Badge({
  children, variant = 'emerald',
}: { children: ReactNode; variant?: 'emerald' | 'amber' | 'neutral' | 'danger' }) {
  const map = { emerald: 'pill pill-emerald', amber: 'pill pill-amber', neutral: 'pill pill-neutral', danger: 'pill pill-danger' }
  return <span className={map[variant]}>{children}</span>
}

export function Spinner() {
  return <div className="spinner" />
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
      <span className="t-subhead">{title}</span>
      {action && <button onClick={onAction} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer' }}>{action}</button>}
    </div>
  )
}

export function Alert({ children, type = 'error' }: { children: ReactNode; type?: 'error' | 'success' | 'warn' }) {
  const cls = { error: 'alert alert-error', success: 'alert alert-success', warn: 'alert alert-warn' }
  return <div className={cls[type]}>{children}</div>
}
