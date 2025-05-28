import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Interacoes from './pages/Interacoes';
import InteracoesPage from './pages/InteracoesPage';

import './index.css';
import { customTheme } from './styles/theme';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CadastroParceiroPage from './pages/CadastroParceiroPage'; // ✅ novo
import CadastroUsuariosPage from './pages/CadastroUsuariosPage'; // ✅ novo
console.log('Componente Interações carregado');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={customTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cadastro-parceiro" element={<CadastroParceiroPage />} />
          <Route path="/cadastro-usuarios" element={<CadastroUsuariosPage />} />
          <Route path="/interacoes" element={<Interacoes />} /> {/* ✅ nova rota */}
          <Route path="/interacoes" element={<InteracoesPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);
