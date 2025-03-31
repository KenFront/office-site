import { createRoot } from 'react-dom/client'
import 'tailwindcss/tailwind.css'

import App from './App'

async function enableMocking() {
  const { worker } = await import('./mock/browser')

  return worker.start()
}

enableMocking().then(() => {
  const container = document.getElementById('root') as HTMLDivElement
  const root = createRoot(container)

  root.render(<App />)
})
