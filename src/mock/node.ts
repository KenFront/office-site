import { setupServer } from 'msw/node'

import { handlers } from './handlers'

// for testing
export const server = setupServer(...handlers)
