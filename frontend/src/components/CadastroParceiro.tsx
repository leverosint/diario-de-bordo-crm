import { useState, useEffect, type FormEvent } from 'react';
import {
  TextInput,
  Button,
  Group,
  Container,
  Title,
  Select,
  FileInput,
  Text,
  Modal,
  Notification,
  Accordion,
  Grid,
  Table,
  ActionIcon,
  ScrollArea
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'axios';


interface CanalVenda {
  id: number;
  nome: string;
}

interface Consultor {
  id_vendedor: string;
  username: string;
}

interface Parceiro {
  id: number;
  codigo: string;
  parceiro: string;
  classificacao: string;
  consultor: string;
  cidade: string;
  uf: string;
}

export default function CadastroParceiro() {
  const [form, setForm] = useState({
    codigo: '', parceiro: '', classificacao: '', consultor: '', canal_venda: '', cidade: '', uf: '',
    janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0,
    julho: 0, agosto: 0, setembro: 0, outubro: 0, novembro: 0, dezembro: 0,
    janeiro_2: 0, fevereiro_2: 0, marco_2: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [popupAberto, setPopupAberto] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { canal_venda, ...rest } = form;
      const payload = { ...rest, canal_venda_id: Number(canal_venda) };
      await axios.post(`${import.meta.env.VITE_API_URL}/parceiros/`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPopupAberto(true);
      setMensagem(null);
      fetchParceiros();
    } catch {
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
    } catch {
      setMensagem('Erro ao enviar o arquivo.');
    }
  };

  const fetchParceiros = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/parceiros-list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setParceiros(res.data);
    } catch {
      console.error('Erro ao buscar parceiros');
    }
  };

  const deleteParceiro = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/parceiros-list/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchParceiros();
    } catch {
      console.error('Erro ao excluir parceiro');
    }
  };

  useEffect(() => {
    const fetchCanais = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCanais(res.data);
    };
    const fetchConsultores = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=1`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConsultores(res.data);
    };
    fetchCanais();
    fetchConsultores();
    fetchParceiros();
  }, []);

  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    'janeiro_2', 'fevereiro_2', 'marco_2',
  ];

  return (
    <Container size="xl" mt="xl">
      <Title order={2} mb="md">Cadastro de Parceiros</Title>

      <Accordion defaultValue="cadastro">
        <Accordion.Item value="cadastro">
          <Accordion.Control>Informações do Parceiro</Accordion.Control>
          <Accordion.Panel>
            <form onSubmit={handleSubmit}>
              <Grid gutter="md">
                <Grid.Col span={6}><TextInput label="Código" value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} required /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Parceiro" value={form.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} required /></Grid.Col>
                <Grid.Col span={6}><Select label="Classificação" data={["Diamante", "Esmeralda", "Ouro", "Prata", "Bronze"]} value={form.classificacao} onChange={(v) => handleChange('classificacao', v || '')} /></Grid.Col>
                <Grid.Col span={6}><Select label="Consultor" data={consultores.map(c => ({ value: c.id_vendedor, label: c.username }))} value={form.consultor} onChange={(v) => handleChange('consultor', v || '')} /></Grid.Col>
                <Grid.Col span={6}><Select label="Canal de Venda" data={canais.map(c => ({ value: String(c.id), label: c.nome }))} value={form.canal_venda} onChange={(v) => handleChange('canal_venda', v || '')} required /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Cidade" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} /></Grid.Col>
                <Grid.Col span={6}><TextInput label="UF" value={form.uf} maxLength={2} onChange={(e) => handleChange('uf', e.target.value)} /></Grid.Col>
              </Grid>
              <Group mt="md" justify="flex-end"><Button type="submit" color="teal">Cadastrar</Button></Group>
            </form>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="faturamento">
          <Accordion.Control>Faturamento Mensal</Accordion.Control>
          <Accordion.Panel>
            <Grid>
              {meses.map((mes) => (
                <Grid.Col span={3} key={mes}>
                  <TextInput
                    label={mes.replace('_2', ' (2º ano)').replace(/^./, l => l.toUpperCase())}
                    value={form[mes as keyof typeof form].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    onChange={(e) => {
                      const raw = e.currentTarget.value.replace(/[^\d]/g, '');
                      const parsed = parseFloat(raw) / 100;
                      handleChange(mes as keyof typeof form, isNaN(parsed) ? 0 : parsed);
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => {
                      const raw = form[mes as keyof typeof form] || 0;
                      e.currentTarget.value = Number(raw).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    }}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Title order={3} mt="xl" mb="xs">Upload em massa (Excel/CSV)</Title>
      <FileInput label="Selecionar arquivo" placeholder="Escolha um arquivo" onChange={setFile} />
      <Group mt="sm"><Button onClick={handleUpload} color="blue">Enviar Arquivo</Button></Group>

      <Title order={3} mt="xl" mb="xs">Parceiros Cadastrados</Title>
      <ScrollArea>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Código</th>
              <th>Parceiro</th>
              <th>Classificação</th>
              <th>Consultor</th>
              <th>Cidade</th>
              <th>UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {parceiros.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.parceiro}</td>
                <td>{p.classificacao}</td>
                <td>{p.consultor}</td>
                <td>{p.cidade}</td>
                <td>{p.uf}</td>
                <td>
                  <Group>
                    <ActionIcon color="blue" variant="subtle"><IconEdit size={16} /></ActionIcon>
                    <ActionIcon color="red" variant="subtle" onClick={() => deleteParceiro(p.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>

      {mensagem && <Notification mt="md" color="red">{mensagem}</Notification>}
      <Modal opened={popupAberto} onClose={() => setPopupAberto(false)} title="Sucesso!" centered>
        <Text>Parceiro cadastrado com sucesso!</Text>
      </Modal>
    </Container>
  );
}