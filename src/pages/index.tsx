import { lazy } from 'react'

import { Routes, Route } from 'react-router'

const Home = lazy(() => import('pages/Home'))
const Profile = lazy(() => import('pages/Profile'))
const NotFound = lazy(() => import('pages/NotFound'))

const Pages = () => {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Pages
