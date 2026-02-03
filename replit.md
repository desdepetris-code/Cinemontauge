# Cinemontage - TV & Movie Tracker

## Overview
A React-based TV and movie tracker application built with Vite and TypeScript. The app allows users to track their watching history, manage shows, and view achievements.

## Tech Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Backend Services**: Firebase, Supabase
- **APIs**: TMDB, TVDB, TVMaze, Trakt, MyAnimeList

## Project Structure
```
├── App.tsx              # Main App component
├── MainApp.tsx          # Primary application logic
├── index.tsx            # Entry point
├── index.html           # HTML template
├── components/          # React components
├── screens/             # Screen/page components
├── hooks/               # Custom React hooks
├── services/            # API service modules
├── utils/               # Utility functions
├── data/                # Static data files
├── functions/           # Firebase Cloud Functions
└── public/              # Static assets
```

## Running the App
```bash
npm install
npm run dev
```

The development server runs on port 5000 with `0.0.0.0` host binding.

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini AI API key (optional)

## Build
```bash
npm run build
```

Output goes to the `dist/` directory.
