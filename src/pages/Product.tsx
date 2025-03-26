import { useState } from 'react'
import { motion } from 'motion/react'
import { ListTodo } from 'lucide-react'
import { useNavigate } from 'react-router'
import { twMerge } from 'tailwind-merge'

import Typewriter from 'components/Typewriter'
import usePlatform from 'hooks/usePlatform'

import PAGE from './constant'

const CARDS = [
  {
    text: 'Todolist',
    icon: <ListTodo />,
    path: PAGE.Todolist
  }
]

const Product = () => {
  const platform = usePlatform()
  const navigate = useNavigate()
  const [hoverId, setHoverId] = useState('')

  return (
    <div className="grid grid-cols-1 gap-20 p-10 md:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <motion.div
          key={card.text}
          className={twMerge(
            'flex min-h-[300px] w-[200px] flex-col flex-wrap items-center justify-center rounded-xl border-2 border-blue-100 hover:text-gray-100',
            card.path && 'cursor-pointer'
          )}
          whileHover={{ scale: 1.2 }}
          onHoverStart={() => setHoverId(card.text)}
          onHoverEnd={() => setHoverId('')}
          onClick={() => {
            if (card.path) navigate(card.path)
          }}
        >
          <div>{card.icon}</div>
          {(hoverId === card.text || platform !== 'Desktop') && (
            <Typewriter text={card.text} />
          )}
        </motion.div>
      ))}
    </div>
  )
}
export default Product
