import { useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

const technologies = ['React', 'TypeScript', 'Tailwind CSS', 'Vite'];
const eggOffsets = [
  [0, 0],
  [36, -24],
  [-36, 24],
  [60, 38],
  [-60, -38],
  [0, 58],
  [0, -58],
  [68, 0],
  [-68, 0],
] as const;

export function AppFooter() {
  const { t } = useI18n();
  const nextEggRun = useRef(0);
  const [eggRuns, setEggRuns] = useState<number[]>([]);

  return (
    <footer className="mt-auto border-t bg-card/70">
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
        <button
          type="button"
          aria-label={t('footerEasterEgg')}
          onClick={() => {
            const run = nextEggRun.current++;
            setEggRuns((runs) => [...runs, run]);
          }}
          className="absolute right-6 top-4 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-8 sm:top-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2.5c-4.3 0-8 6.2-8 11.1a8 8 0 0 0 16 0c0-4.9-3.7-11.1-8-11.1Z" />
            <path d="M5 9.5c1.2.8 2.3.8 3.5 0s2.3-.8 3.5 0 2.3.8 3.5 0 2.3-.8 3.5 0" />
            <path d="M4.4 14.5c1.2-.8 2.4-.8 3.6 0s2.4.8 3.6 0 2.4-.8 3.6 0 2.4.8 4.4 0" />
            <circle cx="9" cy="6.5" r=".65" fill="currentColor" stroke="none" />
            <circle cx="15" cy="18" r=".65" fill="currentColor" stroke="none" />
          </svg>
        </button>
        {eggRuns.length > 0 && (
          <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
            {eggRuns.map((run) => {
              const [offsetX, offsetY] = eggOffsets[run % eggOffsets.length];
              return (
                <div
                  key={run}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${offsetX}px)`,
                    top: `calc(50% + ${offsetY}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <img
                    src="/easter-egg.png"
                    alt="Siêu Bá Khí"
                    className="egg-image-reveal max-h-[80dvh] max-w-[calc(100vw-2rem)] rounded-xl object-contain shadow-2xl"
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget) {
                        setEggRuns((runs) => runs.filter((activeRun) => activeRun !== run));
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold">{t('footerLinks')}</h2>
            <a
              href="#/"
              className="mt-3 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('footerHome')}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t('footerBuiltWith')}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {technologies.map((technology) => (
                <li
                  key={technology}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {technology}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-5 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('app')}. {t('footerRights')}
        </div>
      </div>
    </footer>
  );
}
