import { ArrowLeft, ArrowRight, Hand, Moon, RotateCcw, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { SceneryAction, SceneryController } from './createScenery'

type Props = {
  night: boolean
  onToggleNight: () => void
  onOpenContact: () => void
}

/** 點擊場景中的物件時給的小回饋 */
const MESSAGES: Record<Exclude<SceneryAction, 'contact'>, string[]> = {
  cat: ['🐈 喵。', '🐈‍⬛ 牠翻了個身。', '🐱 尾巴甩了兩下。'],
  fire: ['🔥 柴火劈啪響了一聲。', '🔥 靠近一點，很暖。']
}

/** 目前捲動位置換算成 0~1 */
const scrollProgress = () => {
  const scrollable = document.body.scrollHeight - window.innerHeight
  return scrollable > 0 ? window.scrollY / scrollable : 0
}

export default function Scenery({
  night,
  onToggleNight,
  onOpenContact
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const controller = useRef<SceneryController | null>(null)
  const openContact = useRef(onOpenContact)
  const nightRef = useRef(night)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const messageTimer = useRef<ReturnType<typeof setTimeout>>()
  openContact.current = onOpenContact
  nightRef.current = night

  useEffect(() => {
    let cancelled = false
    const onAction = (action: SceneryAction) => {
      if (action === 'contact') {
        openContact.current()
        return
      }
      const pool = MESSAGES[action]
      setMessage(pool[Math.floor(Math.random() * pool.length)])
      clearTimeout(messageTimer.current)
      messageTimer.current = setTimeout(() => {
        setMessage('')
      }, 2700)
    }
    void import('./createScenery')
      .then(({ createScenery }) => {
        if (cancelled || !host.current) return
        try {
          controller.current = createScenery(host.current, onAction, () => {
            setStatus('error')
            controller.current?.destroy()
            controller.current = null
          })
          controller.current.setNight(nightRef.current)
          controller.current.setProgress(scrollProgress())
          setStatus('ready')
        } catch {
          setStatus('error')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      clearTimeout(messageTimer.current)
      controller.current?.destroy()
      controller.current = null
    }
  }, [])

  useEffect(() => {
    controller.current?.setNight(night)
  }, [night])

  // 把整頁的捲動位置換算成 0~1 的進度餵給場景
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      controller.current?.setProgress(scrollProgress())
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="scenery">
      {/* 舞台是畫面正中央的固定方框，內容欄位一律讓開，場景不再是背景 */}
      <div className="scenery-stage">
        <div className="scenery-canvas" ref={host} />
        {status === 'loading' && (
          <div className="scenery-loader" role="status">
            <span aria-hidden="true">✳</span>正在生火…
          </div>
        )}
        {status === 'error' && (
          <div className="scenery-fallback">
            <div className="fallback-screen">
              hello,
              <br />
              world.
            </div>
            <p>我的小小創意空間</p>
            <button
              type="button"
              className="button button-accent"
              onClick={onOpenContact}
            >
              找我聊聊
            </button>
          </div>
        )}
        {message && (
          <div className="scenery-message" role="status">
            {message}
          </div>
        )}
        {status === 'ready' && (
          <div
            className="scenery-toolbar"
            role="group"
            aria-label="3D 場景控制"
          >
            <button
              className="world-control"
              onClick={() => controller.current?.rotate(-1)}
              aria-label="向左旋轉場景"
              title="向左旋轉"
            >
              <ArrowLeft size={12} />
            </button>
            <button
              className="world-control"
              onClick={() => controller.current?.reset()}
              aria-label="重設場景視角"
              title="重設視角"
            >
              <RotateCcw size={12} />
            </button>
            <button
              className="world-control"
              onClick={() => controller.current?.rotate(1)}
              aria-label="向右旋轉場景"
              title="向右旋轉"
            >
              <ArrowRight size={12} />
            </button>
            <button
              className="world-control mode-control"
              onClick={onToggleNight}
              aria-label={
                night ? 'night owl，切換為白天' : 'day dreamer，切換為夜晚'
              }
              aria-pressed={night}
            >
              {night ? <Moon size={12} /> : <Sun size={12} />}{' '}
              {night ? 'night owl' : 'day dreamer'}
            </button>
          </div>
        )}
      </div>
      {status === 'ready' && (
        <span className="scenery-hint">
          <Hand size={12} strokeWidth={1.5} /> 拖曳可以轉動，往下捲動換個地方
        </span>
      )}
    </div>
  )
}
