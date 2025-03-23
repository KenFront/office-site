import { motion } from 'motion/react'

export const sentenceVariants = {
  hidden: {},
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export const letterVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { opacity: { duration: 0 } } }
}

const Typewriter = ({ text, ...rest }: { text: string }) => (
  <motion.p
    key={text}
    variants={sentenceVariants}
    initial="hidden"
    animate="visible"
    {...rest}
  >
    {text.split('').map((char, i) => (
      <motion.span key={`${char}-${i}`} variants={letterVariants}>
        {char}
      </motion.span>
    ))}
  </motion.p>
)

export default Typewriter
