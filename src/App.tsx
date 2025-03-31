import { Suspense } from 'react'
import { AnimatePresence } from 'motion/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import Pages from './pages'
import ErrorBoundary from './ErrorBoundary'
import WithHeaderAndFooter from './layout/WithHeaderAndFooter'
import Loading from './components/Loading'

const App = () => {
  const queryClient = new QueryClient()

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <WithHeaderAndFooter>
            <Suspense fallback={<Loading />}>
              <AnimatePresence mode="wait">
                <Pages />
              </AnimatePresence>
            </Suspense>
          </WithHeaderAndFooter>
        </QueryClientProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
