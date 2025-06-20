import { useState } from 'react';
import {
  TextInput,
  Paper,
  Title,
  Button,
  Loader,
  Center,
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

      const { access, usuario } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      navigate('/dashboard');
    } catch (err) {
      setErro('Credenciais inválidas');
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
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '32px 28px',
        }}
      >
        <Box mb={23} style={{ textAlign: 'center' }}>
          <Title
            order={2}
            style={{ color: '#005A64', fontWeight: 700, fontSize: '28px', marginBottom: '4px' }}
          >
            Diário de Bordo
          </Title>
          <Text
            size="sm"
            style={{
              color: '#4CDDDD',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '1px',
              textAlign: 'center',
            }}
          >
            Acesse com seu usuário, e-mail ou ID vendedor
          </Text>
        </Box>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* Campo de Login */}
          <Box style={{ width: '100%', maxWidth: '320px', marginBottom: '15px' }}>
            <Text
              style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '1px',
                color: '#005A64',
                textAlign: 'left',
              }}
            >
              Login *
            </Text>
            <TextInput
              placeholder="Digite seu login"
              value={identificador}
              onChange={(e) => setIdentificador(e.currentTarget.value)}
              required
              styles={{
                input: {
                  height: 50,
                  fontSize: 16,
                  paddingLeft: 17,
                  paddingRight: 100,
                  borderRadius: 12,
                  border: '1px solid #E0E0E0',
                  '&:focus': {
                    borderColor: '#4CDDDD',
                    boxShadow: '0 0 0 3px rgba(76, 221, 221, 0.2)',
                  },
                },
              }}
            />
          </Box>

          {/* Campo de Senha */}
          <Box style={{ width: '100%', maxWidth: 320, marginBottom: '10px' }}>
            <Text
              style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '2px',
                color: '#005A64',
                textAlign: 'left',
              }}
            >
              Senha *
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <TextInput
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.currentTarget.value)}
                required
                style={{ width: '100%' }}
                styles={{
                  input: {
                    height: 50,
                    fontSize: 16,
                    paddingLeft: 17,
                    paddingRight: 100,
                    borderRadius: 12,
                    border: '1px solid #E0E0E0',
                    '&:focus': {
                      borderColor: '#4CDDDD',
                      boxShadow: '0 0 0 3px rgba(76, 221, 221, 0.2)',
                    },
                  },
                }}
              />
              <div
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  cursor: 'pointer',
                  color: '#005A64',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                }}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </Box>

          {/* Erro */}
          {erro && (
            <Text
              color="red"
              size="sm"
              style={{
                textAlign: 'center',
                marginBottom: 8,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 0, 0, 0.05)',
                borderRadius: 8,
                fontWeight: 500,
                maxWidth: '320px',
                margin: '0 auto 16px',
              }}
            >
              {erro}
            </Text>
          )}

          {/* Botão Entrar */}
          <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
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
                boxShadow: '0 4px 12px rgba(0, 90, 100, 0.3)',
                border: 'none',
                color: 'white',
              }}
            >
              {loading ? (
                <Center>
                  <Loader size="sm" color="white" />
                </Center>
              ) : (
                'Entrar'
              )}
            </Button>
          </Box>

          {/* Esqueci minha senha */}
          <Center mt={-5} mb={5}>
  <Text
    style={{
      color: '#005A64',
      fontSize: 13,
      cursor: 'pointer',
      textDecoration: 'underline',
      fontWeight: 600,
    }}
    onClick={() => navigate('/solicitar-reset')}
  >
    Esqueci minha senha
  </Text>
</Center>
        </form>
      </Paper>
    </div>
  );
}
