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
  const baseClassName = `link-card link-card--${type}`
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName

  const isExternal = type === 'external'
  const screenReaderText = isExternal ? '（外部サイト）' : '（サイト内ページ）'

  return (
    <>
      <style>{`
        .link-card {
          @apply inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200;
          @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
          @apply hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700;
          @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
          @apply text-blue-700 dark:text-blue-300 no-underline;
        }

        .link-card:hover {
          @apply no-underline;
          text-decoration: none;
        }

        .link-card--external::after {
          content: '↗';
          @apply text-xs opacity-70;
        }

        .link-card--internal::after {
          content: '→';
          @apply text-xs opacity-70;
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