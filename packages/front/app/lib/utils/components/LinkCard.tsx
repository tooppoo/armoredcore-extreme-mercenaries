import { Link } from 'react-router'
import type { WithChildren } from './types'
import './link-card.css'

type LinkCardType = 'internal' | 'external'

interface LinkCardProps extends WithChildren {
  to: string
  type: LinkCardType
  'aria-label'?: string
  className?: string
}

/**
 * LinkCard component for consistent link styling and accessibility
 * Provides visual distinction between internal and external links
 */
export const LinkCard: React.FC<LinkCardProps> = ({
  to,
  type,
  children,
  'aria-label': ariaLabel,
  className = '',
}) => {
  const baseClassName = `link-card link-card--${type}`
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName

  const isExternal = type === 'external'
  const screenReaderText = isExternal ? '（外部サイト）' : '（サイト内ページ）'

  return (
    <Link
      to={to}
      className={combinedClassName}
      {...(isExternal && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
    >
      {children}
      <span className="sr-only">{screenReaderText}</span>
    </Link>
  )
}