import { Suspense } from 'react'
import { AnimatePresence } from 'motion/react'

import Pages from './pages'
import ErrorBoundary from './ErrorBoundary'
import WithHeaderAndFooter from './layout/WithHeaderAndFooter'
import Loading from './components/Loading'

const App = () => {
  return (
    <ErrorBoundary>
      <WithHeaderAndFooter>
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait">
            <Pages />
          </AnimatePresence>
        </Suspense>
      </WithHeaderAndFooter>
    </ErrorBoundary>
  )
}

export default App
