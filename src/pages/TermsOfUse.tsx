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
              By accessing and using AfuChat ("the Service," "Platform," "we," "our," or "us"), you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, you must not access or use the Service. These terms constitute a legally binding agreement between you and AfuChat.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              By creating an account or using our Service, you confirm that you are at least 13 years old and have the legal capacity to enter into this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat is a comprehensive social networking and communication platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Create and share posts, images, and multimedia content</li>
              <li>Engage in real-time messaging and group chats</li>
              <li>Connect with other users through following and social features</li>
              <li>Access AI-powered features for content generation and assistance</li>
              <li>Participate in gamification features including achievements and rewards</li>
              <li>Transfer virtual currency (Nexa) and send gifts to other users</li>
              <li>Access mini-programs and third-party integrations</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              We reserve the right to modify, suspend, or discontinue any feature of the Service at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security and confidentiality of your password</li>
              <li>Accept full responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Not create multiple accounts to circumvent bans or restrictions</li>
              <li>Not impersonate others or create fake accounts</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              We reserve the right to refuse registration or cancel accounts at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Your Content</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You retain ownership of all content you create, post, or upload on AfuChat ("Your Content"). However, by posting Your Content, you grant AfuChat a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute Your Content in any and all media or distribution methods (now known or later developed).
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Content Responsibility</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You are solely responsible for Your Content. You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>You own or have the necessary rights to Your Content</li>
              <li>Your Content does not violate any third-party rights</li>
              <li>Your Content complies with these Terms and all applicable laws</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Prohibited Content</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree not to post content that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or hateful</li>
              <li>Infringes intellectual property, privacy, or other rights</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Impersonates others or misrepresents affiliations</li>
              <li>Contains spam, unsolicited promotions, or commercial content</li>
              <li>Depicts or promotes violence, self-harm, or illegal activities</li>
              <li>Contains sexually explicit or inappropriate content involving minors</li>
              <li>Violates export control or sanctions regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. AI-Generated Content</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat uses artificial intelligence to generate content, provide suggestions, and enhance user interactions. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>AI-generated content is provided "as is" without warranties</li>
              <li>AI may produce inaccurate, incomplete, or inappropriate content</li>
              <li>You are responsible for reviewing and verifying AI content before use</li>
              <li>You must not misrepresent AI-generated content as human-created</li>
              <li>Your inputs to AI features may be used to improve our services</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              We implement safeguards to prevent harmful AI outputs but cannot guarantee complete accuracy or safety.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Virtual Currency and Transactions</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat includes virtual currency (XP) and digital items (gifts, shop items). You understand that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Virtual items have no real-world monetary value</li>
              <li>Virtual currency and items are non-refundable</li>
              <li>We may adjust pricing, availability, or features at any time</li>
              <li>Virtual items cannot be exchanged for real currency</li>
              <li>Account termination may result in loss of virtual items</li>
              <li>Transferring XP or items is subject to platform rules and limits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Conduct</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Use the Service for any illegal purpose or violation of laws</li>
              <li>Attempt to gain unauthorized access to systems or accounts</li>
              <li>Interfere with, disrupt, or damage the Service or servers</li>
              <li>Use automated systems, bots, or scrapers without permission</li>
              <li>Harvest or collect user information without consent</li>
              <li>Create accounts to evade bans or restrictions</li>
              <li>Manipulate engagement metrics or game systems</li>
              <li>Sell, trade, or transfer accounts</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Engage in fraudulent activities or scams</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Content Moderation</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right, but not the obligation, to monitor, review, and remove any content that violates these Terms or is otherwise objectionable. We may use automated systems and human moderators for content moderation. Content removal decisions are made at our sole discretion.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You may report content that violates these Terms through the reporting features in the application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Account Termination and Suspension</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Violating these Terms or our policies</li>
              <li>Engaging in fraudulent or illegal activities</li>
              <li>Repeated violations or warnings</li>
              <li>Request by law enforcement or legal orders</li>
              <li>Extended inactivity (at our discretion)</li>
              <li>Any other reason we deem appropriate</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Upon termination, you will lose access to your account and all associated content and virtual items. You may also delete your account at any time through account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services and Links</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The Service may contain links to third-party websites, services, or mini-programs. We are not responsible for the content, privacy practices, or terms of third-party services. Your use of third-party services is at your own risk and subject to their terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>Results obtained from use will be accurate or reliable</li>
              <li>Defects will be corrected</li>
              <li>Content or communications will not be lost</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AFUCHAT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Your use or inability to use the Service</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Conduct or content of third parties on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Loss of virtual currency or items</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Our total liability shall not exceed the amount you paid us in the past twelve months, or $100, whichever is greater.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Indemnification</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless AfuChat, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your Content or use of the Service</li>
              <li>Your breach of representations or warranties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Dispute Resolution and Governing Law</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree to first contact us to attempt to resolve any disputes informally before initiating formal proceedings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Posting the updated Terms on the Service</li>
              <li>Updating the "Last Updated" date</li>
              <li>Providing in-app notifications for significant changes</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Miscellaneous</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>Waiver:</strong> Our failure to enforce any right or provision shall not be deemed a waiver of such right or provision.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and AfuChat regarding the Service.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign these Terms at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Support & Contact Information</h2>
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
