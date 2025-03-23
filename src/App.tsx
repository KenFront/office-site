import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import { AnimatePresence } from 'motion/react'

import WithHeaderAndFooter from 'layout/WithHeaderAndFooter'
import ErrorBoundary from 'components/ErrorBoundary'

const Home = lazy(() => import('pages/Home'))
const Profile = lazy(() => import('pages/Profile'))
const NotFound = lazy(() => import('pages/NotFound'))

const App = () => {
  return (
    <ErrorBoundary>
      <WithHeaderAndFooter>
        <Suspense fallback={<div>Loading</div>}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </WithHeaderAndFooter>
    </ErrorBoundary>
  )
}

export default App
