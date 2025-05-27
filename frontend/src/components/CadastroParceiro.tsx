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
  NumberInput,
} from '@mantine/core';
import axios from 'axios';

interface CanalVenda {
  id: number;
  nome: string;
}

export default function CadastroParceiros() {
  const [form, setForm] = useState({
    codigo: '',
    parceiro: '',
    classificacao: '',
    consultor: '',
    unidade: '',
    cidade: '',
    uf: '',
    canal_venda: '',
    janeiro: 0,
    fevereiro: 0,
    marco: 0,
    abril: 0,
    maio: 0,
    junho: 0,
    julho: 0,
    agosto: 0,
    setembro: 0,
    outubro: 0,
    novembro: 0,
    dezembro: 0,
    janeiro_2: 0,
    fevereiro_2: 0,
    marco_2: 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [recorrencia, setRecorrencia] = useState<number | null>(null);
  const [statusFat, setStatusFat] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { canal_venda, ...rest } = form;
      const payload = {
        ...rest,
        canal_venda_id: Number(canal_venda),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/parceiros/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setMensagem('Parceiro cadastrado com sucesso!');
      if (response.data.recorrencia) setRecorrencia(response.data.recorrencia);
      if (response.data.status) setStatusFat(response.data.status);
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
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
          `${import.meta.env.VITE_API_URL}/canais-venda/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
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
        <TextInput label="Código" value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} required />
        <TextInput label="Parceiro" value={form.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} required />
        <TextInput label="Classificação" value={form.classificacao} onChange={(e) => handleChange('classificacao', e.target.value)} />
        <TextInput label="Consultor" value={form.consultor} onChange={(e) => handleChange('consultor', e.target.value)} />
        <Select
          label="Canal de Venda"
          placeholder="Selecione um canal"
          data={canais.map((c) => ({ value: String(c.id), label: c.nome }))}
          value={form.canal_venda}
          onChange={(value) => handleChange('canal_venda', value || '')}
          required
        />
        <TextInput label="Cidade" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
        <TextInput label="UF" value={form.uf} onChange={(e) => handleChange('uf', e.target.value)} maxLength={2} />

        <Title order={4} mt="lg" mb="sm">Faturamento Mensal</Title>
        {[
          'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
          'janeiro_2', 'fevereiro_2', 'marco_2'
        ].map((mes) => (
          <NumberInput
            key={mes}
            label={mes.charAt(0).toUpperCase() + mes.slice(1).replace('_2', ' (2º ano)')}
            value={form[mes as keyof typeof form]}
            onChange={(value) => handleChange(mes as keyof typeof form, Number(value))}
            parser={(value) => value?.replace(/[R$\s.]/g, '').replace(',', '.') || ''}
            formatter={(value) =>
              !Number.isNaN(parseFloat(value || ''))
                ? `R$ ${new Intl.NumberFormat('pt-BR').format(parseFloat(value))}`
                : 'R$ 0,00'
            }
          />
        ))}

        {recorrencia !== null && (
          <Text mt="md">Recorrência: <strong>{recorrencia}</strong></Text>
        )}
        {statusFat && (
          <Text mt="xs" color={statusFat.includes('Recorrente') ? 'green' : statusFat.includes('30') ? 'orange' : statusFat.includes('60') ? 'red' : 'pink'}>
            Status: <strong>{statusFat}</strong>
          </Text>
        )}

        <Group mt="md" justify="flex-end">
          <Button type="submit" color="teal">Cadastrar</Button>
        </Group>
      </form>

      <Title order={3} mt="xl" mb="xs">Upload em massa (Excel/CSV)</Title>
      <FileInput label="Selecionar arquivo" placeholder="Escolha um arquivo Excel ou CSV" onChange={setFile} />
      <Group mt="sm">
        <Button onClick={handleUpload} color="blue">Enviar Arquivo</Button>
      </Group>

      {mensagem && (
        <Text mt="md" color="teal">
          {mensagem}
        </Text>
      )}
    </Container>
  );
}
