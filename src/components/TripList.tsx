import { useState, type FormEvent } from 'react';
import { Languages, Moon, Plus, Sun, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CreateTripDialog } from '@/components/CreateTripDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fmt } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { useTrips } from '@/lib/trips';

export function TripList() {
  const { t, lang, setLang, theme, toggleTheme } = useI18n();
  const { trips, ready } = useTrips();
  const [creating, setCreating] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const list = Object.values(trips).sort((a, b) => b.createdAt - a.createdAt);

  function openSharedTrip(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    try {
      const url = new URL(sharedLink.trim(), location.href);
      const match = url.hash.match(/^#\/t\/([\w-]+)(?:\/([\w-]+))?$/);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !match) {
        toast.error(t('invalidTripLink'));
        return;
      }
      location.hash = `#/t/${match[1]}${match[2] ? `/${match[2]}` : ''}`;
    } catch {
      toast.error(t('invalidTripLink'));
    }
  }

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold">{t('app')}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            aria-label={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
            title={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
          >
            <Languages />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={t(theme === 'light' ? 'themeDark' : 'themeLight')}
            title={t(theme === 'light' ? 'themeDark' : 'themeLight')}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
          </Button>
        </div>
      </header>

      <form onSubmit={openSharedTrip} className="space-y-2 px-4 pb-4">
        <label htmlFor="shared-trip-link" className="text-sm font-medium">
          {t('pasteTripLink')}
        </label>
        <div className="flex gap-2">
          <Input
            id="shared-trip-link"
            value={sharedLink}
            onChange={(e) => setSharedLink(e.target.value)}
            placeholder={t('pasteTripLinkPlaceholder')}
            autoComplete="url"
          />
          <Button type="submit" disabled={!sharedLink.trim()}>
            {t('openTrip')}
          </Button>
        </div>
      </form>

      <main className="grid gap-4 px-4 sm:grid-cols-2">
        {ready && list.length === 0 && (
          <p className="col-span-full px-6 py-16 text-center text-muted-foreground">{t('noTrips')}</p>
        )}
        {list.map((tr) => {
          const total = tr.expenses.reduce((s, e) => s + e.amount, 0);
          return (
            <button
              key={tr.id}
              onClick={() => (location.hash = `#/t/${tr.id}`)}
              className="group relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 to-sky-500 text-left text-white shadow-sm transition-transform active:scale-[0.99]"
            >
              {tr.bg && (
                <img
                  src={tr.bg}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="truncate text-xl font-bold drop-shadow">{tr.name}</div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <Users className="size-4" /> {tr.members.length}
                  </span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </main>

      <Button
        size="lg"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 rounded-full px-5 shadow-lg"
        onClick={() => setCreating(true)}
      >
        <Plus /> {t('newTrip')}
      </Button>
      <CreateTripDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
