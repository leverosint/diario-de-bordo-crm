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
  Accordion,
  Table,
  ActionIcon,
  Box,
  Divider
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'axios';

interface CanalVenda {
  id: number;
  nome: string;
}

interface Parceiro {
  id: number;
  codigo: string;
  parceiro: string;
  unidade: string;
  classificacao: string;
  cidade: string;
  uf: string;
}

export default function CadastroParceiro() {
  const [form, setForm] = useState({
    codigo: '', parceiro: '', classificacao: '', consultor: '', canal_venda: '', cidade: '', uf: '', unidade: '',
    janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0, julho: 0, agosto: 0,
    setembro: 0, outubro: 0, novembro: 0, dezembro: 0,
    janeiro_2: 0, fevereiro_2: 0, marco_2: 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { canal_venda, ...rest } = form;
      const payload = { ...rest, canal_venda_id: Number(canal_venda) };

      await axios.post(`${import.meta.env.VITE_API_URL}/parceiros-list/`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setMensagem('Parceiro cadastrado com sucesso!');
      fetchParceiros();
    } catch (error) {
      console.error('Erro ao cadastrar parceiro:', error);
      setMensagem('Erro ao cadastrar parceiro');
    }
  };

  const handleUpload = async () => {
    if (!file) return setMensagem('Selecione um arquivo antes de enviar.');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload-parceiros/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMensagem(`Upload concluído! ${res.data.criadas} criados, ${res.data.atualizadas} atualizados.`);
      fetchParceiros();
    } catch (err) {
      setMensagem('Erro ao enviar o arquivo.');
    }
  };

  const fetchParceiros = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setParceiros(res.data);
    } catch (err) {
      console.error('Erro ao buscar parceiros');
    }
  };

  const deleteParceiro = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/parceiros-list/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchParceiros();
    } catch (err) {
      console.error('Erro ao deletar parceiro');
    }
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(res => setCanais(res.data));
    fetchParceiros();
  }, []);

  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro', 'janeiro_2', 'fevereiro_2', 'marco_2'];

  return (
    <Container size="xl" mt="xl">
      <Title order={2} mb="md">Cadastro de Parceiros</Title>
      <form onSubmit={handleSubmit}>
        <Accordion variant="separated" multiple>
          <Accordion.Item value="info">
            <Accordion.Control>Informações do Parceiro</Accordion.Control>
            <Accordion.Panel>
              <Group grow>
                <TextInput label="Código" value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} required />
                <TextInput label="Parceiro" value={form.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} required />
              </Group>
              <Group grow>
                <TextInput label="Classificação" value={form.classificacao} onChange={(e) => handleChange('classificacao', e.target.value)} />
                <TextInput label="Consultor" value={form.consultor} onChange={(e) => handleChange('consultor', e.target.value)} />
              </Group>
              <Group grow>
                <Select
                  label="Canal de Venda"
                  placeholder="Selecione"
                  data={canais.map(c => ({ value: String(c.id), label: c.nome }))}
                  value={form.canal_venda}
                  onChange={(v) => handleChange('canal_venda', v || '')}
                  required
                />
                <TextInput label="Unidade" value={form.unidade} onChange={(e) => handleChange('unidade', e.target.value)} />
              </Group>
              <Group grow>
                <TextInput label="Cidade" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
                <TextInput label="UF" value={form.uf} maxLength={2} onChange={(e) => handleChange('uf', e.target.value)} />
              </Group>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="faturamento">
            <Accordion.Control>Faturamento Mensal</Accordion.Control>
            <Accordion.Panel>
              <Group grow>
                {meses.map(mes => (
                  <TextInput
                    key={mes}
                    label={mes.charAt(0).toUpperCase() + mes.slice(1).replace('_2', ' (2º ano)')}
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form[mes as keyof typeof form]))}
                    onChange={(e) => {
                      const raw = e.currentTarget.value.replace(/[R$\s.]/g, '').replace(',', '.');
                      handleChange(mes as keyof typeof form, isNaN(parseFloat(raw)) ? 0 : parseFloat(raw));
                    }}
                    onFocus={(e) => { e.currentTarget.value = String(form[mes as keyof typeof form] ?? '0'); }}
                  />
                ))}
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group mt="md" justify="flex-end">
          <Button type="submit" color="teal">Cadastrar</Button>
        </Group>
      </form>

      <Divider my="xl" />

      <Title order={3} mb="xs">Upload em massa (Excel/CSV)</Title>
      <FileInput label="Selecionar arquivo" placeholder="Escolha um arquivo" onChange={setFile} />
      <Group mt="sm">
        <Button onClick={handleUpload} color="blue">Enviar Arquivo</Button>
      </Group>

      {mensagem && <Text mt="md" color="teal">{mensagem}</Text>}

      <Divider my="xl" />

      <Title order={3} mb="sm">Parceiros Cadastrados</Title>
      <Box>
      <Table withTableBorder highlightOnHover striped withColumnBorders>

          <thead>
            <tr>
              <th>Parceiro</th>
              <th>Unidade</th>
              <th>Classificação</th>
              <th>Cidade</th>
              <th>UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {parceiros.map(p => (
              <tr key={p.id}>
                <td>{p.parceiro}</td>
                <td>{p.unidade}</td>
                <td>{p.classificacao}</td>
                <td>{p.cidade}</td>
                <td>{p.uf}</td>
                <td>
                  <Group>
                    <ActionIcon variant="light" color="blue"><IconEdit size={18} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => deleteParceiro(p.id)}><IconTrash size={18} /></ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
    </Container>
  );
}
