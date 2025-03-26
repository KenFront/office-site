import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { motion, Reorder } from 'motion/react'
import { twMerge } from 'tailwind-merge'
import { CircleX } from 'lucide-react'

import todoMachine from './machine'

const TodoList = () => {
  const [state, send] = useMachine(todoMachine)
  const [text, setText] = useState<string>('')

  const addTodo = () => {
    if (text.trim() === '') return
    send({ type: 'ADD_TODO', text })
    setText('')
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">📝 Todo List</h1>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Something to do..."
        />
        <button className="bg-blue-500 px-4 py-2 text-white" onClick={addTodo}>
          Add
        </button>
      </div>

      <Reorder.Group
        axis="y"
        values={state.context.todos}
        onReorder={(newTodos) =>
          send({ type: 'REORDER_TODO', todos: newTodos })
        }
        className="mt-4 space-y-2"
      >
        {state.context.todos.map((todo) => (
          <Reorder.Item
            key={todo.id}
            value={todo}
            className="cursor-move border p-2"
          >
            <motion.div className="flex justify-between">
              <span
                className={twMerge(
                  'cursor-pointer break-all',
                  todo.completed && 'text-gray-500 line-through'
                )}
                onClick={() => send({ type: 'TOGGLE_TODO', id: todo.id })}
              >
                {todo.text}
              </span>
              <button
                className="cursor-pointer text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  send({ type: 'REMOVE_TODO', id: todo.id })
                }}
              >
                <CircleX />
              </button>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

export default TodoList
