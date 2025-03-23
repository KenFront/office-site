import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

const App = () => {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
