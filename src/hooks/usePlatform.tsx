import { useMedia } from 'react-use'

const usePlatform = () => {
  const isMobile = useMedia('(max-width: 767px)')
  const isTablet = useMedia('(min-width: 768px) and (max-width: 1280px)')
  const isDesktop = useMedia('(min-width: 1281px)')

  switch (true) {
    case isMobile:
      return 'Mobile'
    case isTablet:
      return 'Tablet'
    case isDesktop:
      return 'Desktop'
  }
}

export default usePlatform
