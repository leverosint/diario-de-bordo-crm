import { useState } from 'react';
import {
  TextInput,
  Paper,
  Title,
  Button,
  Loader,
    Text,
  Box,
} from '@mantine/core';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setErro('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login/`, {
        identificador,
        senha,
      });

      console.log('🧪 Resposta do login:', response.data);

      const token = response.data.access || response.data.token;
      const usuario = response.data.usuario;

      if (token && usuario) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        navigate('/dashboard');
      } else {
        setErro('Erro: Token ou dados de usuário ausentes.');
      }
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err);
      setErro('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #005A64 0%, #003B42 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
      }}
    >
      <Paper
        shadow="xl"
        p="xl"
        withBorder
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '32px 28px',
        }}
      >
        <Box mb={23} style={{ textAlign: 'center' }}>
          <Title
            order={2}
            style={{
              color: '#005A64',
              fontWeight: 700,
              fontSize: '28px',
              marginBottom: '4px',
            }}
          >
            Diário de Bordo
          </Title>
          <Text
            size="sm"
            style={{
              color: '#4CDDDD',
              fontSize: '15px',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Acesse com seu usuário, e-mail ou ID vendedor
          </Text>
        </Box>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <Box mb={24} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box style={{ width: '100%', maxWidth: 320 }}>
              <Text style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#005A64' }}>
                Login *
              </Text>
              <TextInput
                placeholder="Digite seu login"
                value={identificador}
                onChange={(e) => setIdentificador(e.currentTarget.value)}
                required
              />
            </Box>

            <Box style={{ width: '100%', maxWidth: 320, marginTop: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#005A64' }}>
                Senha *
              </Text>
              <div style={{ position: 'relative' }}>
                <TextInput
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.currentTarget.value)}
                  required
                />
                <div
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#005A64',
                  }}
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </Box>
          </Box>

          {erro && (
            <Text
              color="red"
              size="sm"
              style={{
                textAlign: 'center',
                marginBottom: 12,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 0, 0, 0.05)',
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              {erro}
            </Text>
          )}

          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              disabled={loading}
              style={{
                height: 50,
                width: '180px',
                fontSize: 16,
                fontWeight: 600,
                background: '#005A64',
                borderRadius: 12,
                color: 'white',
              }}
            >
              {loading ? <Loader size="sm" color="white" /> : 'Entrar'}
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
}
