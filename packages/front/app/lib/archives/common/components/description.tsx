
type DescriptionProps = Readonly<{
  description: string
  className?: string
}>
export const Description: React.FC<DescriptionProps> = ({
  description,
  className,
}) => (
  <div className={className}>
    {description.split('\n').map((l, i) => (<p key={i}>{l}</p>))}
  </div>
)
