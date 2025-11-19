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
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social networking platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Account information (email, username, password)</li>
              <li>Profile information (display name, bio, profile picture)</li>
              <li>Content you post (messages, posts, comments)</li>
              <li>Communications with other users and with us</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages viewed, features used, time spent)</li>
              <li>Location information (if you enable location services)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Provide, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Process and deliver your content</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Analyze usage patterns and trends</li>
              <li>Personalize your experience with AI-powered features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. AI and Machine Learning</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat uses artificial intelligence and machine learning technologies to enhance your experience. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Content recommendations and personalization</li>
              <li>AI-powered chat features and responses</li>
              <li>Automated content moderation</li>
              <li>Spam and abuse detection</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Your content may be processed by AI systems to provide these features. We implement safeguards to protect your privacy during AI processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>With your consent:</strong> When you direct us to share information</li>
              <li><strong>Public content:</strong> Content you post publicly is visible to other users</li>
              <li><strong>Service providers:</strong> With vendors who help us operate the Service</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Monitoring for unauthorized access</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent for data processing</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              To exercise these rights, please contact us through the application settings or support page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Support & Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy, our data practices, or wish to exercise your privacy rights, please contact our dedicated support team.
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
                  For privacy-related inquiries, please include "Privacy Request" in your email subject line. We will respond to all requests within 30 days as required by applicable data protection laws.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
