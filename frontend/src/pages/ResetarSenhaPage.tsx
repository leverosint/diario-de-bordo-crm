import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Center } from '@mantine/core';
import axios from 'axios';

export default function ResetarSenhaPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async () => {
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/reset-senha-confirmar/${uid}/${token}/`, {
        nova_senha: novaSenha,
      });
      setMensagem('Senha redefinida com sucesso!');
      setErro('');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setErro('Link inválido ou expirado.');
      setMensagem('');
    }
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Paper withBorder p="lg" shadow="md" style={{ width: 380 }}>
        <Title order={2} style={{ color: '#005A64', marginBottom: 10 }} ta="center">
          Redefinir Senha
        </Title>
        <TextInput
          label="Nova senha"
          placeholder="Digite a nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.currentTarget.value)}
        />
        <TextInput
          label="Confirmar senha"
          placeholder="Confirme a nova senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.currentTarget.value)}
          mt="sm"
        />
        <Button fullWidth mt="md" onClick={handleSubmit} style={{ backgroundColor: '#005A64' }}>
          Alterar Senha
        </Button>
        {mensagem && <Text c="green" mt="md">{mensagem}</Text>}
        {erro && <Text c="red" mt="md">{erro}</Text>}
      </Paper>
    </Center>
  );
}
