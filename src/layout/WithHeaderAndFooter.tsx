import { FC, PropsWithChildren } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router'

import Header from './Header'
import Footer from './Footer'

const WithHeaderAndFooter: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation()

  return (
    <section className="h-screen w-screen bg-gray-900 text-gray-400">
      <Header />
      <motion.div
        key={pathname}
        className="flex min-h-[80vh] items-center justify-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      <Footer />
    </section>
  )
}

export default WithHeaderAndFooter
