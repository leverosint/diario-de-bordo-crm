// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';   // reset + global styles do Mantine
import '@mantine/dates/styles.css';  // estilos base do DatePicker


import Relatorios from './pages/Relatorios';
import TabelaOportunidadesPage from './pages/TabelaOportunidadesPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CadastroParceiroPage from './pages/CadastroParceiroPage';
import CadastroUsuariosPage from './pages/CadastroUsuariosPage';
import InteracoesPage from './pages/InteracoesPage';
import SolicitarResetPage from './pages/SolicitarResetPage';
import ResetarSenhaPage from './pages/ResetarSenhaPage';

import './index.css';
import { customTheme } from './styles/theme';

const user = JSON.parse(localStorage.getItem('user') || '{}');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      theme={customTheme}
      defaultColorScheme="light"
      withCssVariables
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/cadastro-parceiro" element={<CadastroParceiroPage />} />
          <Route path="/cadastro-usuarios" element={<CadastroUsuariosPage />} />
          <Route path="/interacoes" element={<InteracoesPage />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/tabela-oportunidades" element={<TabelaOportunidadesPage />} />
          <Route path="/solicitar-reset" element={<SolicitarResetPage />} />
          <Route path="/resetar-senha/:uid/:token" element={<ResetarSenhaPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);
