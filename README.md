# Ken Wang — Creative Developer

以 [David Heckhoff 的作品集](https://david-hckh.com/) 為視覺參考，重新製作的個人網站。包含原創的 Three.js 工作室、作品集、互動小工具與繁體中文介紹。

## 本機開發

```bash
pnpm install
pnpm dev

cp -R dist/* ../kenfront.github.io/ && cp dist/index.html ../kenfront.github.io/404.html
```

```bash
pnpm build       # TypeScript 檢查與正式版本建置
pnpm lint        # Biome 檢查（lint + 格式 + import 排序）
pnpm lint:fix    # 套用可自動修正的問題
pnpm format      # 只重新格式化
pnpm serve       # 預覽 dist 正式版本
```

## 自訂內容

- `src/portfolio/content.ts`：姓名、GitHub、聯絡網址與自我介紹。聯絡入口目前使用現有的 GitHub；可將 `profile.contact` 換成 `mailto:你的信箱` 或其他聯絡網址。
- `src/portfolio/Portfolio.tsx`：主要區塊與介紹內容。
- `src/portfolio/portfolio.css`：配色、字體、動畫及手機版排版。
- `src/portfolio/createScenery.ts`：使用幾何模型建立的 3D 場景。捲動時由小木屋變形重組為山區露營，再成為太空，沒有引用參考網站的模型或圖片。

## 互動

- 拖曳場景旋轉視角，或使用下方的旋轉與重設按鈕。
- 往下捲動，場景會連續變形：小木屋 → 山區露營 → 太空。點擊火箭前往聯絡區塊；點擊貓咪或火焰有小回應。
- 日夜切換會同時改變頁面與場景燈光。環境音由 Web Audio 合成，預設關閉。
- 支援手機、鍵盤操作、減少動態效果偏好和 WebGL 不可用時的備用畫面。

正式網站輸出至 `dist/`，可部署到提供靜態檔案的主機。預設使用根路徑；若部署至子路徑，需同步調整 Vite `base`、HTML 圖示路徑及 PWA `start_url`。
