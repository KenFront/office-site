import { useState } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Bug, Gift, Hammer, School, Send } from 'lucide-react'

import Typewriter from 'components/Typewriter'

const CARDS = [
  {
    text: 'Document',
    icon: <BookOpen />
  },
  {
    text: 'News',
    icon: <Send />
  },
  {
    text: 'Tutorial',
    icon: <School />
  },
  {
    text: 'Bug',
    icon: <Bug />
  },
  {
    text: 'Tool',
    icon: <Hammer />
  },
  {
    text: 'Product',
    icon: <Gift />
  }
]

const Home = () => {
  const [hoverId, setHoverId] = useState('')

  return (
    <div className="grid grid-cols-1 gap-20 p-10 md:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <motion.div
          key={card.text}
          className="flex min-h-[300px] w-[200px] cursor-pointer flex-col flex-wrap items-center justify-center rounded-xl border-2 border-blue-100 hover:text-gray-100"
          whileHover={{ scale: 1.2 }}
          onHoverStart={() => setHoverId(card.text)}
          onHoverEnd={() => setHoverId('')}
        >
          <div>{card.icon}</div>
          {hoverId === card.text && <Typewriter text={card.text} />}
        </motion.div>
      ))}
    </div>
  )
}
export default Home
