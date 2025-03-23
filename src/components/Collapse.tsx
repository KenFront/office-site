import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const Collapse = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-[80vw] rounded-2xl p-2">
      <motion.button
        animate={{
          borderRadius: isOpen
            ? '0.5rem 0.5rem 0 0'
            : '0.5rem 0.5rem 0.5rem 0.5rem',
          borderBottom: isOpen ? '2px #bfdbfe solid' : 'none'
        }}
        transition={{ duration: 0.1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-gray-100 p-3 transition hover:bg-gray-200"
      >
        <span className="text-lg font-medium">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-b-lg bg-gray-100 p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Collapse
