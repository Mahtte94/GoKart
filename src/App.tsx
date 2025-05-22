import { useState } from 'react'
import './App.css'
import GameController from './components/GameController'

function App() {
  return (
    <div className="h-screen overflow-hidden">
      {/* Main game component */}
      <GameController />
    </div>
  )
}

export default App