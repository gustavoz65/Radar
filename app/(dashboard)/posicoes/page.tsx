import { SectionHeader } from '@/components/common/section-header';
import { EmptyState } from '@/components/common/empty-state';
import { PositionForm } from '@/components/positions/position-form';
import { PositionsTable } from '@/components/positions/positions-table';
import {
  getCryptoPositions,
  getEquityPositions,
  getFixedIncomePositions,
} from '@/lib/data/services';

export default async function PosicoesPage() {
  const [fixedIncome, crypto, equities] = await Promise.all([
    getFixedIncomePositions(),
    getCryptoPositions(),
    getEquityPositions(),
  ]);

  const positions = [...fixedIncome, ...crypto, ...equities];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Posições"
        description="Cadastro manual da carteira. É daqui que sai o patrimônio consolidado da visão geral."
      />

      <PositionForm />

      {positions.length === 0 ? (
        <EmptyState
          title="Nenhuma posição cadastrada ainda"
          description="Cadastre um CDB, uma ação ou uma cripto para ver seu patrimônio consolidado na visão geral."
        />
      ) : (
        <PositionsTable positions={positions} />
      )}
    </div>
  );
}
