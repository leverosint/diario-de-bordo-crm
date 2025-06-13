import { useState, useEffect } from 'react';
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
  SimpleGrid,
  Table,
} from '@mantine/core';
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
  canal_venda: string;
  cidade: string;
  uf: string;
}

export default function CadastroParceiro() {
  const [form, setForm] = useState<any>({
    id: null,
    codigo: '',
    parceiro: '',
    classificacao: '',
    consultor: '',
    canal_venda: '',
    cidade: '',
    uf: '',
    unidade: '',
    janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0,
    julho: 0, agosto: 0, setembro: 0, outubro: 0, novembro: 0, dezembro: 0,
    janeiro_2: 0, fevereiro_2: 0, marco_2: 0,
  });

  const [file, setFile] = useState<File | null>(null);
  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [popupAberto, setPopupAberto] = useState(false);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [excluirId, setExcluirId] = useState<number | null>(null);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const isFormValido = () =>
    form.codigo && form.parceiro && form.canal_venda;

  const limparFormulario = () => {
    setForm({
      id: null,
      codigo: '',
      parceiro: '',
      classificacao: '',
      consultor: '',
      canal_venda: '',
      cidade: '',
      uf: '',
      unidade: '',
      janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0,
      julho: 0, agosto: 0, setembro: 0, outubro: 0, novembro: 0, dezembro: 0,
      janeiro_2: 0, fevereiro_2: 0, marco_2: 0,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const { canal_venda, id, ...rest } = form;
      const payload = { ...rest, canal_venda_id: Number(canal_venda) };

      if (id) {
        await axios.put(`${import.meta.env.VITE_API_URL}/parceiros/${id}/`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/parceiros/`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      }

      setPopupAberto(true);
      setMensagem(null);
      buscarParceiros();
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar parceiro:', error);
      setMensagem('Erro ao salvar parceiro');
    }
  };

  const handleUpload = async () => {
    if (!file) return setMensagem('Selecione um arquivo antes de enviar.');
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
      buscarParceiros();
    } catch (error) {
      console.error('Erro no upload:', error);
      setMensagem('Erro ao enviar o arquivo.');
    }
  };

  const buscarParceiros = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/parceiros/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setParceiros(response.data);
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    }
  };

  const excluirParceiro = async () => {
    if (excluirId === null) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/parceiros/${excluirId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExcluirId(null);
      buscarParceiros();
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error);
    }
  };

  useEffect(() => {
    const fetchCanais = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCanais(response.data);
      } catch (error) {
        console.error('Erro ao buscar canais de venda:', error);
      }
    };
    const fetchConsultores = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=1`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setConsultores(response.data);
      } catch (error) {
        console.error('Erro ao buscar consultores:', error);
      }
    };
    fetchCanais();
    fetchConsultores();
    buscarParceiros();
  }, []);

  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    'janeiro_2', 'fevereiro_2', 'marco_2',
  ];

  const labelMes = (mes: string) =>
    mes.endsWith('_2') ? `${mes.charAt(0).toUpperCase() + mes.slice(1, -2)} (2º ano)` : mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <Container size="xl" mt="xl">
      <Title order={2} mb="md">Cadastro de Parceiros</Title>

      <form onSubmit={handleSubmit}>
        <Accordion variant="default" defaultValue="dados-parceiro">
          <Accordion.Item value="dados-parceiro">
            <Accordion.Control>Informações do Parceiro</Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={2} spacing="md">
                <TextInput label="Código" required value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} />
                <TextInput label="Parceiro" required value={form.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} />
                <Select label="Classificação" placeholder="Selecione" data={['Diamante', 'Esmeralda', 'Ouro', 'Prata', 'Bronze']} value={form.classificacao} onChange={(value) => handleChange('classificacao', value || '')} />
                <Select label="Consultor" placeholder="Selecione" data={consultores.map(c => ({ value: c.id_vendedor, label: c.username }))} value={form.consultor} onChange={(value) => handleChange('consultor', value || '')} />
                <Select label="Canal de Venda" placeholder="Selecione" required data={canais.map(c => ({ value: String(c.id), label: c.nome }))} value={form.canal_venda} onChange={(value) => handleChange('canal_venda', value || '')} />
                <TextInput label="Unidade" value={form.unidade} onChange={(e) => handleChange('unidade', e.target.value)} />
                <TextInput label="Cidade" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
                <TextInput label="UF" maxLength={2} value={form.uf} onChange={(e) => handleChange('uf', e.target.value)} />
              </SimpleGrid>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="faturamento-mensal">
            <Accordion.Control>Faturamento Mensal</Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={3} spacing="md">
                {meses.map((mes) => (
                  <TextInput
                    key={mes}
                    label={labelMes(mes)}
                    value={form[mes as keyof typeof form].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    onChange={(e) => {
                      const raw = e.currentTarget.value.replace(/[^\d]/g, '');
                      const parsed = parseFloat(raw) / 100;
                      handleChange(mes as keyof typeof form, isNaN(parsed) ? 0 : parsed);
                    }}
                  />
                ))}
              </SimpleGrid>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group mt="lg" justify="flex-end">
          <Button type="submit" color="green" disabled={!isFormValido()}>
            {form.id ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </Group>
      </form>

      <Title order={3} mt="xl" mb="xs">Upload em massa (Excel/CSV)</Title>
      <FileInput label="Selecionar arquivo" placeholder="Escolha um arquivo Excel ou CSV" onChange={setFile} />
      <Group mt="sm">
        <Button onClick={handleUpload} color="blue">Enviar Arquivo</Button>
      </Group>

      {mensagem && <Notification mt="md" color="red">{mensagem}</Notification>}

      <Title order={3} mt="xl" mb="xs">Parceiros Cadastrados</Title>
      <Table striped withColumnBorders>
        <thead>
          <tr>
            <th>Código</th>
            <th>Parceiro</th>
            <th>Consultor</th>
            <th>Canal</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {parceiros.map(p => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.parceiro}</td>
              <td>{p.consultor}</td>
              <td>{p.canal_venda}</td>
              <td>
                <Button size="xs" variant="outline" onClick={() => setForm({ ...form, ...p, id: p.id })}>Editar</Button>{' '}
                <Button size="xs" color="red" onClick={() => setExcluirId(p.id)}>Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        opened={excluirId !== null}
        onClose={() => setExcluirId(null)}
        title="Confirmar exclusão"
        centered
      >
        <Text>Tem certeza que deseja excluir este parceiro?</Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setExcluirId(null)}>Cancelar</Button>
          <Button color="red" onClick={excluirParceiro}>Confirmar</Button>
        </Group>
      </Modal>

      <Modal opened={popupAberto} onClose={() => setPopupAberto(false)} title="Sucesso!" centered>
        <Text>Parceiro {form.id ? 'atualizado' : 'cadastrado'} com sucesso!</Text>
      </Modal>
    </Container>
  );
}
