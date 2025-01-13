import PropTypes from 'prop-types'

export type ArchiveItemProps = Readonly<{
  title: string
  description: string
  imageUrl: string
  url: string
}>
export const ArchiveItem: React.FC<ArchiveItemProps> = ({
  title,
  description,
  imageUrl,
  url,
}) => (
  <a href={url} className='block p-2 border rounded-md'>
    <div>{title}</div>
    <img src={imageUrl} alt={description} />
    <div>{description}</div>
  </a>
)
ArchiveItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
}
