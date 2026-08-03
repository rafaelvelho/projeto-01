import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CriarCasamentoPrototype } from './prototype/criar-casamento/CriarCasamentoPrototype'
import { readPrototypeSearch } from './prototype/criar-casamento/shared'
import { AlbumPrivadoPrototype } from './prototype/album-privado/AlbumPrivadoPrototype'
import { readAlbumPrototypeSearch } from './prototype/album-privado/shared'
import { HomePage } from './pages/HomePage'
import { CriarCasamentoPage } from './pages/CriarCasamentoPage'
import { AlbumPrivadoPage } from './pages/AlbumPrivadoPage'
import { AlbumPublicoPage } from './pages/AlbumPublicoPage'
import './App.css'

function PrototypeGate({ children }: { children: React.ReactNode }) {
  if (readAlbumPrototypeSearch().isAlbumPrivado) {
    return <AlbumPrivadoPrototype />
  }
  if (readPrototypeSearch().isCriarCasamento) {
    return <CriarCasamentoPrototype />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <PrototypeGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/criar" element={<CriarCasamentoPage />} />
          <Route path="/p/:slug" element={<AlbumPrivadoPage />} />
          <Route path="/a/:slug" element={<AlbumPublicoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PrototypeGate>
    </BrowserRouter>
  )
}

export default App
