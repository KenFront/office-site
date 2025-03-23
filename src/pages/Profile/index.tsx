import Collapse from 'components/Collapse'

import Ability from './components/Ability'

const Profile = () => {
  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      <Collapse title="Ability">
        <Ability />
      </Collapse>
      <Collapse title="About">
        <div>me</div>
      </Collapse>
      <Collapse title="Experience">
        <div>me</div>
      </Collapse>
    </div>
  )
}

export default Profile
