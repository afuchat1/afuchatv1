import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { useTranslation } from 'react-i18next';

const TermsOfUse = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('terms.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('terms.lastUpdated')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.acceptance.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.acceptance.intro')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.acceptance.ageRequirement')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.service.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.service.intro')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.service.serviceDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.accounts.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.accounts.requirements')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.accounts.accountDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.content.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.content.ownership')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.content.license')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('terms.content.prohibited')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.content.prohibitedDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.aiContent.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.aiContent.disclaimer')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.aiContent.aiDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.virtualCurrency.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.virtualCurrency.noRealValue')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.virtualCurrency.currencyDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.conduct.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.conduct.intro')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.moderation.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.moderation.rights')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.moderation.moderationDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.termination.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.termination.rights')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.termination.terminationDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.disclaimer.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.disclaimer.asIs')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.disclaimer.disclaimerDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.liability.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.liability.limited')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('terms.liability.liabilityDesc')}
            </p>
          </section>

          <section className="mb-8">
            <p className="text-foreground/90 leading-relaxed">
              {t('terms.contact')}
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default TermsOfUse;
