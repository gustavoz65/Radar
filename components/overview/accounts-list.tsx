import type { Account } from '@/lib/types';
import { InstitutionBadge } from '@/components/common/institution-badge';
import { EmptyState } from '@/components/common/empty-state';
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

/** 'YYYY-MM-DD' as 'dd/mm'. The year is noise on a card that closes monthly. */
function shortDay(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

/**
 * Cash accounts. A credit card must never appear here: its balance is a bill,
 * and a list where one row means "money you have" and another means "money you
 * owe" invites the reader to add them up.
 */
export function AccountsList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="Nenhuma conta conectada ainda"
        description='Clique em "Atualizar agora" para buscar suas contas na Pierre.'
      />
    );
  }

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

/**
 * Credit cards, shown the way Pierre's own dashboard shows them: the headline
 * number is the limit still available, with the current bill underneath. The
 * bill is the account's `balance` — Pierre reports the amount used — but calling
 * it a balance next to a checking account would read as money held.
 */
export function CreditCardsList({ accounts }: { accounts: Account[] }) {
  return (
    <ul className={cn('divide-y divide-border', surfaceClass)}>
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center gap-3 px-4 py-3">
          <InstitutionBadge institution={account.institution} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text">{account.institution.name}</p>
            <p className="text-xs text-muted">
              {/* Pierre marks every bill as unofficial: transactions may not have posted. */}
              Fatura {account.billIsOfficial ? '' : '≈ '}
              {formatBRL(account.balance)}
              {account.balanceDueDate ? ` · vence ${shortDay(account.balanceDueDate)}` : ''}
              {account.closingDay !== null ? ` · fecha dia ${account.closingDay}` : ''}
            </p>
            {account.minimumPayment !== null ? (
              <p className="text-xs text-muted">
                Mínimo {formatBRL(account.minimumPayment)}
                {account.creditLimit !== null ? ` · limite ${formatBRL(account.creditLimit)}` : ''}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="tabular font-mono text-sm text-text">
              {account.availableCreditLimit === null
                ? '—'
                : formatBRL(account.availableCreditLimit)}
            </p>
            <p className="text-xs text-muted">disponível</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
