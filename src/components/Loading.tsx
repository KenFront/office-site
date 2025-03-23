import { motion } from 'motion/react'

const Loading = () => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      style={{
        width: ' 50px',
        height: '50px',
        borderRadius: '50%',
        border: '4px solid black',
        borderTopColor: 'skyblue',
        willChange: 'transform'
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  )
}

export default Loading
