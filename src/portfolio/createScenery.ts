import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export type SceneryAction = 'cat' | 'fire' | 'contact'
export type SceneryController = {
  setNight: (night: boolean) => void
  /** 0 = 頁面最上方（小木屋），1 = 最下方（太空） */
  setProgress: (progress: number) => void
  rotate: (direction: number) => void
  reset: () => void
  destroy: () => void
}

type V3 = [number, number, number]
/** 一個零件在某個場景中的樣子；尺寸一律用 scale 表達，變形才能連續內插 */
type State = { p: V3; r?: V3; s: V3; c: string }
type Kind = 'box' | 'cyl' | 'cone' | 'ball' | 'star'

/** 三個場景的天空色，捲動時連續內插並寫回 CSS */
const SKY = ['#f6f2e9', '#cdd9de', '#0d1224']
/** 每個場景在捲動軸上的位置 */
const STOPS = [0.06, 0.5, 0.94]
/** 光線氛圍：室內暖 → 山區冷亮 → 太空暗 */
const MOOD = [
  { sky: '#ffe9c4', ground: '#7a6a58', ambient: 2.0, key: 1.7, fill: 0.6 },
  { sky: '#dceaf5', ground: '#6d7f63', ambient: 2.5, key: 2.7, fill: 1.2 },
  { sky: '#2b3b66', ground: '#141a30', ambient: 1.5, key: 1.15, fill: 0.85 }
]
/** 某個場景中不存在的零件縮到近乎 0，而非隱藏，進出才會是連續的 */
const GONE: V3 = [0.001, 0.001, 0.001]

export function createScenery(
  host: HTMLDivElement,
  onAction: (action: SceneryAction) => void,
  onError: () => void
): SceneryController {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 90)
  camera.position.set(7.2, 5.6, 9)
  camera.lookAt(0, 1.35, 0)
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.setAttribute(
    'aria-label',
    '可拖曳旋轉的 3D 場景，隨著頁面捲動由小木屋逐漸變形重組為山區露營，最後散開成太空與滿天星星'
  )
  canvas.setAttribute('role', 'img')
  host.appendChild(canvas)

  const root = new THREE.Group()
  scene.add(root)

  // 五角星：厚度與倒角讓它在側光下有面，不會看起來像貼紙
  const starShape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? 0.2 : 0.5
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) starShape.moveTo(x, y)
    else starShape.lineTo(x, y)
  }
  starShape.closePath()
  const starGeometry3D = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.04,
    bevelSegments: 1,
    curveSegments: 1
  })
  // 置中後尺寸才等同其他單位幾何，scale 可以直接沿用
  starGeometry3D.center()

  // 共用的單位幾何：整個場景只有五種形狀，尺寸交給 scale
  const GEO: Record<Kind, THREE.BufferGeometry> = {
    box: new RoundedBoxGeometry(1, 1, 1, 3, 0.12),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
    cone: new THREE.ConeGeometry(0.5, 1, 16),
    ball: new THREE.SphereGeometry(0.5, 20, 14),
    star: starGeometry3D
  }

  type Part = {
    object: THREE.Mesh
    states: [State, State, State]
    colors: [THREE.Color, THREE.Color, THREE.Color]
    /** 火焰之類會自體跳動的零件 */
    flicker?: number
  }
  const parts: Part[] = []
  const interactive: THREE.Object3D[] = []
  const bubbles: THREE.MeshStandardMaterial[] = []

  const part = (
    kind: Kind,
    states: [State, State, State],
    options: {
      shadow?: boolean
      emissive?: boolean
      flicker?: number
      /** 掛在哪個群組底下，預設 root；人物的四肢掛在人物群組上 */
      parent?: THREE.Object3D
    } = {}
  ) => {
    const material = new THREE.MeshStandardMaterial({
      color: states[0].c,
      roughness: 0.82
    })
    if (options.emissive) {
      material.emissive = new THREE.Color(states[0].c)
      material.emissiveIntensity = 1.05
    }
    const object = new THREE.Mesh(GEO[kind], material)
    object.castShadow = options.shadow !== false
    object.receiveShadow = options.shadow !== false
    ;(options.parent ?? root).add(object)
    parts.push({
      object,
      states,
      colors: [
        new THREE.Color(states[0].c),
        new THREE.Color(states[1].c),
        new THREE.Color(states[2].c)
      ],
      flicker: options.flicker
    })
    return object
  }
  const act = (object: THREE.Object3D, name: SceneryAction) => {
    object.userData.action = name
    interactive.push(object)
  }

  // =====================================================================
  // 零件表：每一列都是「同一個東西」在小木屋 / 露營 / 太空中的樣子
  // =====================================================================

  // 地板木條 → 草地的同心緩坡 → 環繞行星的碎板
  for (let i = 0; i < 9; i++) {
    const a = i / 8
    const angle = a * Math.PI * 2
    part('box', [
      {
        p: [0, 0, -3.8 + i * 0.95],
        s: [9, 0.16, 0.92],
        c: i % 2 ? '#a9784e' : '#b98a5c'
      },
      {
        p: [0, -0.12 - a * 0.05, 0],
        s: [11 - a * 1.2, 0.3, 9 - a * 1.1],
        c: i % 2 ? '#7d9a63' : '#8dab6f'
      },
      {
        p: [
          Math.cos(angle) * 5.6,
          -1.2 + Math.sin(a * 5) * 1.6,
          Math.sin(angle) * 5.6
        ],
        r: [a * 2, angle, a * 1.4],
        s: [1.7, 0.22, 1.2],
        c: i % 2 ? '#4a4f6b' : '#3d4159'
      }
    ])
  }

  // 牆上的原木 → 樹幹與山腳岩層 → 漂浮的柱狀碎片
  for (let i = 0; i < 10; i++) {
    const back = i < 5
    const level = i % 5
    const treeX = [-3.6, -4.4, 3.8, 4.5, -2.6][level]
    const treeZ = [-2.4, -0.4, -2.8, -0.8, 2.6][level]
    const angle = (i / 10) * Math.PI * 2
    part('cyl', [
      back
        ? {
            p: [0, 0.34 + level * 0.56, -4.3],
            r: [0, 0, Math.PI / 2],
            s: [0.56, 9, 0.56],
            c: '#c69a6b'
          }
        : {
            p: [-4.3, 0.34 + level * 0.56, 0],
            r: [Math.PI / 2, 0, 0],
            s: [0.56, 8.6, 0.56],
            c: '#b98a5c'
          },
      back
        ? {
            p: [treeX, 0.42, treeZ],
            r: [0, 0, 0],
            s: [0.3, 0.85, 0.3],
            c: '#6b4b32'
          }
        : {
            p: [treeX * 1.5, 0.1, treeZ - 4.5],
            r: [0, level, 0],
            s: [2.6, 0.5, 2.2],
            c: '#6b7f92'
          },
      {
        p: [
          Math.cos(angle) * 7.5,
          1.6 + Math.sin(angle * 2) * 2.6,
          Math.sin(angle) * 7.5
        ],
        r: [angle, angle * 1.3, 0.4],
        s: [0.34, 1.9, 0.34],
        c: '#575d7e'
      }
    ])
  }

  // 壁爐主體 → 帳篷 → 火箭本體（整段旅程最明顯的變形主角）
  const rocket = part('box', [
    { p: [-1.2, 1.7, -3.9], s: [2.6, 3.4, 0.7], c: '#8d8478' },
    {
      p: [-1.9, 0.09, 0.4],
      r: [0, 0.42, 0],
      s: [3.6, 0.18, 3.6],
      c: '#c9a06a'
    },
    { p: [2.6, 3.6, -1.2], r: [0, 0, -0.3], s: [0.95, 2.6, 0.95], c: '#eceff5' }
  ])
  act(rocket, 'contact')
  // 爐口 → 帳篷門 → 火箭舷窗
  part('box', [
    { p: [-1.2, 0.68, -3.55], s: [1.5, 1.35, 0.5], c: '#2c2723' },
    {
      p: [-1.62, 0.52, 1.36],
      r: [0, 0.42, 0],
      s: [0.8, 1.05, 0.1],
      c: '#8a5f33'
    },
    {
      p: [2.72, 4.1, -0.85],
      r: [0, 0, -0.3],
      s: [0.44, 0.44, 0.2],
      c: '#22304f'
    }
  ])
  // 壁爐橫樑 → 帳篷主樑 → 火箭尾翼
  part('box', [
    { p: [-1.2, 2.5, -3.75], s: [3, 0.26, 0.9], c: '#9c7043' },
    {
      p: [-1.9, 2.62, 0.4],
      r: [0, 0.42, 0.12],
      s: [0.1, 0.9, 0.1],
      c: '#7d6448'
    },
    {
      p: [2.6, 2.5, -1.2],
      r: [0, 0.8, -0.3],
      s: [1.5, 0.9, 0.14],
      c: '#c9455f'
    }
  ])
  // 藏在壁爐裡 → 帳篷的三角剖面 → 火箭鼻錐
  part('cone', [
    { p: [-1.2, 1.2, -3.9], s: GONE, c: '#9c7043' },
    { p: [-1.9, 1.25, 0.4], r: [0, 0.42, 0], s: [3.3, 2.4, 3.3], c: '#d8a15c' },
    { p: [2.6, 5.4, -1.2], r: [0, 0, -0.3], s: [1.05, 1.5, 1.05], c: '#c9455f' }
  ])

  // 火：壁爐 → 營火 → 火箭尾焰，三個場景都在燒
  const FIRE = [
    { a: -3.5, s: 1, c: ['#ff8a3d', '#ff8a3d', '#ff8a3d'] },
    { a: -3.5, s: 0.68, c: ['#ffc247', '#ffc247', '#ffb347'] },
    { a: -3.5, s: 0.4, c: ['#fff0b8', '#fff0b8', '#ffe08a'] }
  ]
  const flames = FIRE.map((f, i) =>
    part(
      'cone',
      [
        {
          p: [-1.2, 0.55 - i * 0.05, f.a],
          s: [0.62 * f.s, 0.78 * f.s, 0.62 * f.s],
          c: f.c[0]
        },
        {
          p: [1.5, 0.42 - i * 0.06, 0.9],
          s: [0.72 * f.s, 0.9 * f.s, 0.72 * f.s],
          c: f.c[1]
        },
        {
          p: [2.16, 1.75 - i * 0.22, -1.42],
          r: [Math.PI, 0, -0.3],
          s: [0.5 * f.s, 1.1 * f.s, 0.5 * f.s],
          c: f.c[2]
        }
      ],
      { shadow: false, emissive: true, flicker: 9 + i * 3 }
    )
  )
  const fireLight = new THREE.PointLight('#ffab52', 3.4, 10, 2)
  root.add(fireLight)
  act(flames[0], 'fire')

  // 壁爐邊的石頭 → 營火石圈 → 隕石坑
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const side = i < 4 ? -1 : 1
    part('ball', [
      {
        p: [-1.2 + side * (0.62 + (i % 4) * 0.16), 0.2 + (i % 2) * 0.9, -3.5],
        s: [0.44, 0.34, 0.44],
        c: i % 2 ? '#a09689' : '#8d8478'
      },
      {
        p: [1.5 + Math.cos(angle) * 0.78, 0.1, 0.9 + Math.sin(angle) * 0.78],
        s: [0.36, 0.26, 0.36],
        c: i % 2 ? '#9a948b' : '#857f77'
      },
      {
        p: [
          Math.cos(angle) * 1.9,
          -2.2 + Math.sin(angle * 1.5) * 0.7,
          Math.sin(angle) * 1.9
        ],
        s: [0.9, 0.3, 0.9],
        c: '#3d4159'
      }
    ])
  }

  // 柴薪 → 營火的柴 → 火箭噴口
  for (let i = 0; i < 3; i++) {
    part('cyl', [
      {
        p: [-1.2 + (i - 1) * 0.32, 0.18 + (i === 2 ? 0.26 : 0), -3.5],
        r: [0, 0, Math.PI / 2],
        s: [0.22, 1.1, 0.22],
        c: '#6f4c30'
      },
      {
        p: [1.5 + (i - 1) * 0.26, 0.16, 0.9 - (i - 1) * 0.24],
        r: [0, i * 1.1, Math.PI / 2],
        s: [0.2, 1, 0.2],
        c: '#6f4c30'
      },
      {
        p: [2.6 + (i - 1) * 0.06, 2.32, -1.2],
        r: [0, 0, -0.3],
        s: [0.7 - i * 0.06, 0.18, 0.7 - i * 0.06],
        c: '#b9c0d0'
      }
    ])
  }

  // 書架上的書 → 營地小物 → 火箭側板
  const TRIO = ['#c96f5a', '#d9ad57', '#6b8fa8']
  for (let i = 0; i < 3; i++) {
    part('box', [
      { p: [1.3 + i * 0.34, 2.58, -3.9], s: [0.22, 0.6, 0.34], c: TRIO[i] },
      {
        p: [2.9 + (i - 1) * 0.3, 0.56, 0.1],
        r: [0, -1.1, 0],
        s: [0.24, 0.12, 0.7],
        c: i === 1 ? '#c2603f' : '#8a5f33'
      },
      {
        p: [3.35, 3.4 - i * 0.5, -1.05],
        r: [0, 0, -0.3],
        s: [0.1, 0.36, 0.5],
        c: i === 1 ? '#c9455f' : '#8f9ab5'
      }
    ])
  }

  // 層架 → 折疊椅座 → 太陽能板
  part('box', [
    { p: [1.9, 2.2, -3.9], s: [2.4, 0.16, 0.5], c: '#a9784e' },
    { p: [2.9, 0.52, 0.1], r: [0, -1.1, 0], s: [0.8, 0.12, 0.8], c: '#c2603f' },
    {
      p: [1.35, 3.6, -1.5],
      r: [0, 0.4, -0.3],
      s: [1.5, 0.08, 0.9],
      c: '#3d5f9e'
    }
  ])

  // 地毯 → 營地空地 → 行星本體
  part('cyl', [
    { p: [0.5, 0.11, 0.6], s: [5, 0.06, 3.4], c: '#b8484f' },
    { p: [0.4, 0.06, 0.6], s: [7.4, 0.05, 5.4], c: '#8dab6f' },
    { p: [0, -3.6, 0], s: [6.2, 5.4, 6.2], c: '#59608a' }
  ])
  part('cyl', [
    { p: [0.5, 0.14, 0.6], s: [3.7, 0.06, 2.5], c: '#cf6a63' },
    { p: [0.4, 0.09, 0.6], s: [5.4, 0.05, 3.9], c: '#7d9a63' },
    { p: [0, -3.3, 0.6], s: [5.4, 4.6, 5.4], c: '#646c9c' }
  ])

  // 小邊桌 → 折疊椅腳 → 漂浮平台
  part('cyl', [
    { p: [-2.2, 0.78, 0.9], s: [1.24, 0.1, 1.24], c: '#9c7043' },
    { p: [2.9, 0.3, 0.1], s: [0.1, 0.6, 0.1], c: '#4e4a44' },
    {
      p: [-3.4, 1.4, 1.6],
      r: [0.2, 0, 0.15],
      s: [1.8, 0.16, 1.8],
      c: '#454b6b'
    }
  ])

  // 沙發座墊 → 營地的原木長凳 → 漂浮碎板
  part('box', [
    {
      p: [-2.55, 0.48, -0.9],
      r: [0, 1.5, 0],
      s: [1.9, 0.34, 0.95],
      c: '#7f8f7a'
    },
    {
      p: [2.55, 0.3, 2],
      r: [0, -0.75, 0],
      s: [1.7, 0.26, 0.55],
      c: '#8a6b4a'
    },
    {
      p: [-4.2, 0.6, 3.2],
      r: [0.4, 0.6, 0.3],
      s: [2, 0.24, 1.2],
      c: '#4a5170'
    }
  ])
  // 沙發椅背 → 長凳旁的備用柴 → 另一塊碎板
  part('box', [
    {
      p: [-2.95, 0.85, -0.9],
      r: [0, 1.5, 0],
      s: [1.9, 0.75, 0.34],
      c: '#6d7c69'
    },
    {
      p: [2.95, 0.16, 2.5],
      r: [0, -0.75, 0],
      s: [1.2, 0.24, 0.34],
      c: '#6f4c30'
    },
    {
      p: [-3.4, -0.4, 2.4],
      r: [0.2, 1.1, 0.5],
      s: [1.4, 0.22, 0.9],
      c: '#3d4159'
    }
  ])

  // 桌上的盆栽 → 樹冠 → 漂浮的小石
  for (let i = 0; i < 4; i++) {
    const treeX = [-3.6, -4.4, 3.8, 4.5][i]
    const treeZ = [-2.4, -0.4, -2.8, -0.8][i]
    part('cone', [
      i === 0
        ? { p: [-2.04, 1.2, 0.95], s: [0.5, 0.7, 0.5], c: '#4a7a55' }
        : { p: [-2.04, 0.9, 0.95], s: GONE, c: '#4a7a55' },
      { p: [treeX, 1.55, treeZ], s: [1.3, 2.4, 1.3], c: '#3f6b4a' },
      {
        p: [-5 + i * 3.2, 4.6 + (i % 2) * 1.4, -3.6 - (i % 2) * 1.2],
        r: [0.3, i, 0],
        s: [0.5, 0.7, 0.5],
        c: '#6b7398'
      }
    ])
  }

  // 窗景裡的小山 → 真正的遠山 → 太空中的尖石
  for (let i = 0; i < 3; i++) {
    const mx = [-4.2, 0.4, 4.6][i]
    const mr = [3.4, 4.4, 3.0][i]
    const mh = [4.6, 5.8, 4.2][i]
    const mz = [-6.5, -7.5, -6.2][i]
    part('cone', [
      { p: [-2.9, 1.95, -3.9], s: [0.28 + i * 0.06, 0.3, 0.06], c: '#cfe4ef' },
      {
        p: [mx, mh / 2 - 0.6, mz],
        s: [mr * 2, mh, mr * 2],
        c: ['#6b7f92', '#5b7085', '#7a8ea1'][i]
      },
      {
        p: [mx * 1.6, 6 + i * 1.2, mz - 2],
        r: [0.4, i, 0.2],
        s: [1.5, 2.2, 1.5],
        c: '#3a4166'
      }
    ])
    part('cone', [
      { p: [-2.9, 2.3, -3.88], s: [0.14, 0.12, 0.04], c: '#eef2f5' },
      {
        p: [mx, mh * 0.86 - 0.6, mz],
        s: [mr * 0.64, mh * 0.3, mr * 0.64],
        c: '#eef2f5'
      },
      {
        p: [mx * 1.6, 6.8 + i * 1.2, mz - 2],
        r: [0.4, i, 0.2],
        s: [0.5, 0.8, 0.5],
        c: '#8f9ab5'
      }
    ])
  }

  // 窗框 → 帳篷側掀 → 漂在遠方的窗框殘片
  part('box', [
    { p: [-2.9, 1.95, -3.96], s: [1.5, 1.4, 0.14], c: '#8d6440' },
    { p: [-3.1, 1.1, 0.4], r: [0, 0.42, 0], s: [0.14, 1.6, 1.9], c: '#c98f4e' },
    {
      p: [-5.2, 5.5, -7.4],
      r: [0.5, 0.5, 0.28],
      s: [2.8, 0.26, 2.1],
      c: '#4a5170'
    }
  ])

  // ---------- 貓：三個場景都在，是最直接的銜接線索 ----------
  const makeCat = (
    fur: string,
    dark: string,
    states: [State, State, State]
  ) => {
    const cat = new THREE.Group()
    root.add(cat)
    const furMat = new THREE.MeshStandardMaterial({
      color: fur,
      roughness: 0.85
    })
    const darkMat = new THREE.MeshStandardMaterial({
      color: dark,
      roughness: 0.85
    })
    const body = new THREE.Mesh(GEO.ball, furMat)
    body.scale.set(0.78, 0.42, 0.58)
    body.position.y = 0.22
    body.castShadow = true
    cat.add(body)
    const head = new THREE.Mesh(GEO.ball, furMat)
    head.scale.setScalar(0.42)
    head.position.set(0.19, 0.34, 0.03)
    head.castShadow = true
    cat.add(head)
    const earGeo = new THREE.ConeGeometry(0.095, 0.18, 3)
    ;[-0.11, 0.11].forEach((dx) => {
      const ear = new THREE.Mesh(earGeo, darkMat)
      ear.position.set(0.19 + dx, 0.5, 0.04)
      ear.rotation.z = dx > 0 ? -0.22 : 0.22
      cat.add(ear)
    })
    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.26, 0.16, 0.12),
          new THREE.Vector3(-0.34, 0.15, 0.32),
          new THREE.Vector3(-0.04, 0.13, 0.35),
          new THREE.Vector3(0.14, 0.15, 0.2)
        ]),
        18,
        0.062,
        6,
        false
      ),
      darkMat
    )
    cat.add(tail)
    // 太空段才浮現的頭盔
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: '#bcd8ef',
      roughness: 0.1,
      transparent: true,
      opacity: 0
    })
    const bubble = new THREE.Mesh(GEO.ball, bubbleMat)
    bubble.scale.setScalar(0.86)
    bubble.position.set(0.19, 0.34, 0.03)
    cat.add(bubble)
    bubbles.push(bubbleMat)
    act(cat, 'cat')
    return { cat, head, states }
  }
  const cats = [
    makeCat('#c7905e', '#a06d42', [
      { p: [-0.5, 0.16, -1.5], r: [0, 0.6, 0], s: [1, 1, 1], c: '#c7905e' },
      { p: [0.55, 0.12, 1.9], r: [0, -0.5, 0], s: [1, 1, 1], c: '#c7905e' },
      { p: [1.9, 2.9, 0.7], r: [0.3, -0.5, 0.2], s: [1, 1, 1], c: '#c7905e' }
    ]),
    makeCat('#3f3a36', '#2a2724', [
      {
        p: [1.6, 0.16, 0.9],
        r: [0, 2.4, 0],
        s: [0.85, 0.85, 0.85],
        c: '#3f3a36'
      },
      {
        p: [-0.4, 0.12, 2.2],
        r: [0, 1.7, 0],
        s: [0.85, 0.85, 0.85],
        c: '#3f3a36'
      },
      {
        p: [-2.4, 3.9, 1.2],
        r: [-0.2, 1.7, -0.3],
        s: [0.85, 0.85, 0.85],
        c: '#3f3a36'
      }
    ]),
    makeCat('#e0dcd2', '#bdb6a8', [
      {
        p: [1.2, 0.16, 1.5],
        r: [0, -1.1, 0],
        s: [0.9, 0.9, 0.9],
        c: '#e0dcd2'
      },
      {
        p: [2.4, 0.12, 1.4],
        r: [0, -1.4, 0],
        s: [0.9, 0.9, 0.9],
        c: '#e0dcd2'
      },
      {
        p: [0.2, 5.1, -0.4],
        r: [0.4, -1.4, 0.5],
        s: [0.9, 0.9, 0.9],
        c: '#e0dcd2'
      }
    ])
  ]

  // ---------- 人：沙發上看書 → 營地烤肉 → 太空人 ----------
  // 人物是一個群組，群組本身有三組世界座標，四肢再各自存三組「局部」姿勢，
  // 所以捲動時是同一個人從坐姿站起來、再飄到無重力，不是換一個模型
  const person = new THREE.Group()
  root.add(person)
  const SKIN = '#e8b98f'
  const HAIR = '#3a2c24'
  const SHIRT = '#c2603f'
  const PANTS = '#4d5a6b'
  const SUIT = '#eceff5'
  const SUIT_LEG = '#dfe3ee'
  const personStates: [State, State, State] = [
    { p: [-2.68, 0.08, -0.9], r: [0, 1.5, 0], s: [1, 1, 1], c: SHIRT },
    { p: [0.72, 0.04, -0.2], r: [0, 0.62, 0], s: [1, 1, 1], c: SHIRT },
    { p: [-2.1, 2.3, 1.7], r: [-0.3, 0.75, 0.22], s: [1, 1, 1], c: SUIT }
  ]
  const limb = (kind: Kind, states: [State, State, State]) =>
    part(kind, states, { parent: person })

  // 大腿：坐著往前平放 → 站著微蹲 → 無重力屈膝
  // 平放只繞 X 轉 90°，多加 Z 軸旋轉會在 XYZ 順序下疊成斜的
  ;[-1, 1].forEach((side, index) => {
    limb('cyl', [
      {
        p: [side * 0.16, 0.57, 0.26],
        r: [1.57, 0, 0],
        s: [0.2, 0.56, 0.2],
        c: PANTS
      },
      {
        p: [side * 0.17, 0.66, 0.06],
        r: [0.25, 0, 0],
        s: [0.2, 0.6, 0.2],
        c: PANTS
      },
      {
        p: [side * 0.2, 0.62 + index * 0.05, 0.2 - index * 0.09],
        r: [0.72 - index * 0.3, 0, side * -0.15],
        s: [0.22, 0.6, 0.22],
        c: SUIT_LEG
      }
    ])
    limb('cyl', [
      {
        p: [side * 0.16, 0.3, 0.56],
        r: [0.12, 0, 0],
        s: [0.17, 0.54, 0.17],
        c: PANTS
      },
      {
        p: [side * 0.17, 0.2, 0.14],
        r: [-0.2, 0, 0],
        s: [0.17, 0.54, 0.17],
        c: PANTS
      },
      {
        p: [side * 0.24, 0.22 + index * 0.08, 0.52 - index * 0.12],
        r: [0.16 - index * 0.26, 0, side * -0.1],
        s: [0.19, 0.56, 0.19],
        c: SUIT_LEG
      }
    ])
  })

  // 軀幹：靠著椅背 → 前傾看火 → 太空衣鼓一點
  limb('box', [
    { p: [0, 1, -0.04], r: [-0.12, 0, 0], s: [0.5, 0.7, 0.32], c: SHIRT },
    { p: [0, 1.28, 0.04], r: [0.22, 0, 0], s: [0.5, 0.72, 0.32], c: SHIRT },
    { p: [0, 1.1, 0], r: [-0.35, 0, 0.1], s: [0.58, 0.78, 0.44], c: SUIT }
  ])

  // 手臂：捧書 → 右手伸出去翻烤肉 → 張開漂浮
  ;[-1, 1].forEach((side) => {
    const grill =
      side > 0
        ? { p: [0.3, 1.32, 0.25] as V3, r: [-0.96, 0, 0] as V3 }
        : { p: [-0.32, 1.25, 0.06] as V3, r: [-0.23, 0, 0.08] as V3 }
    limb('cyl', [
      {
        p: [side * 0.24, 1.12, 0.16],
        r: [-0.8, 0, side * -0.3],
        s: [0.14, 0.56, 0.14],
        c: SKIN
      },
      { p: grill.p, r: grill.r, s: [0.14, 0.6, 0.14], c: SKIN },
      {
        p: [side * 0.42, 1.24, 0.06],
        r: [-0.35, 0, side * -0.85],
        s: [0.17, 0.62, 0.17],
        c: SUIT
      }
    ])
  })

  // 頭與頭髮
  const head = limb('ball', [
    { p: [0, 1.5, 0], r: [0.1, 0, 0], s: [0.4, 0.44, 0.4], c: SKIN },
    { p: [0, 1.78, 0.16], r: [0.2, 0, 0], s: [0.4, 0.44, 0.4], c: SKIN },
    { p: [0, 1.66, 0.06], r: [-0.1, 0, 0], s: [0.4, 0.44, 0.4], c: SKIN }
  ])
  limb('ball', [
    { p: [0, 1.61, -0.04], r: [0.1, 0, 0], s: [0.42, 0.28, 0.42], c: HAIR },
    { p: [0, 1.89, 0.12], r: [0.2, 0, 0], s: [0.42, 0.28, 0.42], c: HAIR },
    { p: [0, 1.77, 0.02], r: [-0.1, 0, 0], s: [0.42, 0.28, 0.42], c: HAIR }
  ])

  // 手上的東西：書 → 串上的肉 → 太空段燒完了（縮到 GONE）
  limb('box', [
    {
      p: [0, 1, 0.36],
      r: [-1, 0, 0],
      s: [0.44, 0.07, 0.34],
      c: '#e8ddc4'
    },
    {
      p: [0.24, 0.95, 1.42],
      r: [0.2, 0, 0],
      s: [0.22, 0.18, 0.2],
      c: '#a5522f'
    },
    { p: [0.5, 1.5, 0.3], s: GONE, c: '#a5522f' }
  ])
  // 書籤 → 烤肉串 → 太空人手上的小工具
  limb('cyl', [
    {
      p: [0.07, 1.02, 0.38],
      r: [-1, 0, 0.3],
      s: [0.03, 0.34, 0.03],
      c: '#b8484f'
    },
    {
      p: [0.27, 1.05, 0.96],
      r: [1.78, 0, 0],
      s: [0.04, 0.98, 0.04],
      c: '#8a6b4a'
    },
    {
      p: [0.5, 1.5, 0.3],
      r: [0.5, 0, 0.6],
      s: [0.05, 0.44, 0.05],
      c: '#b9c0d0'
    }
  ])

  // 頭盔：和貓一樣只在太空段淡入，位置每幀對齊頭部
  const helmetMaterial = new THREE.MeshStandardMaterial({
    color: '#bcd8ef',
    roughness: 0.1,
    transparent: true,
    opacity: 0
  })
  const helmet = new THREE.Mesh(GEO.ball, helmetMaterial)
  helmet.scale.setScalar(0.66)
  person.add(helmet)

  // ---------- 火星 → 螢火蟲 → 星星 ----------
  // 這批碎光在小木屋是壁爐竄起的火星，在營地是飄在樹梢間的螢火蟲，
  // 捲到太空就散開、長大成滿天的五角星，是「素材變形」最後的收尾
  // 星星是平的，先固定一個朝鏡頭的傾角，再各自繞自己的軸轉開角度
  const STAR_FACE: V3 = [-0.42, 0.66, 0]
  for (let i = 0; i < 18; i++) {
    const a = i / 18
    const angle = a * Math.PI * 2
    // 三層星環，避免全部落在同一個距離上變成一圈
    const ring = 6.6 + (i % 3) * 1.9
    const size = 0.5 + (i % 4) * 0.17
    // 越飄離爐火越小，才像散開的火星
    const spark = 0.1 + (1 - a) * 0.09
    part(
      'star',
      [
        {
          p: [
            -1.2 + Math.sin(i * 2.1) * (0.4 + a * 1.15),
            1.15 + a * 3,
            -3.15 + a * 1.5 + Math.cos(i * 1.7) * 0.22
          ],
          r: [STAR_FACE[0], STAR_FACE[1], angle],
          s: [spark, spark, spark],
          c: '#ffb457'
        },
        {
          p: [
            1.5 + Math.cos(angle) * (2.1 + a * 2.6),
            0.85 + Math.abs(Math.sin(i * 1.3)) * 1.7 + a * 1.5,
            0.9 + Math.sin(angle) * (1.9 + a * 2)
          ],
          r: [STAR_FACE[0], STAR_FACE[1], angle * 1.4],
          s: [0.24, 0.24, 0.24],
          c: '#ffd873'
        },
        {
          p: [
            Math.cos(angle) * ring,
            1.4 + Math.sin(a * 7.3) * 5.2,
            Math.sin(angle) * ring - 0.8
          ],
          r: [STAR_FACE[0], STAR_FACE[1], angle * 0.8],
          s: [size, size, size],
          c: i % 5 ? '#eef3ff' : '#ffe6a8'
        }
      ],
      { shadow: false, emissive: true, flicker: 4.5 + (i % 4) * 1.6 }
    )
  }

  // ---------- 星星：只在太空段浮現 ----------
  const starCount = 220
  const starPos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 10 + Math.random() * 13
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.8
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starMaterial = new THREE.PointsMaterial({
    color: '#e9f0ff',
    size: 0.13,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true
  })
  const stars = new THREE.Points(starGeometry, starMaterial)
  root.add(stars)

  // ---------- 燈光 ----------
  const ambient = new THREE.HemisphereLight('#fff6e5', '#a9a7b3', 2.2)
  scene.add(ambient)
  const keyLight = new THREE.DirectionalLight('#fff2d6', 3)
  keyLight.position.set(-3, 8, 6)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.left = -9
  keyLight.shadow.camera.right = 9
  keyLight.shadow.camera.top = 9
  keyLight.shadow.camera.bottom = -8
  keyLight.shadow.normalBias = 0.035
  keyLight.shadow.bias = -0.0002
  keyLight.shadow.radius = 4
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight('#b9d4ff', 1.2)
  fillLight.position.set(6, 4, -3)
  scene.add(fillLight)

  // ---------- 狀態 ----------
  let destroyed = false
  let visible = true
  let progress = 0
  let targetYaw = -0.05
  let pointerX = 0
  let pointerY = 0
  let isNight = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const skyColor = new THREE.Color(SKY[0])
  const tmp = new THREE.Color()
  const sky = new THREE.Color()
  const ground = new THREE.Color()
  const vecA = new THREE.Vector3()
  const vecB = new THREE.Vector3()

  /** 捲動進度換算成「第幾段 + 段內比例」，這是整個變形的驅動來源 */
  const segment = () => {
    const p = THREE.MathUtils.clamp(progress, 0, 1)
    if (p <= STOPS[0]) return { i: 0, j: 0, k: 0 }
    if (p >= STOPS[2]) return { i: 2, j: 2, k: 0 }
    const i = p < STOPS[1] ? 0 : 1
    const raw = THREE.MathUtils.clamp(
      (p - STOPS[i]) / (STOPS[i + 1] - STOPS[i]),
      0,
      1
    )
    return { i, j: i + 1, k: raw * raw * (3 - 2 * raw) }
  }

  // ---------- 互動 ----------
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let dragging = false
  let moved = false
  let startX = 0
  let startYaw = 0

  const hitTest = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(interactive, true)
    if (!hits.length) return null
    let node: THREE.Object3D | null = hits[0].object
    while (node && !node.userData.action) node = node.parent
    return (node?.userData.action as SceneryAction) ?? null
  }
  const down = (event: PointerEvent) => {
    dragging = true
    moved = false
    startX = event.clientX
    startYaw = targetYaw
    canvas.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointerY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    if (!dragging) return
    const delta = event.clientX - startX
    if (Math.abs(delta) > 4) moved = true
    targetYaw = THREE.MathUtils.clamp(startYaw + delta / 260, -0.85, 0.85)
    start()
  }
  const up = (event: PointerEvent) => {
    if (dragging && !moved) {
      const action = hitTest(event)
      if (action) onAction(action)
    }
    dragging = false
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId)
  }
  const cancel = () => {
    dragging = false
  }
  const leave = () => {
    dragging = false
    pointerX = 0
    pointerY = 0
  }
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', cancel)
  canvas.addEventListener('pointerleave', leave)

  let hostWidth = 0
  let hostHeight = 0
  const applyCamera = () => {
    if (!hostWidth || !hostHeight) return
    const aspect = hostWidth / hostHeight
    // 越往下捲鏡頭拉得越遠，配合零件散開，像是一路退到太空
    const zoom = 1 + THREE.MathUtils.clamp(progress, 0, 1) * 0.55
    // 場景現在畫在畫面正中央的固定舞台裡，舞台比例由 CSS 控在 1 附近，
    // 取景就貼著舞台：橫向由高度決定，窄的時候保證 14 單位寬塞得進去
    const viewHeight =
      THREE.MathUtils.clamp(Math.max(11.2, 14 / aspect), 11.2, 19) * zoom
    camera.left = (-viewHeight * aspect) / 2
    camera.right = (viewHeight * aspect) / 2
    camera.top = viewHeight / 2
    camera.bottom = -viewHeight / 2
    camera.updateProjectionMatrix()
  }
  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    hostWidth = width
    hostHeight = height
    applyCamera()
    renderer.setSize(width, height, false)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    },
    { rootMargin: '100px' }
  )
  visibilityObserver.observe(host)

  let frameId = 0
  let lastFrame = 0
  const animate = (time: number) => {
    frameId = 0
    if (destroyed || !visible || document.hidden) return
    if (time - lastFrame >= 1000 / 40) {
      lastFrame = time
      const t = time / 1000
      const spin = !reducedMotion.matches
      const { i, j, k } = segment()

      root.rotation.y = THREE.MathUtils.lerp(
        root.rotation.y,
        targetYaw + (spin ? pointerX * 0.06 : 0),
        0.11
      )
      root.rotation.x = THREE.MathUtils.lerp(
        root.rotation.x,
        spin ? pointerY * 0.02 : 0,
        0.08
      )

      // 核心：每個零件在相鄰兩個場景的狀態之間連續內插，
      // 畫面上就是上一個場景散開重組成下一個，而不是淡入淡出
      parts.forEach((entry) => {
        const a = entry.states[i]
        const b = entry.states[j]
        const object = entry.object
        vecA.set(a.p[0], a.p[1], a.p[2])
        vecB.set(b.p[0], b.p[1], b.p[2])
        object.position.copy(vecA.lerp(vecB, k))
        const ar = a.r ?? [0, 0, 0]
        const br = b.r ?? [0, 0, 0]
        object.rotation.set(
          THREE.MathUtils.lerp(ar[0], br[0], k),
          THREE.MathUtils.lerp(ar[1], br[1], k),
          THREE.MathUtils.lerp(ar[2], br[2], k)
        )
        const wobble = entry.flicker
          ? 1 + (spin ? Math.sin(t * entry.flicker) * 0.15 : 0)
          : 1
        vecA.set(a.s[0], a.s[1], a.s[2])
        vecB.set(b.s[0], b.s[1], b.s[2])
        object.scale.copy(vecA.lerp(vecB, k)).multiplyScalar(wobble)
        const material = object.material as THREE.MeshStandardMaterial
        material.color.lerpColors(entry.colors[i], entry.colors[j], k)
        if (entry.flicker) material.emissive.copy(material.color)
      })

      // 貓一路跟著，只是換位置與姿勢
      const spaceAmount = i === 1 ? k : i === 2 ? 1 : 0
      cats.forEach((entry, index) => {
        const a = entry.states[i]
        const b = entry.states[j]
        vecA.set(a.p[0], a.p[1], a.p[2])
        vecB.set(b.p[0], b.p[1], b.p[2])
        entry.cat.position.copy(vecA.lerp(vecB, k))
        const ar = a.r ?? [0, 0, 0]
        const br = b.r ?? [0, 0, 0]
        entry.cat.rotation.set(
          THREE.MathUtils.lerp(ar[0], br[0], k),
          THREE.MathUtils.lerp(ar[1], br[1], k),
          THREE.MathUtils.lerp(ar[2], br[2], k)
        )
        entry.cat.scale.setScalar(THREE.MathUtils.lerp(a.s[0], b.s[0], k))
        if (spin) {
          entry.head.rotation.y = Math.sin(t * (0.6 + index * 0.2)) * 0.3
          entry.cat.position.y += spaceAmount * Math.sin(t * 0.8 + index) * 0.18
        }
      })

      // 人跟著換姿勢：坐在沙發上看書 → 站著烤肉 → 在無重力裡漂
      const pa = personStates[i]
      const pb = personStates[j]
      vecA.set(pa.p[0], pa.p[1], pa.p[2])
      vecB.set(pb.p[0], pb.p[1], pb.p[2])
      person.position.copy(vecA.lerp(vecB, k))
      const par = pa.r ?? [0, 0, 0]
      const pbr = pb.r ?? [0, 0, 0]
      person.rotation.set(
        THREE.MathUtils.lerp(par[0], pbr[0], k),
        THREE.MathUtils.lerp(par[1], pbr[1], k),
        THREE.MathUtils.lerp(par[2], pbr[2], k)
      )
      if (spin) person.position.y += spaceAmount * Math.sin(t * 0.7 + 2) * 0.2
      // 頭盔黏著頭走，四肢的姿勢已經在上面的迴圈算完了；
      // 透明度自己控，和貓的泡泡共用一個值會太暗、看起來像戴了顆黑球
      helmet.position.copy(head.position)
      helmetMaterial.opacity = spaceAmount * 0.52

      starMaterial.opacity = spaceAmount
      bubbles.forEach((material) => {
        material.opacity = spaceAmount * 0.4
      })
      if (spin) stars.rotation.y = t * 0.012

      fireLight.position.copy(flames[0].position)
      fireLight.intensity =
        (spin ? 3.4 + Math.sin(t * 9) * 0.4 : 3.4) * (isNight ? 0.7 : 1)

      // 燈光與天空色同樣在兩個場景之間連續內插
      const dim = isNight ? 0.42 : 1
      const ma = MOOD[i]
      const mb = MOOD[j]
      sky.set(ma.sky).lerp(tmp.set(mb.sky), k)
      ground.set(ma.ground).lerp(tmp.set(mb.ground), k)
      ambient.color.copy(sky)
      ambient.groundColor.copy(ground)
      ambient.intensity = THREE.MathUtils.lerp(ma.ambient, mb.ambient, k) * dim
      keyLight.intensity = THREE.MathUtils.lerp(ma.key, mb.key, k) * dim
      fillLight.intensity = THREE.MathUtils.lerp(ma.fill, mb.fill, k) * dim
      skyColor.set(SKY[i]).lerp(tmp.set(SKY[j]), k)
      document.documentElement.style.setProperty(
        '--sky',
        `#${skyColor.getHexString()}`
      )

      applyCamera()
      renderer.render(scene, camera)
    }
    frameId = requestAnimationFrame(animate)
  }
  const start = () => {
    if (!frameId && !destroyed && visible && !document.hidden)
      frameId = requestAnimationFrame(animate)
  }
  const visibilityChange = () => {
    if (!document.hidden) start()
  }
  document.addEventListener('visibilitychange', visibilityChange)
  const contextLost = (event: Event) => {
    event.preventDefault()
    onError()
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  start()

  return {
    setNight: (night) => {
      isNight = night
      start()
    },
    setProgress: (value) => {
      progress = value
      start()
    },
    rotate: (direction) => {
      targetYaw = THREE.MathUtils.clamp(
        targetYaw + direction * 0.2,
        -0.85,
        0.85
      )
      start()
    },
    reset: () => {
      targetYaw = -0.05
      pointerX = 0
      pointerY = 0
      start()
    },
    destroy: () => {
      destroyed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', visibilityChange)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', cancel)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('webglcontextlost', contextLost)
      const disposed = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material]
          list.forEach((material) => {
            if (!disposed.has(material)) {
              material.dispose()
              disposed.add(material)
            }
          })
        }
      })
      Object.values(GEO).forEach((geometry) => {
        geometry.dispose()
      })
      starGeometry.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }
}
