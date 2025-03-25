import Collapse from 'components/Collapse'
import ExternalLink from 'components/ExternalLink'

const Document = () => {
  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      <Collapse title="Social Media">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink link="https://ogp.me/" name="Og" />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Security">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy"
              name="Csp"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS"
              name="Xss"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSRF_prevention"
              name="Csrf"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies"
              name="Cookie"
            />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Performance">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
              name="PWA"
            />
          </li>
        </ul>
      </Collapse>
      <Collapse title="Coding">
        <ul className="list-disc pl-5">
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects"
              name="Javascript standard built-in"
            />
          </li>
          <li>
            <ExternalLink link="https://git-scm.com/doc" name="Git" />
          </li>
          <li>
            <ExternalLink
              link="https://nerdcave.com/tailwind-cheat-sheet"
              name="Tailwind"
            />
          </li>
          <li>
            <ExternalLink link="https://caniuse.com/" name="Browser support" />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/HTTP"
              name="Http"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/CSS"
              name="Css"
            />
          </li>
          <li>
            <ExternalLink
              link="https://developer.mozilla.org/en-US/docs/Web/HTML"
              name="Html"
            />
          </li>
        </ul>
      </Collapse>
    </div>
  )
}

export default Document
