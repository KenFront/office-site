import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Code2,
  Github,
  MapPin,
  Menu,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { profile } from './content'
import Scenery from './Scenery'
import './portfolio.css'

function useAmbientSound() {
  const [enabled, setEnabled] = useState(false)
  const context = useRef<AudioContext | null>(null)
  useEffect(
    () => () => {
      void context.current?.close()
    },
    []
  )

  const toggle = async () => {
    try {
      if (enabled) {
        await context.current?.suspend()
        setEnabled(false)
        return
      }
      if (!context.current) {
        const audio = new AudioContext()
        context.current = audio
        const master = audio.createGain()
        master.gain.value = 0.035
        master.connect(audio.destination)
        ;[130.81, 164.81, 196, 246.94].forEach((frequency, index) => {
          const oscillator = audio.createOscillator()
          const gain = audio.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.value = frequency
          oscillator.detune.value = index % 2 ? 4 : -4
          gain.gain.value = 0.22
          oscillator.connect(gain)
          gain.connect(master)
          oscillator.start()
          const lfo = audio.createOscillator()
          const depth = audio.createGain()
          lfo.frequency.value = 0.12 + index * 0.035
          depth.gain.value = 0.13
          lfo.connect(depth)
          depth.connect(gain.gain)
          lfo.start()
        })
      }
      await context.current.resume()
      setEnabled(true)
    } catch {
      setEnabled(false)
    }
  }
  return { enabled, toggle }
}

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [headerStuck, setHeaderStuck] = useState(false)
  const [inSpace, setInSpace] = useState(false)
  const [night, setNight] = useState(false)
  const { enabled: soundEnabled, toggle: toggleSound } = useAmbientSound()

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('main > section[id]')
    )
    const updateActiveSection = () => {
      const current = [...sections]
        .reverse()
        .find(
          (section) =>
            section.getBoundingClientRect().top <= window.innerHeight * 0.42
        )
      if (current) setActiveSection(current.id)
      // 捲離首屏後頁首才浮出底色，首屏保持乾淨
      setHeaderStuck(window.scrollY > window.innerHeight * 0.6)
      // 場景進入太空後，介面也跟著換成深色，否則深底淺字會讀不到
      const scrollable = document.body.scrollHeight - window.innerHeight
      setInSpace(scrollable > 0 && window.scrollY / scrollable > 0.68)
    }
    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach((element) => {
      observer.observe(element)
    })
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  const navigation = [
    { id: 'about', label: '關於' },
    { id: 'contact', label: '聯絡' }
  ]

  const openContact = () => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    document
      .getElementById('contact')
      ?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' })
  }

  return (
    <div
      className={`portfolio${night ? ' is-night' : ''}${
        inSpace ? ' is-space' : ''
      }${headerStuck ? ' is-scrolled' : ''}`}
    >
      <a className="skip-link" href="#main">
        跳至主要內容
      </a>
      {/* 3D 場景固定在畫面正中央的舞台上：小木屋 → 山區露營 → 太空 */}
      <Scenery
        night={night}
        onToggleNight={() => setNight(!night)}
        onOpenContact={openContact}
      />
      <header className={`site-header${headerStuck ? ' is-stuck' : ''}`}>
        <a href="#home" className="wordmark" aria-label="Ken，回到首頁">
          ken<span>✳</span>
        </a>
        <div className="header-actions">
          <nav
            id="main-navigation"
            className={`main-nav${menuOpen ? ' is-open' : ''}`}
            aria-label="主要導覽"
          >
            {navigation.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeSection === id ? 'is-active' : ''}
                aria-current={activeSection === id ? 'location' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            className={`icon-button sound-button${
              soundEnabled ? ' sound-on' : ''
            }`}
            onClick={() => void toggleSound()}
            aria-label={soundEnabled ? '關閉環境音' : '開啟環境音'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? '關閉環境音' : '開啟環境音'}
          >
            {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button menu-toggle"
            aria-label={menuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero" id="home" aria-labelledby="hero-title">
          {/* 名字退到左欄，畫面正中央整塊留給舞台 */}
          <div className="hero-inner stage-grid section-container">
            <div className="hero-copy">
              <h1 id="hero-title">Ken Wang</h1>
              <p className="hero-role">
                Creative developer，{profile.location}
              </p>
              <a className="hero-link" href="#contact">
                找我聊聊
              </a>
            </div>
          </div>
          <a className="scroll-cue" href="#about" aria-label="向下探索關於我">
            <ArrowDown size={15} strokeWidth={1.8} />
          </a>
        </section>
        <section
          id="about"
          className="about-section"
          aria-labelledby="about-title"
        >
          <div className="about-inner stage-grid section-container">
            <div className="about-copy reveal">
              <span className="eyebrow section-eyebrow">
                <span className="section-number">01</span> A LITTLE ABOUT ME
              </span>
              <h2 id="about-title">
                A developer.
                <br />A maker.
                <br />
                <span>A curious mind.</span>
                <Sparkles className="about-spark" size={43} strokeWidth={1.4} />
              </h2>
              <p>
                我是 Ken，喜歡把想法變成能看見、能點擊、能讓人會心一笑的體驗。
              </p>
              <p>
                從一個小按鈕的手感，到一整個互動世界，相信好的網站，藏在每一個被認真對待的細節裡。
              </p>
              <a
                className="text-link light-link"
                href={profile.github}
                target="_blank"
                rel="noreferrer"
              >
                在 GitHub 看看我在做什麼 <ArrowUpRight size={18} />
              </a>
              <div className="skills-strip" aria-label="使用的技術與關注領域">
                <span>REACT</span>
                <span>TYPESCRIPT</span>
                <span>THREE.JS</span>
                <span>INTERACTION</span>
                <span>GOOD COFFEE</span>
              </div>
            </div>
            <div className="about-playground reveal">
              <span className="floating-label label-design">
                a bit of design
              </span>
              <div className="developer-card">
                <div className="developer-card-header">
                  <span>ME, IN A NUTSHELL</span>
                  <Code2 size={18} />
                </div>
                <div className="avatar-art" aria-hidden="true">
                  <div className="avatar-shirt" />
                  <div className="avatar-ear left-ear" />
                  <div className="avatar-ear right-ear" />
                  <div className="avatar-face">
                    <div className="avatar-hair" />
                    <span className="avatar-eye left-eye" />
                    <span className="avatar-eye right-eye" />
                    <span className="avatar-smile" />
                    <span className="avatar-cheek" />
                  </div>
                  <span className="avatar-wave">✌</span>
                </div>
                <div className="developer-card-name">
                  Ken Wang <span>developer</span>
                </div>
                <div className="developer-card-location">
                  <MapPin size={12} /> Taiwan, Earth
                </div>
                <div className="developer-card-footer">
                  <span>
                    <i /> ALWAYS CURIOUS
                  </span>
                  <span>↗</span>
                </div>
              </div>
              <span className="floating-label label-code">a lot of code</span>
              <span className="coffee-note">
                powered by coffee
                <br />& little moments of “what if?”
              </span>
            </div>
          </div>
        </section>
        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <div className="contact-inner stage-grid section-container">
            <div className="contact-copy reveal">
              <span className="eyebrow section-eyebrow">
                <span className="section-number">02</span> GOOD THINGS START
                WITH A HELLO
              </span>
              <h2 id="contact-title">
                Have a little
                <br />
                <span className="serif-word">something</span> in mind?
              </h2>
              <p>聊聊你的點子、分享一個有趣的計畫，或只是，打聲招呼。</p>
            </div>
            <div className="contact-action reveal">
              <span className="contact-spark" aria-hidden="true">
                ✳
              </span>
              <a
                className="contact-cta"
                href={profile.contact}
                target="_blank"
                rel="noreferrer"
              >
                Let’s make it happen
                <span>
                  <ArrowUpRight size={30} />
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-container">
        <a href="#home" className="wordmark" aria-label="Ken，回到首頁">
          ken<span>✳</span>
        </a>
        <p>
          © {new Date().getFullYear()} Ken Wang{' '}
          <span>Made with care & a little coffee.</span>
        </p>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="footer-github"
        >
          <Github size={17} /> GitHub <ArrowUpRight size={14} />
        </a>
        <a href="#home" className="back-to-top" aria-label="回到頂部">
          <ArrowUp size={19} />
        </a>
      </footer>
    </div>
  )
}
