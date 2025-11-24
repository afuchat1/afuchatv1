import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('privacy.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('privacy.lastUpdated')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.intro.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.intro.welcome')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.intro.agreement')}
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.intro.compliance')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.infoCollected.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.infoCollected.direct')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.infoCollected.directDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.infoCollected.automatic')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.infoCollected.automaticDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.infoCollected.thirdParty')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.infoCollected.thirdPartyDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.usage.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.provision')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.usage.provisionDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.improvement')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.usage.improvementDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.safety')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.usage.safetyDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.communications')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.usage.communicationsDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.legal')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.usage.legalDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.ai.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.ai.features')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.ai.featuresDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.ai.processing')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.ai.processingDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.sharing.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>{t('privacy.sharing.noSell')}</strong>
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.sharing.shareDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.security.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.security.securityIntro')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.security.technical')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.security.technicalDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.security.organizational')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.security.organizationalDesc')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.rights.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.rights.rightsIntro')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.access')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.rights.accessDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.correction')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.rights.correctionDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.deletion')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.rights.deletionDesc')}
            </p>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.control')}</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('privacy.rights.controlDesc')}
            </p>
          </section>

          <section className="mb-8">
            <p className="text-foreground/90 leading-relaxed">
              {t('privacy.contact')}
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
