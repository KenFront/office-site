# CLAUDE.md

## 專案概要

Vite + React 18 + TypeScript 個人網站，以 pnpm 管理相依。主要內容在 `src/portfolio/`（Three.js 工作室），`src/pages/` 為其餘頁面。

首頁只有三個區塊：**首屏 → 關於（01）→ 聯絡（02）**。作品集區塊已於 2026-09-09 移除，連同 `ProjectDialog.tsx`、`demos.tsx`（待辦清單與粒子實驗）、`content.ts` 的 `projects[]` 與 `ProjectId`。新增區塊時記得同步 `.section-number` 的編號。

## 工具鏈

**Biome 2.x 是唯一的 lint + 格式化工具**，設定在 `biome.jsonc`。專案已於 2026-09-09 移除 ESLint 與 Prettier，不要再引入這兩者或其外掛。

```bash
pnpm lint        # biome check . --error-on-warnings（等同舊的 --max-warnings=0）
pnpm lint:fix    # biome check . --write
pnpm format      # biome format . --write
pnpm typecheck   # tsc --noEmit
```

用 `biome.jsonc`（不是 `biome.json`）是因為 Biome 只在 `.jsonc` 副檔名下接受註解，而設定裡的規則取捨需要說明。

### 設定上的注意事項

- **格式沿用原本的 Prettier 設定**：單引號、不加分號、無尾逗號、寬度 80。
- **`organizeImports` 有自訂分組**：外部套件 / `src` 下的絕對路徑別名 / 相對路徑，中間空行隔開。別名（`components/`、`hooks/` 等）靠 `tsconfig.json` 的 `baseUrl: "./src"`，Biome 預設會誤判成 npm 套件，所以群組裡要明確排除。新增 `src/` 下的頂層目錄時，記得同步加進 `biome.jsonc` 的 `groups`。
- **`useSortedClasses` 已關閉**：它仍在 nursery 階段，會把 `` `portfolio${night ? ' is-night' : ''}` `` 這類樣板字串的前導空白吃掉。不要開啟，也不要對此專案跑 `biome check --unsafe`。
- **部分 a11y 規則已關閉**：舊的 ESLint 沒有 jsx-a11y，`src/` 內有 24 處既有問題（多數是 `<button>` 缺 `type`）。這是待辦債務，不是「已確認沒問題」。
- `public/` 不納入檢查（靜態資產與 msw 產生的 `mockServiceWorker.js`）。

## 版面：中央舞台

3D 場景是**畫面正中央的固定舞台，不是背景**（2026-09-09 改）。`.scenery` 是 `position: fixed; inset: 0` 的置中格線，裡面的 `.scenery-stage` 尺寸為 `--stage-w` × `--stage-h`，`z-index: 3` 疊在 `main`（z-index 1）之上、頁首（20）之下。

內容一律讓開中央：`.stage-grid` 是 `minmax(0,1fr) var(--stage-w) minmax(0,1fr)` 的三欄格線，左右欄放內容、中間那欄空著給舞台。**中間欄的寬度必須就是 `--stage-w`**，它和固定舞台同寬同心才不會壓到；改寬度只能改 `--stage-w`，不要在格線裡另外寫死數值。

- 版面 token 定義在 `.portfolio`：`--page-pad`、`--stage-gap`、`--stage-w`、`--stage-h`。
- `≤1024px` 改成上下堆疊：舞台移到畫面上半（`align-items: start` + `padding-top`），區塊用 `padding-top: 44svh` 把內容推到舞台下方，錨點跳過來時文字才不會被場景蓋住。窄螢幕捲動時內容仍會從舞台後面經過，這是取捨後的結果（舞台永遠在前景）。
- 場景控制列（`.scenery-toolbar`）掛在舞台正下方（`position: absolute; bottom: -48px`），不要改回固定在畫面右下角——那會壓到右欄的卡片。
- `.scenery-canvas` 用兩層 `linear-gradient` 的 `mask-image` + `mask-composite: intersect` 柔化四邊，露營段的遠山碰到舞台邊界時是化開的，不是被切一刀。
- about / contact 的面板**不再半透明加 blur**：它們已經不壓在場景上，改成 94% 混色、拿掉 `backdrop-filter`。

## 3D 場景（`createScenery.ts`）

捲動進度 0→1 驅動三個場景：**小木屋（火爐＋三隻貓）→ 山區露營 → 太空**。

### 轉場是變形重組，不是淡入淡出

這是刻意的架構決定，**不要改回交叉淡入淡出**：

- 所有零件共用五種單位幾何（`box` / `cyl` / `cone` / `ball` / `star`），**尺寸一律用 `scale` 表達**，位置、旋轉、縮放、顏色才能連續內插。幾何一旦選定就三個場景通用，**不能中途換形狀**——想讓某個東西在太空變成星星，就得整條線都用 `star`。
- 每個零件存三組 `State`，捲動時在相鄰兩個場景之間 lerp。畫面上就是上一個場景散開重組成下一個。
- 對應關係是刻意設計的：牆上的原木→樹幹與山腳岩層→漂浮碎片；壁爐→圓錐帳→火箭；地板木條→草地緩坡→環繞行星的碎板；窗景小山→遠山→太空尖石。
- **火、貓、人三個場景都在**（壁爐火→營火→火箭尾焰；三隻貓一路跟著），這是最直接的銜接線索。
- **星星是同一條線變出來的**：18 個 `star` 零件在小木屋是爐火上方飄的火星、露營是樹梢間的螢火蟲、太空才長大成滿天五角星（`STAR_FACE` 是朝鏡頭的固定傾角，第三個值各自轉開）。太空另外還有 220 點的 `Points` 星塵墊底。
- 某個場景中不存在的零件用 `GONE` 縮到近乎 0，不要改成 `visible = false`，否則進出會不連續。

### 人物

人物（`person`）是一個 `THREE.Group`：**群組本身存三組世界座標（`personStates`），四肢再各自存三組「局部」姿勢**，所以捲動時是同一個人從坐姿站起來、再飄進無重力，而不是換模型。

- `part()` 的 `options.parent` 就是為此加的：傳 `person` 進去，零件的 position/rotation/scale 就變成群組內的局部值，照樣走既有的插值迴圈。四肢用 `limb()` 這個小包裝。
- 三段姿勢：小木屋坐在沙發上看書 → 營地站著烤肉（右手伸出去、串烤在營火上方）→ 太空張開手腳漂浮。
- 手上的東西也是同一條線：書 → 串上的肉（太空縮到 `GONE`）；書籤 → 烤肉串 → 太空人的小工具。
- 沙發是為了「坐著看書」補的，它自己也有三段：沙發座墊/椅背 → 營地的原木長凳/備用柴 → 漂浮碎板。
- 頭盔是獨立的半透明球，`opacity` 由 `spaceAmount` 驅動、每幀 `copy` 頭部位置；它**不要**放進 `bubbles`（貓泡泡用的 0.4 太暗，人戴起來像頂著一顆黑球）。
- 圓柱預設軸向是 +Y；要沿 Z 躺平只需繞 X 轉 90°，**多加 Z 軸旋轉會在 XYZ 順序下疊成斜的**（踩過一次）。

### 取景

舞台比例由 CSS 控在 1 附近，所以 `applyCamera()` 直接貼著舞台算：`clamp(max(11.2, 14 / aspect), 11.2, 19) * zoom`。原本為了整頁背景而加的直式補償（上限 21、`aspect < 0.85` 時把取景往下挪）已經拿掉——場景現在置中在自己的方框裡，不需要為文字讓位。

### 堆疊順序

`.scenery` 是 `position: fixed; z-index: 3`，**在內容之上**。`main` 與 `.site-footer` 維持 `position: relative; z-index: 1`。舞台底部的 `.scenery-stage::before` 是接觸陰影，用 `var(--ink)` 混色，所以太空段會自動翻成淺色光暈。

### 介面要跟著場景變暗

捲到太空時頁面底色會轉為 `#0d1224`，所以 `Portfolio.tsx` 在進度 > 0.68 時加上 `.is-space`，用與 `.is-night` 相同的 token 抽換機制把文字與面板翻成淺色。**contact 區塊的文字色必須用 `var(--ink)` / `var(--muted)`**，寫死深色會在太空段變成暗底暗字。

`--sky` 由場景每幀寫入 `:root`，`.portfolio` 的背景取用它。

about / contact 的左右兩片面板用 `color-mix` 留 6% 透明度，讓 `--sky` 的變化透一點出來；不加 `backdrop-filter`（面板已經不壓在場景上）。

太空段的 `MOOD[2]` 打光（ambient 1.5 / key 1.15 / fill 0.85）比原本亮不少：場景縮進舞台變成主體後，原本的 1.0 / 0.7 / 0.5 會讓整團碎片糊成一塊黑。行星色也一起提亮到 `#59608a` / `#646c9c`。

## 視覺設計

首頁刻意與 [david-hckh.com](https://david-hckh.com/) 拉開距離 — 早期版本的 hero 與頁首幾乎是 1:1 複製（置中膠囊導覽、右上橘色膠囊 CTA、名字下方旋轉深藍貼紙、左文右 3D 分割）。2026-09-09 重做後：

- **3D 工作室是畫面正中央的主角**，文字退到左右兩欄（首屏只有左欄放名字）。這是誠實的定位差異：參考站的 3D 是渲染好的插圖裝飾，這裡的是可拖曳、可點擊的即時 Three.js 場景。
- **導覽是右上的純文字連結**（中文標籤 `關於 / 作品 / 聯絡`），不是浮動膠囊；沒有橘色 CTA 按鈕。
- 已移除：置中膠囊導覽、旋轉貼紙、`PERSONAL SPACE — VOL. 01` 版本標記、全大寫加寬字距的 hero eyebrow。**不要把這些加回來。**
- about 的軌道圓環（`.orbit`）與大 `✳`（`.about-asterisk`）在改成兩欄時移除：欄寬只有 300px 上下，410–490px 的圓環放不進去，中央的舞台也已經是畫面的裝飾主體。技能列（`.skills-strip`）收進左欄卡片底部，換行時分隔用 `span::after` 貼在前一個詞後面，避免 `✳` 跑到行首。
- 首屏連結與 3D 場景點擊螢幕（`WorkspaceAction` 的 `contact`）都導向聯絡區塊。

### 色彩 token（定義在 `.portfolio`）

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#f6f2e9` | 底色 |
| `--paper-deep` | `#ece2d0` | 紙色第二階，章節分層（contact 區） |
| `--ink` | `#292820` | 文字 |
| `--muted` | `#6c685e` | 次要文字 |
| `--plum` | `#b23a5f` | 唯一行動色（對紙 5.13:1） |
| `--pine` | `#1f4a3d` | 章節色塊、深色區（對紙 8.93:1） |

原本的 `--orange #f77735` + `--blue #263e80` 已淘汰。橘色特別要避開 — 它落在 AI 生成設計最常見的 cream + terracotta 區間，也正是參考站的配色。深色底上的強調色用提亮版 `#e4849f`（對松綠 5.16:1）。

`createWorkspace.ts` 裡約 100 個寫死的 hex 是 3D 房間的自然材質色（暖中性），**與品牌色無關，換強調色時不需要動**。`.avatar-*`、`.mini-*` 同理，是插圖用色。

## 慣例

- 組合 `className` 一律用 `twMerge`，不要用模板字串拼接。
- 註解一律繁體中文。

## 已知狀態

- 專案目前沒有任何測試檔，`pnpm test` 會直接結束。
- `.husky/pre-commit` 直接跑 `pnpm lint` 與 `pnpm typecheck`，並未透過 `lint-staged`（`package.json` 裡的 `lint-staged` 設定目前沒有被觸發）。
