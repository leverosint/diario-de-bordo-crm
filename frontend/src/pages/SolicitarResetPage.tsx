import { useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Center } from '@mantine/core';
import axios from 'axios';

export default function SolicitarResetPage() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/solicitar-reset-senha/`, {
        email: email,
      });
      setMensagem('Enviamos um link para seu e-mail!');
      setErro('');
    } catch (error) {
      setErro('E-mail não encontrado.');
      setMensagem('');
    }
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Paper withBorder p="lg" shadow="md" style={{ width: 380 }}>
        <Title order={2} style={{ color: '#005A64', marginBottom: 10 }} ta="center">
          Recuperar Senha
        </Title>
        <TextInput
          label="E-mail"
          placeholder="Digite seu e-mail cadastrado"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <Button fullWidth mt="md" onClick={handleSubmit} style={{ backgroundColor: '#005A64' }}>
          Enviar Link
        </Button>
        {mensagem && <Text c="green" mt="md">{mensagem}</Text>}
        {erro && <Text c="red" mt="md">{erro}</Text>}
      </Paper>
    </Center>
  );
}
