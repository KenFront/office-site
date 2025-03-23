import { Cat, Home, User } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router'
import { twMerge } from 'tailwind-merge'

const TABS = [
  {
    path: '/',
    content: <Home className="hover:text-gray-200" size="20px" />
  },
  {
    path: '/profile',
    content: <User className="hover:text-gray-200" size="20px" />
  }
]

const Header = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="w-full">
      <div className="relative overflow-hidden bg-gray-800 shadow-md sm:rounded-lg">
        <div className="flex flex-row items-center justify-between space-x-4 space-y-0 p-4">
          <div className="flex gap-x-2 text-gray-200">
            <Cat />
            <h2>Blog</h2>
          </div>
          <ul className="flex gap-2">
            {TABS.map((item) => (
              <motion.li
                key={item.path}
                className={twMerge(
                  'cursor-pointer',
                  pathname === item.path && 'text-gray-200'
                )}
                initial={false}
                onClick={() => {
                  if (pathname !== item.path) navigate(item.path)
                }}
              >
                {item.content}
                {pathname === item.path && (
                  <motion.div
                    className="absolute bottom-2 h-[2px] w-[20px] bg-blue-400"
                    layoutId="underline"
                  />
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Header
