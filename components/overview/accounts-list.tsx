import type { Account } from '@/lib/types';
import { InstitutionBadge } from '@/components/common/institution-badge';
import { formatBRL } from '@/lib/format/money';
import { formatDateTime } from '@/lib/format/date';
import { surfaceClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

const accountTypeLabels: Record<Account['type'], string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  investimento: 'Investimentos',
  credito: 'Cartão de crédito',
};

export function AccountsList({ accounts }: { accounts: Account[] }) {
  return (
    <ul className={cn('divide-y divide-border', surfaceClass)}>
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center gap-3 px-4 py-3">
          <InstitutionBadge institution={account.institution} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text">{account.institution.name}</p>
            <p className="text-xs text-muted">
              {accountTypeLabels[account.type]} · atualizado {formatDateTime(account.lastUpdated)}
            </p>
          </div>
          <span className="tabular shrink-0 font-mono text-sm text-text">
            {formatBRL(account.balance)}
          </span>
        </li>
      ))}
    </ul>
  );
}
