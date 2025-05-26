import { useState, useEffect } from 'react';

import type { FormEvent } from 'react';
import {
  TextInput,
  Button,
  Group,
  Container,
  Title,
  Select,
  FileInput,
  Text,
} from '@mantine/core';
import axios from 'axios';

interface CanalVenda {
  id: number;
  nome: string;
}

export default function CadastroParceiro() {
  const [form, setForm] = useState({
    codigo: '',
    parceiro: '',
    classificacao: '',
    consultor: '',
    unidade: '',
    cidade: '',
    uf: '',
    canal_venda: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/parceiros/`,
        form
      );
      setMensagem('Parceiro cadastrado com sucesso!');
      console.log(response.data);
    } catch (error) {
      console.error('Erro ao cadastrar parceiro:', error);
      setMensagem('Erro ao cadastrar parceiro');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMensagem('Selecione um arquivo antes de enviar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload-parceiros/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMensagem(
        `Upload concluído! ${response.data.criadas} criados, ${response.data.atualizadas} atualizados.`
      );
    } catch (error) {
      console.error('Erro no upload:', error);
      setMensagem('Erro ao enviar o arquivo.');
    }
  };

  useEffect(() => {
    const fetchCanais = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/canais-venda/`
        );
        setCanais(response.data);
      } catch (error) {
        console.error('Erro ao buscar canais de venda:', error);
      }
    };

    fetchCanais();
  }, []);

  return (
    <Container size="sm" mt="xl">
      <Title order={2} mb="md">
        Cadastro de Parceiros
      </Title>

      <form onSubmit={handleSubmit}>
        <TextInput
          label="Código"
          value={form.codigo}
          onChange={(e) => handleChange('codigo', e.target.value)}
          required
        />
        <TextInput
          label="Parceiro"
          value={form.parceiro}
          onChange={(e) => handleChange('parceiro', e.target.value)}
          required
        />
        <TextInput
          label="Classificação"
          value={form.classificacao}
          onChange={(e) => handleChange('classificacao', e.target.value)}
        />
        <TextInput
          label="Consultor"
          value={form.consultor}
          onChange={(e) => handleChange('consultor', e.target.value)}
        />
        <TextInput
          label="Unidade"
          value={form.unidade}
          onChange={(e) => handleChange('unidade', e.target.value)}
        />
        <TextInput
          label="Cidade"
          value={form.cidade}
          onChange={(e) => handleChange('cidade', e.target.value)}
        />
        <TextInput
          label="UF"
          value={form.uf}
          onChange={(e) => handleChange('uf', e.target.value)}
          maxLength={2}
        />

        <Select
          label="Canal de Venda"
          placeholder="Selecione um canal"
          data={canais.map((c) => ({ value: String(c.id), label: c.nome }))}
          value={form.canal_venda}
          onChange={(value) => handleChange('canal_venda', value || '')}
          required
        />

        <Group mt="md" justify="flex-end">
          <Button type="submit" color="teal">
            Cadastrar
          </Button>
        </Group>
      </form>

      <Title order={3} mt="xl" mb="xs">
        Upload em massa (Excel/CSV)
      </Title>
      <FileInput
        label="Selecionar arquivo"
        placeholder="Escolha um arquivo Excel ou CSV"
        onChange={setFile}
      />
      <Group mt="sm">
        <Button onClick={handleUpload} color="blue">
          Enviar Arquivo
        </Button>
      </Group>

      {mensagem && (
        <Text mt="md" color="teal">
          {mensagem}
        </Text>
      )}
    </Container>
  );
}
