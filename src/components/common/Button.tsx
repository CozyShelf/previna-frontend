import type { ReactNode } from 'react'

import BUTTON_CLASSES from '@/types/ButtonClasses'

export interface ButtonProps {
  label: string
  style: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  icon?: ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function Button({
  label,
  style,
  type = 'button',
  icon,
  disabled,
  className = '',
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BUTTON_CLASSES[style]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}
