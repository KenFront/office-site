import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

const LABEL_TEXTS = ['CSS', 'React', 'WebGL', 'Git', 'TypeScript', 'Animation']

const generateHexagon = (size: number, offsets: number[] = []) => {
  const centerX = 50,
    centerY = 50
  const points = []
  const labels = []

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const offset = offsets[i] ?? 1
    const x = centerX + size * Math.cos(angle) * offset
    const y = centerY + size * Math.sin(angle) * offset
    points.push(`${x},${y}`)

    labels.push({ x, y, label: LABEL_TEXTS[i] })
  }
  return { hexPoints: points.join(' '), labels }
}

const Ability = () => {
  const hexagonSizes = [35, 28, 21, 14, 7]
  const colors = ['transparent', '#222', '#444', '#666', '#888']

  const [vertexScales, setVertexScales] = useState([0, 0, 0, 0, 0, 0])

  const { labels } = generateHexagon(hexagonSizes[0])

  const { hexPoints: mutableHexagon } = generateHexagon(25, vertexScales)

  useEffect(() => {
    setVertexScales([0.75, 0.95, 0.6, 0.8, 0.85, 0.75])
  }, [])

  return (
    <div className="flex max-h-[50vh] flex-col items-center justify-center bg-gray-200">
      <motion.svg className="size-1/2" viewBox="0 0 100 100">
        {hexagonSizes.map((size, index) => {
          const { hexPoints } = generateHexagon(size)
          return (
            <motion.polygon
              key={index}
              points={hexPoints}
              fill="none"
              stroke={colors[index]}
              strokeWidth="2"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          )
        })}

        <motion.polygon
          points={mutableHexagon}
          fill="rgba(0, 150, 255, 0.5)"
          stroke="blue"
          strokeWidth="1"
          animate={{ points: mutableHexagon }}
          transition={{ duration: 2 }}
        />

        {labels.map(({ x, y, label }, index) => (
          <motion.text
            key={index}
            x={x}
            y={y}
            fontSize="5"
            fill="black"
            textAnchor="middle"
            dominantBaseline="middle"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {label}
          </motion.text>
        ))}
      </motion.svg>
    </div>
  )
}

export default Ability
