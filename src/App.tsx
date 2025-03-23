import { Suspense } from 'react'
import { AnimatePresence } from 'motion/react'

import WithHeaderAndFooter from 'layout/WithHeaderAndFooter'
import ErrorBoundary from './ErrorBoundary'
import Loading from 'components/Loading'
import Pages from 'pages'

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
