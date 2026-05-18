# Vivace-sity

Vivace-sity is a cinematic, high-energy local YouTube multimedia downloader that combines **yt-dlp + FFmpeg** with a premium React UX.

## 1) Complete Architecture

Vivace-sity is a monorepo with two applications:

- **`apps/web`**: React + Tailwind + Framer Motion interface
- **`apps/server`**: Node.js + Express API orchestrating yt-dlp/FFmpeg, queueing, history, cancellation, and progress streams

### Layers

- **API Layer (Express routes/controllers)**
  - Input validation and request-response contracts
- **Service Layer**
  - Download orchestration (`DownloadManager`)
  - Progress fanout (`ProgressHub`)
  - yt-dlp metadata runner (`ytdlpService`)
- **Store Layer**
  - Local history persistence (`HistoryStore`)
- **UI Layer**
  - Modular components and Zustand state
  - Real-time EventSource stream consumption

### Core Runtime Flow

1. UI sends URL/options to `/api/download`
2. Server validates and enqueues task
3. Worker spawns yt-dlp with safe args (no shell)
4. Progress is parsed and broadcast over SSE
5. Completion/failure is persisted in local history JSON

---

## 2) Folder Structure

```text
.
├── apps
│   ├── server
│   │   ├── src
│   │   │   ├── config
│   │   │   │   └── env.ts
│   │   │   ├── controllers
│   │   │   │   └── downloadController.ts
│   │   │   ├── middleware
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── notFound.ts
│   │   │   ├── routes
│   │   │   │   └── api.ts
│   │   │   ├── services
│   │   │   │   ├── downloadManager.ts
│   │   │   │   ├── progressHub.ts
│   │   │   │   └── ytdlpService.ts
│   │   │   ├── store
│   │   │   │   └── historyStore.ts
│   │   │   ├── types
│   │   │   │   └── download.ts
│   │   │   ├── utils
│   │   │   │   ├── files.ts
│   │   │   │   └── validators.ts
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── .env.example
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web
│       ├── src
│       │   ├── components
│       │   │   ├── AnimatedBackground.tsx
│       │   │   ├── AudioVisualizer.tsx
│       │   │   ├── DownloaderPanel.tsx
│       │   │   ├── GlassCard.tsx
│       │   │   ├── HistoryPanel.tsx
│       │   │   ├── QueuePanel.tsx
│       │   │   ├── ThemeToggle.tsx
│       │   │   └── Toasts.tsx
│       │   ├── hooks
│       │   │   ├── useClipboardDetector.ts
│       │   │   └── useKeyboardShortcuts.ts
│       │   ├── lib
│       │   │   └── api.ts
│       │   ├── store
│       │   │   └── useDownloaderStore.ts
│       │   ├── App.tsx
│       │   ├── index.css
│       │   ├── main.tsx
│       │   └── types.ts
│       ├── .env.example
│       ├── package.json
│       └── vite.config.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 3) Dependencies and Why They Are Used

### Frontend

- **react / react-dom**: application UI runtime
- **tailwindcss + @tailwindcss/vite**: utility-first styling and rapid cinematic design system
- **framer-motion**: smooth motion transitions, micro-interactions, animated visuals
- **lucide-react**: modern iconography
- **zustand**: lean global state for queue/history/toasts/theme
- **clsx**: composable class utilities

### Backend

- **express**: HTTP API server
- **zod**: strict schema validation and sanitization for inputs
- **express-rate-limit**: abuse protection / throttling
- **helmet**: security hardening headers
- **cors**: controlled cross-origin behavior
- **morgan**: request logging
- **dotenv**: environment-driven configuration
- **sanitize-filename**: safer output template handling

### Runtime binaries (required)

- **yt-dlp**: metadata extraction and media download
- **ffmpeg**: media conversion/transcoding pipeline

---

## 4) Download Pipeline Design

1. **Input validation**
   - URL + options validated by Zod
   - YouTube-only domain enforcement
2. **Queue insertion**
   - Task gets UUID and enters queue
3. **Metadata fetch**
   - yt-dlp JSON metadata pre-step for title/uploader/thumbnail
4. **Download execution**
   - yt-dlp spawned with argument array (shell disabled)
   - mp4/mp3, resolution, subtitles, playlist flags applied
5. **Conversion phase**
   - FFmpeg wired via `--ffmpeg-location`
6. **History persistence**
   - success/failure/cancel recorded in `history.json`
7. **Cleanup lifecycle**
   - temp folder cleanup job runs on interval

---

## 5) Real-Time Progress System

- Server parses yt-dlp progress lines (`%`, speed, ETA, totals)
- Progress snapshots are published to a task-scoped in-memory hub
- Frontend opens `EventSource` stream at `/api/stream/:id`
- UI queue cards update instantly with progress bars, speed, ETA, and logs
- Stream auto-closes on terminal states (`completed`, `failed`, `cancelled`)

---

## API Endpoints

- `POST /api/info`
- `POST /api/download`
- `GET /api/progress/:id`
- `POST /api/cancel/:id`
- `GET /api/history`
- `GET /api/stream/:id` (SSE)

---

## Development

```bash
npm install
npm run dev:server
npm run dev:web
```

Server: `http://localhost:8787`  
Web: `http://localhost:5173`

## Build

```bash
npm run build
```

## Docker

```bash
docker compose up --build
```
