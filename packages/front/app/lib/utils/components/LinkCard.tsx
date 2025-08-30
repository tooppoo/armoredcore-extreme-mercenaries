import { Link } from 'react-router'
import type { WithChildren } from './types'

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
  const baseClassName = `inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 bg-blue-50 border border-blue-200 text-blue-700 no-underline hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30 dark:hover:border-blue-600 link-card link-card--${type}`
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName

  const isExternal = type === 'external'
  const screenReaderText = isExternal ? '（外部サイト）' : '（サイト内ページ）'

  return (
    <>
      <style>{`
        .link-card--external::after {
          content: '↗';
          font-size: 0.75rem;
          line-height: 1rem;
          opacity: 0.7;
        }

        .link-card--internal::after {
          content: '→';
          font-size: 0.75rem;
          line-height: 1rem;
          opacity: 0.7;
        }
      `}</style>
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
    </>
  )
}