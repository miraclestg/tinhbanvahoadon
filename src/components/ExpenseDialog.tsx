import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmt } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { resizeImage } from '@/lib/image';
import * as S from '@/lib/store';
import { useTrips } from '@/lib/trips';
import { CATEGORIES, type CategoryKey, type Expense, type SplitMode, type Trip } from '@/lib/types';
import { cn, nowLocal, uid } from '@/lib/utils';

interface Props {
  trip: Trip;
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDialog({ trip, expense, open, onOpenChange }: Props) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(expense ? 'editExpense' : 'addExpense')}</DialogTitle>
        </DialogHeader>
        <ExpenseForm trip={trip} expense={expense} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({ trip, expense, onClose }: { trip: Trip; expense: Expense | null; onClose: () => void }) {
  const { t } = useI18n();
  const { saveTrip } = useTrips();
  const isNew = !expense;
  const e: Expense = expense ?? {
    id: uid(),
    title: '',
    amount: 0,
    category: 'food',
    datetime: nowLocal(),
    payers: [],
    participants: trip.members.map((m) => m.id),
    mode: 'equal',
    custom: {},
    note: '',
    hasPhoto: false,
  };

  const [title, setTitle] = useState(e.title);
  const [amount, setAmount] = useState(e.amount ? String(e.amount) : '');
  const [category, setCategory] = useState<CategoryKey>(e.category);
  const [datetime, setDatetime] = useState(e.datetime);
  const [payer, setPayer] = useState(e.payers[0]?.memberId ?? trip.members[0]?.id ?? '');
  const [multi, setMulti] = useState(e.payers.length > 1);
  const [pay, setPay] = useState<Record<string, string>>(
    Object.fromEntries(e.payers.map((p) => [p.memberId, String(p.amount)]))
  );
  const [parts, setParts] = useState<Record<string, boolean>>(
    Object.fromEntries(trip.members.map((m) => [m.id, e.participants.includes(m.id)]))
  );
  const [mode, setMode] = useState<SplitMode>(e.mode);
  const [cus, setCus] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(e.custom).map(([k, v]) => [k, String(v)]))
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState(e.note);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const total = Number(amount) || 0;
  const paySum = trip.members.reduce((s, m) => s + (Number(pay[m.id]) || 0), 0);
  const selected = trip.members.filter((m) => parts[m.id]);
  const cusSum = selected.reduce((s, m) => s + (Number(cus[m.id]) || 0), 0);

  const diffHint = (sum: number) => {
    const d = total - sum;
    if (Math.abs(d) < 1) return null;
    return (
      <span className={cn('text-xs font-medium', d < 0 ? 'text-destructive' : 'text-muted-foreground')}>
        {d > 0 ? `${t('remaining')} ${fmt(d)}` : `${t('exceeded')} ${fmt(-d)}`}
      </span>
    );
  };

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!(total > 0)) return setError(t('errAmount'));
    if (!selected.length) return setError(t('errParts'));
    let payers;
    if (multi) {
      payers = trip.members
        .map((m) => ({ memberId: m.id, amount: Number(pay[m.id]) || 0 }))
        .filter((p) => p.amount > 0);
      if (Math.abs(paySum - total) > 1) return setError(t('errPayers'));
    } else {
      payers = [{ memberId: payer, amount: total }];
    }
    const custom: Record<string, number> = {};
    if (mode === 'custom') {
      selected.forEach((m) => (custom[m.id] = Number(cus[m.id]) || 0));
      if (Math.abs(cusSum - total) > 1) return setError(t('errCustom'));
    }
    setBusy(true);
    let hasPhoto = e.hasPhoto;
    if (photo) {
      await S.savePhoto(trip.id, e.id, await resizeImage(photo));
      hasPhoto = true;
    }
    const next: Expense = {
      ...e,
      title: title.trim(),
      amount: total,
      category,
      datetime,
      payers,
      participants: selected.map((m) => m.id),
      mode,
      custom,
      note: note.trim(),
      hasPhoto,
    };
    const expenses = isNew ? [...trip.expenses, next] : trip.expenses.map((x) => (x.id === e.id ? next : x));
    await saveTrip({ ...trip, expenses }, t(isNew ? 'logExpAdd' : 'logExpEdit', next.title, fmt(total)));
    onClose();
  }

  async function remove() {
    if (!confirm(t('confirmDel'))) return;
    if (e.hasPhoto) S.deletePhoto(trip.id, e.id);
    await saveTrip({ ...trip, expenses: trip.expenses.filter((x) => x.id !== e.id) }, t('logExpDel', e.title));
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t('title')}</Label>
        <Input required value={title} onChange={(ev) => setTitle(ev.target.value)} autoFocus={isNew} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('amount')}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            required
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
          />
          {total > 0 && <div className="text-xs text-muted-foreground">{fmt(total)}</div>}
        </div>
        <div className="space-y-1.5">
          <Label>{t('category')}</Label>
          <NativeSelect value={category} onChange={(ev) => setCategory(ev.target.value as CategoryKey)}>
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c]} {t('cat_' + c)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t('datetime')}</Label>
        <Input type="datetime-local" required value={datetime} onChange={(ev) => setDatetime(ev.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>{t('mainPayer')}</Label>
        <NativeSelect value={payer} onChange={(ev) => setPayer(ev.target.value)} disabled={multi}>
          {trip.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </NativeSelect>
        <label className="flex items-center gap-2 pt-1 text-sm">
          <Checkbox checked={multi} onCheckedChange={(v) => setMulti(v === true)} />
          {t('multiPayer')}
        </label>
      </div>

      {multi && (
        <div className="space-y-2 rounded-lg bg-muted/60 p-3">
          <div className="flex items-center justify-between">
            <Label>{t('payAmounts')}</Label>
            {diffHint(paySum)}
          </div>
          {trip.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{m.name}</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-10 w-36"
                value={pay[m.id] ?? ''}
                onChange={(ev) => setPay({ ...pay, [m.id]: ev.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>{t('participants')}</Label>
        <div className="flex flex-wrap gap-2">
          {trip.members.map((m) => (
            <label
              key={m.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                parts[m.id] ? 'border-primary bg-secondary text-secondary-foreground' : 'bg-card'
              )}
            >
              <Checkbox
                checked={!!parts[m.id]}
                onCheckedChange={(v) => setParts({ ...parts, [m.id]: v === true })}
              />
              {m.name}
              {m.people > 1 && <span className="text-xs opacity-70">×{m.people}</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t('splitMode')}</Label>
        <NativeSelect value={mode} onChange={(ev) => setMode(ev.target.value as SplitMode)}>
          <option value="equal">{t('equal')}</option>
          <option value="perHead">{t('perHead')}</option>
          <option value="custom">{t('custom')}</option>
        </NativeSelect>
      </div>

      {mode === 'custom' && (
        <div className="space-y-2 rounded-lg bg-muted/60 p-3">
          <div className="flex justify-end">{diffHint(cusSum)}</div>
          {selected.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{m.name}</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-10 w-36"
                value={cus[m.id] ?? ''}
                onChange={(ev) => setCus({ ...cus, [m.id]: ev.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>{t('receipt')}</Label>
        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:bg-muted">
          <Camera className="size-4" />
          <span className="truncate">{photo ? photo.name : e.hasPhoto ? '📎' : t('receipt')}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => setPhoto(ev.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <Label>{t('note')}</Label>
        <Textarea className="min-h-16" value={note} onChange={(ev) => setNote(ev.target.value)} />
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <DialogFooter className="justify-between">
        {isNew ? (
          <span />
        ) : (
          <Button variant="destructive" onClick={remove}>
            <Trash2 /> {t('del')}
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {t('save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
