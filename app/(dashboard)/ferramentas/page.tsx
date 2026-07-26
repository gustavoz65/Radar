import { SectionHeader } from '@/components/common/section-header';
import { CdbComparator } from '@/components/tools/cdb-comparator';
import { ContributionSimulator } from '@/components/tools/contribution-simulator';
import { getMarketRates } from '@/lib/data/services';

export default async function FerramentasPage() {
  const rates = await getMarketRates();

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
