import Collapse from 'components/Collapse'
import ExternalLink from 'components/ExternalLink'

const Tutorial = () => {
  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      <Collapse title="Basic">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink
              link="https://www.freecodecamp.org/"
              name="Freecodecamp"
            />
          </li>
          <li>
            <ExternalLink link="https://roadmap.sh/" name="Roadmap" />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Interview">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink link="https://leetcode.com/" name="Leetcode" />
          </li>
        </ul>
      </Collapse>
    </div>
  )
}

export default Tutorial
