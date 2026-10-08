import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

const technologies = ['React', 'TypeScript', 'Tailwind CSS', 'Vite'];
const eggImages = [
  { src: '/easter-egg.png', alt: 'Siêu Bá Khí', className: 'max-h-[80dvh] max-w-[calc(100vw-2rem)]' },
  { src: '/easter-egg-story.png', alt: 'Easter egg story', className: 'max-h-[72dvh] max-w-[38vw]' },
  { src: '/easter-egg-night.png', alt: 'Night trip photo', className: 'max-h-[80dvh] max-w-[54vw]' },
  { src: '/easter-egg-food.png', alt: 'Food trip photo', className: 'max-h-[80dvh] max-w-[54vw]' },
];

interface EggRun {
  id: number;
  image: {
    src: string;
    alt: string;
    left: number;
    top: number;
    className: string;
  };
}

export function AppFooter() {
  const { t } = useI18n();
  const nextEggRun = useRef(0);
  const eggImageOrder = useRef<number[]>([]);
  const lastEggImage = useRef<number | null>(null);
  const activeSounds = useRef(new Set<HTMLAudioElement>());
  const [eggRuns, setEggRuns] = useState<EggRun[]>([]);

  useEffect(
    () => () => {
      activeSounds.current.forEach((sound) => sound.pause());
      activeSounds.current.clear();
    },
    []
  );

  function playEggSound() {
    const sound = new Audio('/boom.mp3');
    activeSounds.current.add(sound);
    sound.onended = () => activeSounds.current.delete(sound);
    void sound.play().catch((error: unknown) => {
      console.error('Unable to play the easter egg sound.', error);
      activeSounds.current.delete(sound);
    });
  }

  return (
    <footer className="mt-auto border-t bg-card/70">
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
        <button
          type="button"
          aria-label={t('footerEasterEgg')}
          onClick={() => {
            playEggSound();
            const id = nextEggRun.current++;
            if (!eggImageOrder.current.length) {
              eggImageOrder.current = eggImages.map((_, index) => index);
              for (let i = eggImageOrder.current.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [eggImageOrder.current[i], eggImageOrder.current[j]] = [
                  eggImageOrder.current[j],
                  eggImageOrder.current[i],
                ];
              }
              if (eggImageOrder.current[0] === lastEggImage.current) {
                [eggImageOrder.current[0], eggImageOrder.current[1]] = [
                  eggImageOrder.current[1],
                  eggImageOrder.current[0],
                ];
              }
            }
            const imageIndex = eggImageOrder.current.shift();
            if (imageIndex === undefined) return;
            lastEggImage.current = imageIndex;
            const image = eggImages[imageIndex];
            const run: EggRun = {
              id,
              image: {
                ...image,
                left: 25 + Math.random() * 50,
                top: 20 + Math.random() * 60,
              },
            };
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
            {eggRuns.map(({ id, image }) => (
              <div
                key={id}
                className="absolute"
                style={{
                  left: `${image.left}%`,
                  top: `${image.top}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className={`egg-image-reveal ${image.className} rounded-xl object-contain shadow-2xl`}
                  onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget) {
                      setEggRuns((runs) => runs.filter((run) => run.id !== id));
                    }
                  }}
                />
              </div>
            ))}
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
