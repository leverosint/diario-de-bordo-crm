import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  TextInput,
  Button,
  Group,
  Container,
  Title,
  Select,
  Modal,
  Table,
  ScrollArea,
  Collapse,
  Text,
  ActionIcon,
  } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconEdit, IconTrash } from '@tabler/icons-react';
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
    codigo: '',
    parceiro: '',
    classificacao: '',
    consultor: '',
    canal_venda: '',
    cidade: '',
    uf: '',
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

  const [canais, setCanais] = useState<CanalVenda[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [popupAberto, setPopupAberto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; open: boolean }>({ id: 0, open: false });
  const [expandirInfos, setExpandirInfos] = useState(false);
  const [expandirFaturamento, setExpandirFaturamento] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const camposObrigatoriosPreenchidos =
    form.codigo && form.parceiro && form.classificacao && form.consultor && form.canal_venda;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!camposObrigatoriosPreenchidos) return;
    try {
      const { canal_venda, ...rest } = form;
      const payload = {
        ...rest,
        canal_venda_id: Number(canal_venda),
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/parceiros/`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPopupAberto(true);
    } catch (error) {
      console.error('Erro ao cadastrar parceiro:', error);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/parceiros/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setParceiros(parceiros.filter((p) => p.id !== id));
      setConfirmDelete({ id: 0, open: false });
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [canaisRes, consultoresRes, parceirosRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/canais-venda/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/usuarios-por-canal/?canal_id=1`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/parceiros/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setCanais(canaisRes.data);
        setConsultores(consultoresRes.data);
        setParceiros(parceirosRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    fetchData();
  }, []);

  const meses = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    'janeiro_2', 'fevereiro_2', 'marco_2',
  ];

  return (
    <Container size="md" mt="xl">
      <Title order={2}>Cadastro de Parceiros</Title>
      <form onSubmit={handleSubmit}>
        <Group mt="md">
          <Button onClick={() => setExpandirInfos((prev) => !prev)}>
            {expandirInfos ? <IconChevronUp /> : <IconChevronDown />} Informações do Parceiro
          </Button>
          <Button onClick={() => setExpandirFaturamento((prev) => !prev)}>
            {expandirFaturamento ? <IconChevronUp /> : <IconChevronDown />} Faturamento Mensal
          </Button>
        </Group>

        <Collapse in={expandirInfos} mt="md">
          <TextInput label="Código" value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)} required />
          <TextInput label="Parceiro" value={form.parceiro} onChange={(e) => handleChange('parceiro', e.target.value)} required />
          <Select
            label="Classificação"
            placeholder="Selecione"
            data={[
              'Diamante', 'Esmeralda', 'Ouro', 'Prata', 'Bronze',
            ].map((v) => ({ value: v, label: v }))}
            value={form.classificacao}
            onChange={(value) => handleChange('classificacao', value || '')}
            required
          />
          <Select
            label="Consultor"
            data={consultores.map((c) => ({ value: c.id_vendedor, label: c.username }))}
            value={form.consultor}
            onChange={(value) => handleChange('consultor', value || '')}
            required
          />
          <Select
            label="Canal de Venda"
            data={canais.map((c) => ({ value: String(c.id), label: c.nome }))}
            value={form.canal_venda}
            onChange={(value) => handleChange('canal_venda', value || '')}
            required
          />
          <TextInput label="Cidade" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
          <TextInput label="UF" value={form.uf} onChange={(e) => handleChange('uf', e.target.value)} maxLength={2} />
        </Collapse>

        <Collapse in={expandirFaturamento} mt="md">
          <Title order={4} mt="lg">Faturamento Mensal</Title>
          {meses.map((mes) => (
            <TextInput
              key={mes}
              label={mes.charAt(0).toUpperCase() + mes.slice(1).replace('_2', ' (2º ano)')}
              value={
                typeof form[mes as keyof typeof form] === 'number'
                  ? (form[mes as keyof typeof form] as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'R$ 0,00'
              }
              onChange={(e) => {
                const raw = e.currentTarget.value.replace(/[^\d]/g, '');
                const parsed = Number(raw) / 100;
                handleChange(mes as keyof typeof form, isNaN(parsed) ? 0 : parsed);
              }}
            />
          ))}

          <Group mt="md">
            <Button type="submit" color="teal" disabled={!camposObrigatoriosPreenchidos}>
              Cadastrar
            </Button>
          </Group>
        </Collapse>
      </form>

      <Title order={3} mt="xl">Parceiros Cadastrados</Title>
      <ScrollArea mt="md">
        <Table highlightOnHover>
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
                    <ActionIcon color="blue"><IconEdit size={16} /></ActionIcon>
                    <ActionIcon color="red" onClick={() => setConfirmDelete({ id: p.id, open: true })}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={popupAberto}
        onClose={() => setPopupAberto(false)}
        title="Sucesso!"
        centered
      >
        <Text>Parceiro cadastrado com sucesso!</Text>
      </Modal>

      <Modal
        opened={confirmDelete.open}
        onClose={() => setConfirmDelete({ id: 0, open: false })}
        title="Confirmar exclusão"
        centered
      >
        <Text>Tem certeza que deseja excluir este parceiro?</Text>
        <Group mt="md" justify="flex-end">
          <Button color="red" onClick={() => handleExcluir(confirmDelete.id)}>
            Confirmar
          </Button>
          <Button variant="outline" onClick={() => setConfirmDelete({ id: 0, open: false })}>
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
