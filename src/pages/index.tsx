import { lazy } from 'react'

import { Routes, Route } from 'react-router'

import PAGE from './constant'

const Home = lazy(() => import('pages/Home'))
const Profile = lazy(() => import('pages/Profile'))
const Tool = lazy(() => import('pages/Tool'))
const Document = lazy(() => import('pages/Document'))
const NotFound = lazy(() => import('pages/NotFound'))
const Tutorial = lazy(() => import('pages/Tutorial'))
const Product = lazy(() => import('pages/Product'))
const Todolist = lazy(() => import('pages/Product/Todolist'))

const Pages = () => {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path={PAGE.Profile} element={<Profile />} />
      <Route path={PAGE.Tool} element={<Tool />} />
      <Route path={PAGE.Document} element={<Document />} />
      <Route path={PAGE.Tutorial} element={<Tutorial />} />
      <Route path={PAGE.Product} element={<Product />} />
      <Route path={PAGE.Todolist} element={<Todolist />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Pages
