import { FC } from 'react'

const ExternalLink: FC<{ link: string; name: string }> = ({ link, name }) => {
  return (
    <a className="text-blue-700" href={link} rel="noreferrer" target="_blank">
      {name}
    </a>
  )
}

export default ExternalLink
