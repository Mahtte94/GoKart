import { useState } from 'react'
import './App.css'
import GameController from './components/GameController'

function App() {
  return (
    <div className="h-screen overflow-hidden">
      <GameController />
    </div>
  )
}

export default App