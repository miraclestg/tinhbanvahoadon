import { useI18n } from '@/lib/i18n';

const technologies = ['React', 'TypeScript', 'Tailwind CSS', 'Vite'];

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t bg-card/70">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
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
