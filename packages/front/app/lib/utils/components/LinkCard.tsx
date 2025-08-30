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
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0.5rem;
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
          background-color: rgb(239 246 255);
          border-width: 1px;
          border-color: rgb(191 219 254);
          color: rgb(29 78 216);
          text-decoration: none;
        }

        .link-card:hover {
          background-color: rgb(219 234 254);
          border-color: rgb(147 197 253);
          text-decoration: none;
        }

        .link-card:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px rgb(59 130 246);
          box-shadow: 0 0 0 2px rgb(59 130 246), 0 0 0 4px rgb(59 130 246 / 0.2);
        }

        @media (prefers-color-scheme: dark) {
          .link-card {
            background-color: rgb(30 58 138 / 0.2);
            border-color: rgb(30 64 175);
            color: rgb(147 197 253);
          }
          
          .link-card:hover {
            background-color: rgb(30 58 138 / 0.3);
            border-color: rgb(29 78 216);
          }
        }

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