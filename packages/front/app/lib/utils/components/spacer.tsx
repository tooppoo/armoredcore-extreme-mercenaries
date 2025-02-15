type MarginProps = Readonly<
  Partial<{
    h: number
    w: number
  }>
>
export const Margin: React.FC<MarginProps> = ({ h = 0, w = 0 }) => (
  <div style={{ height: h, width: w, display: 'block' }}></div>
)

export const Hr: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-gray-700 dark:border-inherit ${className}`} />
)
