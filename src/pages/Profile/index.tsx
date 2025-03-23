import Collapse from 'components/Collapse'

import Ability from './components/Ability'

const Profile = () => {
  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      <Collapse title="Ability">
        <Ability />
      </Collapse>
      <Collapse title="About">
        <div>WIP</div>
      </Collapse>
      <Collapse title="Experience">
        <div>WIP</div>
      </Collapse>
    </div>
  )
}

export default Profile
