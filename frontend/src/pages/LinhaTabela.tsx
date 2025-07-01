import React from 'react';
import {
  Button,
  Select,
  TextInput,
  Textarea,
  Badge,
  Group,
} from '@mantine/core';
import styles from './InteracoesPage.module.css';

interface Props {
  item: any;
  tipoSelecionado: { [key: number]: string };
  onTipoChange: (id: number, value: string) => void;
  expandirId: number | null;
  setExpandirId: React.Dispatch<React.SetStateAction<number | null>>;
  valorOportunidade: string;
  setValorOportunidade: React.Dispatch<React.SetStateAction<string>>;
  observacaoOportunidade: string;
  setObservacaoOportunidade: React.Dispatch<React.SetStateAction<string>>;
  registrarInteracao: (
    parceiroId: number,
    tipo: string,
    oportunidade: boolean,
    valor?: number,
    observacao?: string
  ) => void;
}

const LinhaTabela: React.FC<Props> = React.memo(({
  item,
  tipoSelecionado,
  onTipoChange,
  expandirId,
  setExpandirId,
  valorOportunidade,
  setValorOportunidade,
  observacaoOportunidade,
  setObservacaoOportunidade,
  registrarInteracao,
}) => {
  return (
    <>
      <tr className={item.gatilho_extra ? styles.gatilhoRow : ''}>
        <td>{item.parceiro}</td>
        <td>{item.unidade}</td>
        <td>{item.classificacao}</td>
        <td>{item.status}</td>
        <td>
          {item.gatilho_extra ? (
            <Badge color="red" size="sm">{item.gatilho_extra}</Badge>
          ) : "-"}
        </td>
        <td>
          <Select
            placeholder="Tipo"
            className={styles.select}
            value={tipoSelecionado[item.id] || ''}
            onChange={(v) => {
              if (v) onTipoChange(item.id, v);
            }}
            data={[
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'email',    label: 'E-mail' },
              { value: 'ligacao',  label: 'Ligação' },
              { value: 'visita',  label: 'Visita Presencial' },
            ]}
            clearable={false}
          />
        </td>
        <td>
          <Button size="xs" onClick={() => setExpandirId(item.id)}>
            Marcar como interagido
          </Button>
        </td>
      </tr>

      {expandirId === item.id && (
        <tr>
          <td colSpan={7}>
            <Group grow style={{ marginTop: 10 }}>
              <TextInput
                label="Valor da Oportunidade (R$)"
                placeholder="5000"
                value={valorOportunidade}
                onChange={e => setValorOportunidade(e.currentTarget.value)}
              />
              <Textarea
                label="Observação"
                placeholder="Detalhes adicionais..."
                value={observacaoOportunidade}
                onChange={e => setObservacaoOportunidade(e.currentTarget.value)}
              />
            </Group>
            <Group style={{ marginTop: 16 }} justify="flex-end">
              <Button
                color="blue"
                onClick={() => registrarInteracao(
                  item.id,
                  tipoSelecionado[item.id] || '',
                  true,
                  parseFloat(valorOportunidade.replace(',', '.')),
                  observacaoOportunidade
                )}
              >
                Salvar e Criar Oportunidade
              </Button>
              <Button
                color="gray"
                onClick={() => registrarInteracao(
                  item.id,
                  tipoSelecionado[item.id] || '',
                  false
                )}
              >
                Só Interagir
              </Button>
              <Button
                color="red"
                variant="outline"
                onClick={() => {
                  setExpandirId(null);
                  setValorOportunidade('');
                  setObservacaoOportunidade('');
                }}
              >
                Cancelar
              </Button>
            </Group>
          </td>
        </tr>
      )}
    </>
  );
});

export default LinhaTabela;
