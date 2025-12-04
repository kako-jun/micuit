import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DreamBackground } from './components/DreamBackground'
import { Logo } from './components/Logo'
import { ModeSwitch } from './components/ModeSwitch'
import { MorningPage } from './pages/MorningPage'
import { DaytimePage } from './pages/DaytimePage'
import { NightPage } from './pages/NightPage'

function App() {
  return (
    <BrowserRouter>
      <DreamBackground />
      <Logo />
      <Routes>
        <Route path="/" element={<Navigate to="/morning" replace />} />
        <Route path="/morning" element={<MorningPage />} />
        <Route path="/daytime" element={<DaytimePage />} />
        <Route path="/night" element={<NightPage />} />
      </Routes>
      <ModeSwitch />
    </BrowserRouter>
  )
}

export default App
