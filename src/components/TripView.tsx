import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, History, ImageIcon, Languages, Moon, PieChart, Plus, Receipt, Scale, Share2, Sun, Users } from 'lucide-react';
import { BgCropper } from '@/components/BgCropper';
import { ExpenseDetail } from '@/components/ExpenseDetail';
import { ExpenseDialog } from '@/components/ExpenseDialog';
import { MemberDialog } from '@/components/MemberDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { BalancesTab, ExpensesTab, HistoryTab, MembersTab, StatsTab } from '@/components/TripTabs';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fmt } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { useTrips } from '@/lib/trips';
import type { Expense, Member } from '@/lib/types';

export function TripView({ id, editKey }: { id: string; editKey?: string }) {
  const { t, lang, setLang, theme, toggleTheme } = useI18n();
  const { trips, editable, keys, ready, openTrip, saveTrip, removeTrip } = useTrips();
  const trip = trips[id];
  const canEdit = !!editable[id];

  const [tab, setTab] = useState('expenses');
  const [expenseDlg, setExpenseDlg] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
  const [detail, setDetail] = useState<Expense | null>(null);
  const [memberDlg, setMemberDlg] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [shareOpen, setShareOpen] = useState(false);
  const [crop, setCrop] = useState<{ open: boolean; src: string | null }>({ open: false, src: null });
  const fileRef = useRef<HTMLInputElement>(null);
  const objUrl = useRef<string | null>(null);

  useEffect(() => {
    if (ready) openTrip(id, editKey);
  }, [ready, id, editKey, openTrip]);

  useEffect(
    () => () => {
      if (objUrl.current) URL.revokeObjectURL(objUrl.current);
    },
    []
  );

  // chuyến đi mở bằng link lần đầu cần chút thời gian để tải từ Firebase
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(h);
  }, []);

  if (!ready) return null;

  if (!trip && !waited) {
    return <div className="flex min-h-dvh items-center justify-center text-muted-foreground">…</div>;
  }

  if (!trip) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => (location.hash = '#/')}>
          <ArrowLeft /> {t('back')}
        </Button>
        <p className="px-6 py-16 text-center text-muted-foreground">{t('notFound')}</p>
      </div>
    );
  }

  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);

  function onPickFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    if (objUrl.current) URL.revokeObjectURL(objUrl.current);
    objUrl.current = URL.createObjectURL(f);
    setCrop({ open: true, src: objUrl.current });
  }

  const onBgClick = () => {
    if (trip.bg) setCrop({ open: true, src: trip.bg });
    else fileRef.current?.click();
  };

  const onDeleteTrip = async () => {
    if (!confirm(t('confirmDel'))) return;
    await removeTrip(id);
    location.hash = '#/';
  };

  return (
    <div className="pb-28">
      {/* Ảnh bìa: khung 16:9 trùng với khung căn chỉnh */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-emerald-400 to-sky-500 sm:rounded-b-3xl">
        {trip.bg && <img src={trip.bg} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
          <div className="flex items-center justify-between">
            <Button variant="glass" size="icon" onClick={() => (location.hash = '#/')} aria-label={t('back')}>
              <ArrowLeft />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="glass"
                size="icon"
                onClick={toggleTheme}
                aria-label={t(theme === 'light' ? 'themeDark' : 'themeLight')}
                title={t(theme === 'light' ? 'themeDark' : 'themeLight')}
              >
                {theme === 'light' ? <Moon /> : <Sun />}
              </Button>
              <Button
                variant="glass"
                size="icon"
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                aria-label={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
                title={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
              >
                <Languages />
              </Button>
              <Button variant="glass" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 /> {t('share')}
              </Button>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold drop-shadow">{trip.name}</h1>
              <p className="text-sm text-white/90">
                {t('total')}: <b>{fmt(total)}</b>
                {!canEdit && ` · ${t('readOnly')}`}
              </p>
            </div>
            {canEdit && (
              <Button variant="glass" size="sm" className="shrink-0" onClick={onBgClick}>
                <ImageIcon /> {t('adjustBg')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="sticky top-0 z-30">
          <TabsTrigger value="expenses">
            <Receipt />
            {t('tabExp')}
          </TabsTrigger>
          <TabsTrigger value="balances">
            <Scale />
            {t('tabBal')}
          </TabsTrigger>
          <TabsTrigger value="stats">
            <PieChart />
            {t('tabStats')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History />
            {t('tabHist')}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users />
            {t('tabMem')}
          </TabsTrigger>
        </TabsList>

        <div className="px-3.5">
          <TabsContent value="expenses">
            <ExpensesTab trip={trip} onOpen={setDetail} />
          </TabsContent>
          <TabsContent value="balances">
            <BalancesTab trip={trip} canEdit={canEdit} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab trip={trip} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab trip={trip} />
          </TabsContent>
          <TabsContent value="members">
            <MembersTab
              trip={trip}
              canEdit={canEdit}
              onAdd={() => setMemberDlg({ open: true, member: null })}
              onEdit={(m) => setMemberDlg({ open: true, member: m })}
              onDeleteTrip={onDeleteTrip}
            />
          </TabsContent>
        </div>
      </Tabs>

      {canEdit && tab === 'expenses' && (
        <Button
          size="lg"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 rounded-full px-5 shadow-lg"
          onClick={() => (trip.members.length ? setExpenseDlg({ open: true, expense: null }) : setTab('members'))}
        >
          <Plus /> {t('addExpense')}
        </Button>
      )}

      <ExpenseDialog
        trip={trip}
        expense={expenseDlg.expense}
        open={expenseDlg.open}
        onOpenChange={(o) => setExpenseDlg((s) => ({ ...s, open: o }))}
      />
      <ExpenseDetail
        trip={trip}
        expense={detail}
        canEdit={canEdit}
        onClose={() => setDetail(null)}
        onEdit={(e) => {
          setDetail(null);
          setExpenseDlg({ open: true, expense: e });
        }}
      />
      <MemberDialog
        trip={trip}
        member={memberDlg.member}
        open={memberDlg.open}
        onOpenChange={(o) => setMemberDlg((s) => ({ ...s, open: o }))}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        tripId={trip.id}
        tripName={trip.name}
        editKey={canEdit ? keys[trip.id] : undefined}
      />
      <BgCropper
        src={crop.src}
        open={crop.open}
        onOpenChange={(o) => setCrop((c) => ({ ...c, open: o }))}
        onDone={(dataUrl) => saveTrip({ ...trip, bg: dataUrl }, t('logBg'))}
        onPickOther={() => fileRef.current?.click()}
      />
    </div>
  );
}
