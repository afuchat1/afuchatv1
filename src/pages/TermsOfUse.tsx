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
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              By accessing and using AfuChat ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat is a social networking platform that allows users to post content, engage in conversations, and connect with others. The Service includes AI-powered features that may assist in content generation and interaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You retain ownership of content you post on AfuChat. However, by posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You are solely responsible for your content and agree not to post content that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Is illegal, harmful, threatening, abusive, or hateful</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains malware or harmful code</li>
              <li>Impersonates others or misrepresents your affiliation</li>
              <li>Violates privacy rights of others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. AI-Generated Content</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat may use artificial intelligence to generate content or assist in interactions. AI-generated content is provided "as is" and may not always be accurate or appropriate. You are responsible for reviewing and verifying any AI-generated content before sharing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Conduct</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Create multiple accounts to evade restrictions</li>
              <li>Collect user information without consent</li>
              <li>Use automated systems (bots) without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for violating these Terms or for any other reason at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The Service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To the maximum extent permitted by law, AfuChat shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the new Terms on the Service. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Support & Contact Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you have questions, concerns, or need assistance regarding these Terms of Use, our support team is here to help.
            </p>
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Contact Support</h3>
              <div className="space-y-3">
                <p className="text-foreground/90">
                  <span className="font-medium">Email:</span>{' '}
                  <a 
                    href="mailto:support@afuchat.com" 
                    className="text-primary hover:underline"
                  >
                    support@afuchat.com
                  </a>
                </p>
                <p className="text-foreground/90">
                  <span className="font-medium">Support Center:</span>{' '}
                  <a 
                    href="/support" 
                    className="text-primary hover:underline"
                  >
                    Visit our Support Center
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Our support team typically responds within 24-48 hours. For urgent matters, please mark your email as "Urgent" in the subject line.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
};

export default TermsOfUse;
