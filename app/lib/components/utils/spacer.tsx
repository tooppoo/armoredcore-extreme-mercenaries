import PropTypes from 'prop-types'

type MarginProps = Readonly<Partial<{
  h: number
  w: number
}>>
export const Margin: React.FC<MarginProps> = ({ h = 0, w = 0 }) => (
  <div style={{ height: h, width: w, display: 'block' }}></div>
)
Margin.propTypes = {
  h: PropTypes.number,
  w: PropTypes.number,
}
