import Collapse from 'components/Collapse'
import ExternalLink from 'components/ExternalLink'

const Tool = () => {
  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      <Collapse title="Coding">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink link="https://regex101.com/" name="Regex" />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Trends">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink link="https://npmtrends.com/" name="Npm trends" />
          </li>
          <li>
            <ExternalLink
              link="https://github.com/trending"
              name="Github trends"
            />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Statistics">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink
              link="https://gs.statcounter.com/"
              name="Browser support"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.apple.com/support/app-store/"
              name="Ios version"
            />
          </li>
        </ul>
      </Collapse>
    </div>
  )
}

export default Tool
