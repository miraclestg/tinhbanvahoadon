import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fmt, owedOf } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import * as S from '@/lib/store';
import { CATEGORIES, type Expense, type Trip } from '@/lib/types';

interface Props {
  trip: Trip;
  expense: Expense | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (e: Expense) => void;
}

export function ExpenseDetail({ trip, expense, canEdit, onClose, onEdit }: Props) {
  const { t } = useI18n();
  const [photo, setPhoto] = useState<string | null>(null);
  const name = (id: string) => trip.members.find((m) => m.id === id)?.name ?? '?';

  useEffect(() => {
    setPhoto(null);
    if (expense?.hasPhoto) S.getPhoto(trip.id, expense.id).then(setPhoto);
  }, [expense, trip.id]);

  return (
    <Dialog open={!!expense} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {expense && (
          <>
            <DialogHeader>
              <DialogTitle>{expense.title}</DialogTitle>
              <DialogDescription>
                {CATEGORIES[expense.category]} {t('cat_' + expense.category)} · {expense.datetime.replace('T', ' ')}
              </DialogDescription>
            </DialogHeader>
            <div className="mb-3 text-3xl font-bold text-primary">{fmt(expense.amount)}</div>

            <Section title={t('paidBy')}>
              {expense.payers.map((p) => (
                <Row key={p.memberId} left={name(p.memberId)} right={fmt(p.amount)} />
              ))}
            </Section>

            <Section title={t('perPerson')}>
              {Object.entries(owedOf(expense, trip.members)).map(([id, v]) => (
                <Row key={id} left={name(id)} right={fmt(v)} />
              ))}
            </Section>

            {expense.note && <p className="mt-3 text-sm text-muted-foreground">{expense.note}</p>}
            {photo && <img src={photo} alt="" className="mt-4 w-full rounded-2xl" />}

            {canEdit && (
              <Button className="mt-5 w-full" onClick={() => onEdit(expense)}>
                <Pencil /> {t('edit')}
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="divide-y rounded-lg border bg-card">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 text-sm">
      <span>{left}</span>
      <b>{right}</b>
    </div>
  );
}
