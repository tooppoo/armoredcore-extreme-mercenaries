
type MarginProps = Readonly<Partial<{
  h: number
  w: number
}>>
export const Margin: React.FC<MarginProps> = ({ h = 0, w = 0 }) => (
  <div style={{ height: h, width: w, display: 'block' }}></div>
)

export const Hr: React.FC<MarginProps> = ({ h = 2, w }) => (
  <hr style={{ marginTop: h / 2, marginBottom: h / 2, width: w }} />
)
