import { Cat, Home, User } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router'
import { twMerge } from 'tailwind-merge'

import PAGE from 'pages/constant'

const TABS = [
  {
    path: PAGE.Index,
    content: <Home className="hover:text-gray-200" size="20px" />
  },
  {
    path: PAGE.Profile,
    content: <User className="hover:text-gray-200" size="20px" />
  }
]

const Header = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-10 w-full">
      <div className="relative bg-gray-800 shadow-md sm:rounded-lg">
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
    </header>
  )
}

export default Header
