import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary：', error)
    console.error('detail：', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 text-center text-red-600">
          <h2>Something wrong!</h2>
          <p>
            Please contact{' '}
            <a
              className="text-blue-700 underline"
              href="mailto:flamma0917@gmail.com"
            >
              me(flamma0917@gmail.com)
            </a>
            , thanks.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
