# 🏁 Go-Kart Race

A fun, top-down arcade racing game built using **React**, **Vite**, and **TypeScript**. Race around the track, pass all checkpoints, and try to beat your best time over 3 laps!

This game is designed to be played either as a standalone experience or integrated with the **Tivoli API** from the Yrgo Web Development Class of 2024.

## 🚗 Features

- 🏎️ Top-down go-kart driving with responsive controls
- ⏱️ Live timer and best time tracking
- ✅ Checkpoint validation to ensure fair laps
- 🏁 3-lap racing logic with finish detection
- 🏆 Leaderboard integration (via Tivoli API)
- 🧠 Adaptive scaling for mobile and desktop
- 📱 On-screen mobile controls
- 🔐 Optional JWT authentication for secure gameplay via Tivoli
- 🌍 Multi-platform: works in browser on desktop and mobile

## 🛠️ Technologies Used

- React (with Hooks)
- Vite
- TypeScript
- Tailwind CSS
- Tivoli API (JWT authentication, transaction handling, score submission)
- Lucide Icons

## 🧪 How It Works

1. Players start by authenticating (via Tivoli) or launching standalone.
2. A €3 spin fee is reported to the API to start the game.
3. Players complete 3 laps, hitting all checkpoints before crossing the finish line.
4. Upon completing all laps, the player's time is recorded.
5. Players may submit their score to the leaderboard or skip submission.
6. A stamp and potential winnings are reported to the Tivoli system.

## 🧭 Controls

### Desktop

| Key | Action     |
|-----|------------|
| ↑   | Accelerate |
| ↓   | Reverse    |
| ←   | Turn left  |
| →   | Turn right |

### Mobile

Touch controls appear when using mobile view.

## 🧑‍💻 Getting Started

### 1. Clone the repo

```
git clone https://github.com/YOUR_USERNAME/go-kart-race.git
cd go-kart-race
```

### 2. Install dependencies
```
npm install
```

### 3. Run the app
```
npm run dev
```

### 📦 Build for Production
```
npm run build
```

### 📂 Folder Structure
```
src/
├── api/                 # Tivoli API service layer
├── components/          # Reusable UI and game components
├── context/             # Game config
├── assets/              # Game images, audio, etc
├── App.tsx              # Main entry point
└── main.tsx             # Vite bootstrap
```

## 📄 License
MIT License

## 🙌 Acknowledgements
Made by Mahtias Jebrand, Filip Lyrheden and Jack Svensson. Special thanks to the creators of the Tivoli API.
