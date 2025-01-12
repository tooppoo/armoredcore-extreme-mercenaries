
type MarginProps = Readonly<Partial<{
  h: number
}>>
export const Margin: React.FC<MarginProps> = ({ h = 0 }) => (
  <div style={{ height: h, display: 'block' }}></div>
)
