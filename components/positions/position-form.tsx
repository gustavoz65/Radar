'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelTitle, dataLabelClass } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';
import type { AssetClass, Position } from '@/lib/types';

/** Field-keyed messages as returned by the route's `z.treeifyError` payload. */
type FieldErrors = Record<string, string[]>;

const assetClassOptions: { value: AssetClass; label: string }[] = [
  { value: 'rendaFixa', label: 'Renda fixa' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'acoes', label: 'Ações e FIIs' },
];

interface FormState {
  assetClass: AssetClass;
  name: string;
  ticker: string;
  institutionCode: string;
  quantity: number;
  unitValue: number;
  investedValue: number;
  contractedRate: string;
  maturityDate: string;
  purchasedAt: string;
  notes: string;
}

const emptyForm: FormState = {
  assetClass: 'rendaFixa',
  name: '',
  ticker: '',
  institutionCode: '',
  quantity: 1,
  unitValue: 0,
  investedValue: 0,
  contractedRate: '',
  maturityDate: '',
  purchasedAt: new Date().toISOString().slice(0, 10),
  notes: '',
};

/** Rebuilds the form fields from a stored position so editing starts pre-filled. */
function formStateFrom(position: Position): FormState {
  const unitValue = position.quantity === 0 ? 0 : position.currentValue / position.quantity;

  return {
    assetClass: position.assetClass,
    name: position.name,
    ticker:
      position.assetClass === 'cripto'
        ? position.symbol
        : position.assetClass === 'acoes'
          ? position.ticker
          : '',
    institutionCode: position.institutionId,
    quantity: position.quantity,
    unitValue: Number(unitValue.toFixed(2)),
    investedValue: position.investedValue,
    contractedRate: position.assetClass === 'rendaFixa' ? position.rateLabel : '',
    maturityDate: position.assetClass === 'rendaFixa' ? position.maturity : '',
    purchasedAt: new Date().toISOString().slice(0, 10),
    notes: '',
  };
}

/** A cleared number input yields '' — never let that reach the API as NaN. */
function toNonNegativeNumber(value: string): number {
  return Math.max(0, Number(value) || 0);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="text-xs text-negative">
      {messages.join(' ')}
    </p>
  );
}

export function PositionForm({
  position,
  onFinished,
}: {
  position?: Position;
  onFinished?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(position);
  const [form, setForm] = useState<FormState>(position ? formStateFrom(position) : emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isFixedIncome = form.assetClass === 'rendaFixa';

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setGeneralError(null);

    // Optional text fields go as null rather than '' so the schema's `.min(1)`
    // treats them as absent instead of invalid.
    const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

    const payload = {
      assetClass: form.assetClass,
      name: form.name,
      ticker: isFixedIncome ? null : orNull(form.ticker),
      institutionCode: orNull(form.institutionCode),
      quantity: form.quantity,
      unitValue: form.unitValue,
      investedValue: form.investedValue,
      contractedRate: isFixedIncome ? orNull(form.contractedRate) : null,
      maturityDate: isFixedIncome ? orNull(form.maturityDate) : null,
      purchasedAt: form.purchasedAt,
      notes: orNull(form.notes),
    };

    try {
      const response = await fetch(
        isEditing ? `/api/positions/${position!.id}` : '/api/positions',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 400) {
        const body = await response.json();
        const properties = body?.errors?.properties as
          Record<string, { errors?: string[] }> | undefined;
        setErrors(
          Object.fromEntries(
            Object.entries(properties ?? {}).map(([key, value]) => [key, value.errors ?? []]),
          ),
        );
        return;
      }

      if (!response.ok) {
        setGeneralError('Não foi possível salvar. Tente novamente.');
        return;
      }

      if (!isEditing) setForm(emptyForm);
      router.refresh();
      onFinished?.();
    } catch {
      setGeneralError('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'tabular border-border bg-bg font-mono text-text';
  const textClass = 'border-border bg-bg text-text';
  const prefix = isEditing ? `edit-${position!.id}` : 'new';
  const fieldId = (name: string) => `${prefix}-${name}`;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', surfaceCardClass)}>
      <div>
        <PanelTitle>{isEditing ? 'Editar posição' : 'Nova posição'}</PanelTitle>
        <p className="mt-1 text-sm text-muted">
          A Pierre não expõe carteira de investimentos, então as posições são cadastradas à mão.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={fieldId('assetClass')} className={dataLabelClass}>
            Classe do ativo
          </Label>
          <select
            id={fieldId('assetClass')}
            value={form.assetClass}
            onChange={(event) => update('assetClass', event.target.value as AssetClass)}
            className={cn(
              'h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              textClass,
            )}
          >
            {assetClassOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError messages={errors.assetClass} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('name')} className={dataLabelClass}>
            Nome
          </Label>
          <Input
            id={fieldId('name')}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="CDB Banco do Brasil 2028"
            className={textClass}
          />
          <FieldError messages={errors.name} />
        </div>

        {!isFixedIncome && (
          <div className="space-y-1.5">
            <Label htmlFor={fieldId('ticker')} className={dataLabelClass}>
              Ticker / símbolo
            </Label>
            <Input
              id={fieldId('ticker')}
              value={form.ticker}
              onChange={(event) => update('ticker', event.target.value)}
              placeholder={form.assetClass === 'cripto' ? 'BTC' : 'PETR4'}
              className={inputClass}
            />
            <FieldError messages={errors.ticker} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('institutionCode')} className={dataLabelClass}>
            Instituição
          </Label>
          <Input
            id={fieldId('institutionCode')}
            value={form.institutionCode}
            onChange={(event) => update('institutionCode', event.target.value)}
            placeholder="BANCO_DO_BRASIL"
            className={textClass}
          />
          <FieldError messages={errors.institutionCode} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('quantity')} className={dataLabelClass}>
            Quantidade
          </Label>
          <Input
            id={fieldId('quantity')}
            type="number"
            min={0}
            step="any"
            value={form.quantity}
            onChange={(event) => update('quantity', toNonNegativeNumber(event.target.value))}
            className={inputClass}
          />
          <FieldError messages={errors.quantity} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('unitValue')} className={dataLabelClass}>
            Valor unitário (R$)
          </Label>
          <Input
            id={fieldId('unitValue')}
            type="number"
            min={0}
            step="0.01"
            value={form.unitValue}
            onChange={(event) => update('unitValue', toNonNegativeNumber(event.target.value))}
            className={inputClass}
          />
          <FieldError messages={errors.unitValue} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('investedValue')} className={dataLabelClass}>
            Valor investido (R$)
          </Label>
          <Input
            id={fieldId('investedValue')}
            type="number"
            min={0}
            step="0.01"
            value={form.investedValue}
            onChange={(event) => update('investedValue', toNonNegativeNumber(event.target.value))}
            className={inputClass}
          />
          <FieldError messages={errors.investedValue} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fieldId('purchasedAt')} className={dataLabelClass}>
            Data da compra
          </Label>
          <Input
            id={fieldId('purchasedAt')}
            type="date"
            value={form.purchasedAt}
            onChange={(event) => update('purchasedAt', event.target.value)}
            className={inputClass}
          />
          <FieldError messages={errors.purchasedAt} />
        </div>

        {isFixedIncome && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={fieldId('contractedRate')} className={dataLabelClass}>
                Taxa contratada
              </Label>
              <Input
                id={fieldId('contractedRate')}
                value={form.contractedRate}
                onChange={(event) => update('contractedRate', event.target.value)}
                placeholder="110% do CDI"
                className={textClass}
              />
              <FieldError messages={errors.contractedRate} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={fieldId('maturityDate')} className={dataLabelClass}>
                Vencimento
              </Label>
              <Input
                id={fieldId('maturityDate')}
                type="date"
                value={form.maturityDate}
                onChange={(event) => update('maturityDate', event.target.value)}
                className={inputClass}
              />
              <FieldError messages={errors.maturityDate} />
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId('notes')} className={dataLabelClass}>
          Observações
        </Label>
        <Input
          id={fieldId('notes')}
          value={form.notes}
          onChange={(event) => update('notes', event.target.value)}
          placeholder="Opcional"
          className={textClass}
        />
        <FieldError messages={errors.notes} />
      </div>

      {generalError ? (
        <p role="alert" className="text-sm text-negative">
          {generalError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
        >
          {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Adicionar posição'}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onFinished}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
