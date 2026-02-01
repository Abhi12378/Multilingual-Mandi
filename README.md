<div align="center">
  <h1>Multilingual Mandi</h1>
  <p>Live market insights and voice negotiation in your language — built with React, Vite, Tailwind, and Google GenAI.</p>
</div>

## Overview

Multilingual Mandi is a lightweight web app that helps users search produce prices, view simple price charts, and negotiate via a voice assistant. It supports multilingual queries and uses Google GenAI for concise, grounded responses.

## Features

- Market Dashboard: search items, see net price extracted from responses, and view a simple chart per item.
- Voice Negotiator: speak naturally, get a concise response read aloud via Text-to-Speech.
- Multilingual input: works in browsers that support the Web Speech API (Chrome/Edge recommended).
- Favorites: quickly save/remove items you check often.

## Tech Stack

- React (with TypeScript) + Vite
- Tailwind CSS via PostCSS pipeline
- Recharts for lightweight charts
- Google GenAI SDK `@google/genai` (model `gemini-2.0-flash`)

## Prerequisites

- Node.js 18+ (LTS recommended)
- A modern browser (Chrome/Edge) with microphone access for voice features
- Google GenAI API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file at `.env.local` in the project root and set your API key:

   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

   Note: Vite exposes only variables prefixed with `VITE_` to client code.

3. Run the development server:

   ```bash
   npm run dev
   ```

   Vite will start on `http://localhost:3000/` or the next available port (e.g., `3001`).

## Build & Preview

```bash
npm run build
npm run preview
```

## Configuration Notes

- Tailwind/PostCSS are configured in `tailwind.config.js` and `postcss.config.js`. Styles live in `src/index.css`.
- Client code reads the key using `import.meta.env.VITE_GEMINI_API_KEY`.
- The Voice Negotiator uses the browser Web Speech APIs: `SpeechRecognition` (or `webkitSpeechRecognition`) and `speechSynthesis`.

## Browser Permissions

- Allow microphone access when prompted to use voice features.
- If speech recognition doesn’t start, ensure you’re on Chrome/Edge and that permissions are granted.

## Troubleshooting

- Failed to fetch market data: verify `API_KEY` is set and valid.
- Voice assistant not responding: use Chrome/Edge, allow mic access, and reload the page.
- Port already in use: Vite auto-selects another port (e.g., `3001`).

## Security & Repo Hygiene

- `.env.local` is intentionally not tracked; keep your API keys out of git.
- Large media files (e.g., `.mp4`, `.wav`) are ignored to avoid size limits.

## License
MIT
