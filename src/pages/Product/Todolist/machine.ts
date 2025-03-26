import { createMachine, assign } from 'xstate'

type Todo = {
  id: number
  text: string
  completed: boolean
}

type AddTodo = { type: 'ADD_TODO'; text: string }
type RemoveTodo = { type: 'REMOVE_TODO'; id: number }
type ToggleTodo = { type: 'TOGGLE_TODO'; id: number }
type ReorderTodo = { type: 'REORDER_TODO'; todos: Todo[] }

const todoMachine = createMachine(
  {
    id: 'todo',
    initial: 'idle',
    types: {
      context: {} as {
        todos: Todo[]
      },
      events: {} as AddTodo | RemoveTodo | ToggleTodo | ReorderTodo
    },
    context: {
      todos: [
        { id: 1, text: 'Learn TypeScript', completed: false },
        { id: 2, text: 'Nothing', completed: false }
      ]
    },
    states: {
      idle: {
        on: {
          ADD_TODO: {
            actions: 'addTodo'
          },
          REMOVE_TODO: {
            actions: 'removeTodo'
          },
          TOGGLE_TODO: {
            actions: 'toggleTodo'
          },
          REORDER_TODO: {
            actions: 'reorderTodo'
          }
        }
      }
    }
  },
  {
    actions: {
      addTodo: assign({
        todos: ({ context, event }) => {
          switch (event.type) {
            case 'ADD_TODO':
              return [
                ...context.todos,
                {
                  id: Date.now(),
                  text: event.text,
                  completed: false
                }
              ]
            default:
              return context.todos
          }
        }
      }),
      removeTodo: assign({
        todos: ({ context, event }) => {
          switch (event.type) {
            case 'REMOVE_TODO':
              return context.todos.filter((todo) => todo.id !== event.id)
            default:
              return context.todos
          }
        }
      }),
      toggleTodo: assign({
        todos: ({ context, event }) => {
          switch (event.type) {
            case 'TOGGLE_TODO':
              return context.todos.map((todo) =>
                todo.id === event.id
                  ? { ...todo, completed: !todo.completed }
                  : todo
              )
            default:
              return context.todos
          }
        }
      }),
      reorderTodo: assign({
        todos: ({ context, event }) => {
          switch (event.type) {
            case 'REORDER_TODO':
              return event.todos
            default:
              return context.todos
          }
        }
      })
    }
  }
)

export default todoMachine
