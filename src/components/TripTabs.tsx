import { ArrowRight, Bell, Check, Plus, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computeNet, computeTransfers, fmt, stats } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { useTrips } from '@/lib/trips';
import { CATEGORIES, type Expense, type Member, type Trip } from '@/lib/types';
import { cn, initials, nowLocal, uid } from '@/lib/utils';

const nameOf = (trip: Trip, id: string) => trip.members.find((m) => m.id === id)?.name ?? '?';

const CAT_COLOR: Record<string, string> = {
  food: 'bg-orange-500',
  transport: 'bg-sky-500',
  stay: 'bg-violet-500',
  fun: 'bg-pink-500',
  shop: 'bg-amber-500',
  other: 'bg-slate-400',
};

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-14 text-center text-muted-foreground">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------- Chi tiêu
export function ExpensesTab({ trip, onOpen }: { trip: Trip; onOpen: (e: Expense) => void }) {
  const { t, lang } = useI18n();
  if (!trip.expenses.length) return <Empty>{t('noExpenses')}</Empty>;

  const sorted = [...trip.expenses].sort((a, b) => b.datetime.localeCompare(a.datetime));
  const groups: [string, Expense[]][] = [];
  for (const e of sorted) {
    const day = e.datetime.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last[0] === day) last[1].push(e);
    else groups.push([day, [e]]);
  }
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB';

  return (
    <div>
      {groups.map(([day, list]) => (
        <section key={day}>
          <SectionTitle>
            {new Date(day).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </SectionTitle>
          <Card className="divide-y overflow-hidden">
            {list.map((e) => (
              <button
                key={e.id}
                onClick={() => onOpen(e)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
                  {CATEGORIES[e.category]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {e.title}
                    {e.hasPhoto && ' 📎'}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.datetime.slice(11)} · {e.payers.map((p) => nameOf(trip, p.memberId)).join(', ')} {t('paidBy')}
                  </span>
                </span>
                <b className="shrink-0">{fmt(e.amount)}</b>
              </button>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Ai nợ ai
export function BalancesTab({ trip, canEdit, memberId }: { trip: Trip; canEdit: boolean; memberId?: string }) {
  const { t } = useI18n();
  const { saveTrip } = useTrips();
  const net = computeNet(trip);
  const moves = computeTransfers(trip);

  async function remind(i: number) {
    const x = moves[i];
    const text = t('remindText', trip.name, nameOf(trip, x.from), nameOf(trip, x.to), fmt(x.amount));
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* người dùng hủy */
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  }

  async function markPaid(i: number) {
    const x = moves[i];
    if (!x || (memberId ? memberId !== x.from : !canEdit)) return;
    await saveTrip(
      { ...trip, payments: [...trip.payments, { id: uid(), from: x.from, to: x.to, amount: x.amount, datetime: nowLocal() }] },
      t('logPay', nameOf(trip, x.from), nameOf(trip, x.to), fmt(x.amount))
    );
  }

  async function undo(id: string) {
    const p = trip.payments.find((q) => q.id === id);
    if (!p) return;
    await saveTrip(
      { ...trip, payments: trip.payments.filter((q) => q.id !== id) },
      t('logPayDel', nameOf(trip, p.from), nameOf(trip, p.to), fmt(p.amount))
    );
  }

  return (
    <div>
      {moves.length ? (
        <div className="mt-3 space-y-3">
          {moves.map((x, i) => (
            <Card key={`${x.from}-${x.to}`} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={nameOf(trip, x.from)} />
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <Avatar name={nameOf(trip, x.to)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    <b>{nameOf(trip, x.from)}</b> {t('owesTo')} <b>{nameOf(trip, x.to)}</b>
                  </div>
                  <div className="text-lg font-bold text-primary">{fmt(x.amount)}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => remind(i)}>
                  <Bell /> {t('remind')}
                </Button>
                {(memberId ? memberId === x.from : canEdit) && (
                  <Button size="sm" onClick={() => markPaid(i)}>
                    <Check /> {t('markPaid')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>{t('settledAll')}</Empty>
      )}

      <SectionTitle>{t('tabMem')}</SectionTitle>
      <Card className="divide-y overflow-hidden">
        {trip.members.map((m) => {
          const v = net[m.id] ?? 0;
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} />
              <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
              {v > 1 ? (
                <Badge tone="success">
                  {t('gets')} {fmt(v)}
                </Badge>
              ) : v < -1 ? (
                <Badge tone="danger">
                  {t('owes')} {fmt(-v)}
                </Badge>
              ) : (
                <Badge>{t('even')}</Badge>
              )}
            </div>
          );
        })}
      </Card>

      {trip.payments.length > 0 && (
        <>
          <SectionTitle>{t('payments')}</SectionTitle>
          <Card className="divide-y overflow-hidden">
            {[...trip.payments].reverse().map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    {nameOf(trip, p.from)} → {nameOf(trip, p.to)}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.datetime.replace('T', ' ')}</div>
                </div>
                <b>{fmt(p.amount)}</b>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => undo(p.id)}>
                    <Undo2 />
                  </Button>
                )}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Thống kê
export function StatsTab({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const s = stats(trip);
  if (!trip.expenses.length) return <Empty>{t('noExpenses')}</Empty>;

  const heads = trip.members.reduce((n, m) => n + m.people, 0) || 1;
  const catMax = Math.max(1, ...Object.values(s.byCat));
  const pMax = Math.max(1, ...Object.values(s.paid), ...Object.values(s.owed));

  return (
    <div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">{t('total')}</div>
          <div className="mt-1 text-xl font-bold">{fmt(s.total)}</div>
          <div className="text-xs text-muted-foreground">{t('expenses_n', trip.expenses.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">{t('spentPerPerson')}</div>
          <div className="mt-1 text-xl font-bold">{fmt(s.total / heads)}</div>
          <div className="text-xs text-muted-foreground">{t('people_n', heads)}</div>
        </Card>
      </div>

      <SectionTitle>{t('byCategory')}</SectionTitle>
      <Card className="space-y-4 p-4">
        {Object.entries(s.byCat)
          .sort((a, b) => b[1] - a[1])
          .map(([c, v]) => (
            <div key={c}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {CATEGORIES[c as keyof typeof CATEGORIES]} {t('cat_' + c)}
                </span>
                <b>{fmt(v)}</b>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full', CAT_COLOR[c] ?? 'bg-primary')} style={{ width: `${(v / catMax) * 100}%` }} />
              </div>
            </div>
          ))}
      </Card>

      <SectionTitle>{t('byPerson')}</SectionTitle>
      <Card className="space-y-5 p-4">
        {trip.members.map((m) => (
          <div key={m.id}>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <Avatar name={m.name} className="size-7 text-xs" />
              {m.name}
            </div>
            <Bar label={t('paid')} value={s.paid[m.id]} max={pMax} className="bg-primary" />
            <Bar label={t('owedShare')} value={s.owed[m.id]} max={pMax} className="bg-amber-500" />
          </div>
        ))}
      </Card>
    </div>
  );
}

function Bar({ label, value, max, className }: { label: string; value: number; max: number; className: string }) {
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{fmt(value)}</span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', className)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Lịch sử
export function HistoryTab({ trip }: { trip: Trip }) {
  const { t, lang } = useI18n();
  if (!trip.history.length) return <Empty>{t('noHistory')}</Empty>;
  return (
    <Card className="mt-3 divide-y overflow-hidden">
      {trip.history.map((h, i) => (
        <div key={i} className="px-4 py-3">
          <div className="text-sm">{h.text}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(h.ts).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB')}
          </div>
        </div>
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------- Thành viên
export function MembersTab({
  trip,
  canEdit,
  onAdd,
  onEdit,
  onDeleteTrip,
}: {
  trip: Trip;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (m: Member) => void;
  onDeleteTrip: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-3">
      <Card className="divide-y overflow-hidden">
        {trip.members.map((m) => (
          <button
            key={m.id}
            disabled={!canEdit}
            onClick={() => onEdit(m)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-muted/60"
          >
            <Avatar name={m.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{m.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {m.people} {t('persons')}
                {m.note ? ` · ${m.note}` : ''}
              </span>
            </span>
          </button>
        ))}
      </Card>
      {canEdit && (
        <div className="mt-4 space-y-3">
          <Button className="w-full" variant="secondary" onClick={onAdd}>
            <Plus /> {t('addMember')}
          </Button>
          <Button className="w-full" variant="destructive" onClick={onDeleteTrip}>
            <Trash2 /> {t('deleteTrip')}
          </Button>
        </div>
      )}
    </div>
  );
}
