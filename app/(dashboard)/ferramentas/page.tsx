import { SectionHeader } from '@/components/common/section-header';
import { EmptyState } from '@/components/common/empty-state';
import { CdbComparator } from '@/components/tools/cdb-comparator';
import { ContributionSimulator } from '@/components/tools/contribution-simulator';
import { getMarketRates } from '@/lib/data/services';

export default async function FerramentasPage() {
  const rates = await getMarketRates();

  // The simulators are only honest with real reference rates; inventing them
  // would make every projection on this screen fiction.
  if (!rates) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Ferramentas" />
        <EmptyState
          title="As taxas de referência ainda não foram coletadas"
          description='Clique em "Atualizar agora" na visão geral para buscar Selic, CDI e poupança no Banco Central.'
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ferramentas"
        description="Simulações com as taxas de referência do momento. Nenhuma delas é recomendação de compra."
      />
      <CdbComparator cdi={rates.cdi} selic={rates.selic} poupanca={rates.poupanca} />
      <ContributionSimulator defaultAnnualRate={rates.cdi} />
    </div>
  );
}
