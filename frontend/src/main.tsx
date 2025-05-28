import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import './index.css';
import { customTheme } from './styles/theme';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CadastroParceiroPage from './pages/CadastroParceiroPage';
import CadastroUsuariosPage from './pages/CadastroUsuariosPage';
import Interacoes from './pages/Interacoes'; // ✅ import atualizado

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={customTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cadastro-parceiro" element={<CadastroParceiroPage />} />
          <Route path="/cadastro-usuarios" element={<CadastroUsuariosPage />} />
          <Route path="/interacoes" element={<Interacoes />} /> {/* ✅ uso direto */}
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);
