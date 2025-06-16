import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider, CssBaseline } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

// Importação dos estilos do Mantine
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import './index.css';

// Importação do tema customizado
import { customTheme } from './styles/theme';

// Importação das páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CadastroParceiroPage from './pages/CadastroParceiroPage';
import CadastroUsuariosPage from './pages/CadastroUsuariosPage';
import InteracoesPage from './pages/InteracoesPage';
import Relatorios from './pages/Relatorios';
import TabelaOportunidadesPage from './pages/TabelaOportunidadesPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      theme={customTheme}
      defaultColorScheme="light" // 🔥 Define se começa com tema claro ou escuro
    >
      <CssBaseline /> {/* 🔥 Essencial para normalizar os estilos */}
      <ModalsProvider> {/* 🔥 Essencial para os Modals funcionarem */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cadastro-parceiro" element={<CadastroParceiroPage />} />
            <Route path="/cadastro-usuarios" element={<CadastroUsuariosPage />} />
            <Route path="/interacoes" element={<InteracoesPage />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/tabela-oportunidades" element={<TabelaOportunidadesPage />} />
          </Routes>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
