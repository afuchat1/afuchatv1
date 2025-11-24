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
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.infoCollected.automatic')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.infoCollected.thirdParty')}</h3>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.usage.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.provision')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.improvement')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.safety')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.communications')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.usage.legal')}</h3>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.ai.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.ai.features')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.ai.processing')}</h3>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.sharing.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>{t('privacy.sharing.noSell')}</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.security.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.security.technical')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.security.organizational')}</h3>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.rights.title')}</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.access')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.correction')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.deletion')}</h3>
            <h3 className="text-xl font-semibold mb-3 mt-6">{t('privacy.rights.control')}</h3>
          </section>

          <section className="mb-8">
            <p className="text-foreground/90 leading-relaxed">
              {t('privacy.contact')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Account Information:</strong> Email address, username, password (encrypted), display name</li>
              <li><strong>Profile Information:</strong> Bio, profile picture, banner image, website URL, preferences</li>
              <li><strong>Content:</strong> Posts, comments, replies, messages, images, videos, and other media you share</li>
              <li><strong>Communications:</strong> Messages you send to other users, support requests, feedback</li>
              <li><strong>Payment Information:</strong> Information related to virtual currency purchases (processed by third-party payment providers)</li>
              <li><strong>Identity Verification:</strong> Documents for verification requests (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Device Information:</strong> IP address, device type, operating system, browser type and version, unique device identifiers</li>
              <li><strong>Usage Data:</strong> Pages viewed, features accessed, time spent, interaction patterns, search queries</li>
              <li><strong>Location Information:</strong> Approximate location based on IP address (precise location only if you enable it)</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, preference cookies, analytics cookies</li>
              <li><strong>Performance Data:</strong> Error logs, crash reports, loading times, technical diagnostics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Social Sign-In:</strong> Profile information from Google, GitHub, or other OAuth providers</li>
              <li><strong>Analytics Providers:</strong> Aggregated usage statistics and trends</li>
              <li><strong>Payment Processors:</strong> Transaction confirmations and payment status</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Create, maintain, and authenticate your account</li>
              <li>Enable social features and interactions</li>
              <li>Process and deliver your content and communications</li>
              <li>Facilitate virtual currency transactions and gift sending</li>
              <li>Provide personalized recommendations and content</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Service Improvement</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Analyze usage patterns to improve features and user experience</li>
              <li>Develop new features and services</li>
              <li>Conduct research and analytics</li>
              <li>Test and optimize service performance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Safety and Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Detect, prevent, and address fraud, abuse, and security threats</li>
              <li>Enforce our Terms of Use and policies</li>
              <li>Moderate content and protect community safety</li>
              <li>Verify user identity when necessary</li>
              <li>Respond to legal requests and prevent illegal activities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Communications</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Send service updates, technical notices, and security alerts</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Notify you of account activity and interactions</li>
              <li>Send promotional communications (with your consent)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.5 Legal Compliance</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Comply with legal obligations and regulations</li>
              <li>Respond to lawful requests from authorities</li>
              <li>Establish, exercise, or defend legal claims</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. AI and Machine Learning</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat uses artificial intelligence and machine learning technologies to enhance your experience:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 AI Features</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Content Generation:</strong> AI-powered post creation and assistance</li>
              <li><strong>Recommendations:</strong> Personalized content and user suggestions</li>
              <li><strong>Content Moderation:</strong> Automated detection of policy violations</li>
              <li><strong>Spam Detection:</strong> Identification and filtering of spam and abuse</li>
              <li><strong>Image Analysis:</strong> Automated tagging and description of images</li>
              <li><strong>Translation:</strong> Multilingual content translation</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 AI Data Processing</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Your content may be processed by AI systems to provide these features. We implement technical and organizational measures to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Minimize data collection and processing</li>
              <li>Protect privacy during AI processing</li>
              <li>Prevent unauthorized access to training data</li>
              <li>Allow you to opt-out of certain AI features</li>
              <li>Ensure AI decisions are explainable and fair</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              <strong>We do not sell your personal information.</strong> We may share your information in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 With Your Consent</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When you direct us to share information with third parties or make content public
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Public Content</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Content you post publicly (posts, comments, profile information) is visible to other users and may be indexed by search engines
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Service Providers</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We share information with trusted service providers who assist us in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Cloud hosting and infrastructure (Supabase)</li>
              <li>Content delivery networks</li>
              <li>Analytics and monitoring</li>
              <li>Customer support tools</li>
              <li>Email delivery services</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              These providers are contractually obligated to protect your information and use it only for authorized purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.4 Legal Requirements</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may disclose information when required by law or to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Comply with legal obligations, court orders, or government requests</li>
              <li>Protect our rights, property, or safety</li>
              <li>Protect the rights and safety of users or the public</li>
              <li>Detect, prevent, or address fraud and security issues</li>
              <li>Enforce our Terms of Use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.5 Business Transfers</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred. We will notify you of such changes and any choices you may have.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.6 Aggregated and Anonymized Data</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may share aggregated, anonymized data that cannot identify you for research, analytics, or marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We implement comprehensive security measures to protect your information:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Technical Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Encryption:</strong> TLS/SSL encryption for data in transit, AES encryption for data at rest</li>
              <li><strong>Authentication:</strong> Secure password hashing (bcrypt), multi-factor authentication support</li>
              <li><strong>Access Controls:</strong> Role-based access controls, least privilege principle</li>
              <li><strong>Infrastructure:</strong> Secure cloud hosting with regular security updates</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Organizational Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection and privacy</li>
              <li>Incident response and breach notification procedures</li>
              <li>Data minimization and retention policies</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Your Responsibility</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              While we implement strong security measures, you must also:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Use a strong, unique password</li>
              <li>Keep your credentials confidential</li>
              <li>Enable two-factor authentication if available</li>
              <li>Log out from shared devices</li>
              <li>Report suspicious activity immediately</li>
            </ul>

            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              <strong>Note:</strong> No security system is impenetrable. We cannot guarantee absolute security, but we continuously work to protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Depending on your location and applicable laws, you have the following rights:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Access and Portability</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Request a copy of your personal information</li>
              <li>Download your data in a portable format</li>
              <li>Access information about how we process your data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Correction and Update</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Update your profile and account information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Manage privacy settings and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Deletion</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Request deletion of your account and data</li>
              <li>Delete individual posts and content</li>
              <li>Right to be forgotten (where applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.4 Control and Restrictions</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Object to certain processing activities</li>
              <li>Restrict processing of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Control cookie preferences</li>
              <li>Disable certain AI features</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.5 Withdraw Consent</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Where processing is based on consent, you may withdraw consent at any time. This will not affect the lawfulness of processing before withdrawal.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.6 Lodge a Complaint</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You have the right to lodge a complaint with your local data protection authority if you believe we have violated your privacy rights.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.7 How to Exercise Your Rights</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To exercise these rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Use account settings for profile updates and privacy controls</li>
              <li>Contact support@afuchat.com for data requests</li>
              <li>Include "Privacy Request" in your email subject</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              We will respond to verified requests within 30 days as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Provide and maintain the Service</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Prevent fraud and abuse</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.1 Retention Periods</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Active Accounts:</strong> Data retained while account is active</li>
              <li><strong>Deleted Accounts:</strong> Most data deleted within 30-90 days</li>
              <li><strong>Backup Systems:</strong> Data may persist in backups for up to 180 days</li>
              <li><strong>Legal Holds:</strong> Data retained longer when required by law</li>
              <li><strong>Public Content:</strong> May be cached or preserved by third parties</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">8.2 Exceptions</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may retain certain information longer when:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Required by law or legal proceedings</li>
              <li>Necessary for security or fraud prevention</li>
              <li>Aggregated and anonymized for analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              AfuChat is not intended for children under 13 years of age (or 16 in some jurisdictions). We do not knowingly collect personal information from children under these ages.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If we become aware that we have collected information from a child under the minimum age:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>We will take steps to delete such information immediately</li>
              <li>We will terminate the account</li>
              <li>Parents/guardians may contact us to request deletion</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Standard contractual clauses approved by authorities</li>
              <li>Data processing agreements with service providers</li>
              <li>Compliance with cross-border data transfer regulations</li>
              <li>Use of services certified under privacy frameworks</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              By using AfuChat, you consent to the transfer of your information as described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Cookies and Tracking Technologies</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">11.1 Types of Cookies</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
              <li><strong>Performance Cookies:</strong> Monitor and improve service performance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">11.2 Managing Cookies</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You can control cookies through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Browser settings to block or delete cookies</li>
              <li>Account settings for cookie preferences</li>
              <li>Opt-out tools provided by analytics services</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              <strong>Note:</strong> Blocking essential cookies may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. California Privacy Rights (CCPA)</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Know what personal information is collected, used, shared, or sold</li>
              <li>Delete personal information held by us</li>
              <li>Opt-out of the sale of personal information (we do not sell)</li>
              <li>Non-discrimination for exercising your CCPA rights</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              To exercise these rights, contact us at support@afuchat.com with "CCPA Request" in the subject line.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. European Privacy Rights (GDPR)</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              If you are in the European Economic Area (EEA), UK, or Switzerland, you have rights under the General Data Protection Regulation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Legal basis for processing (consent, contract, legitimate interests, legal obligation)</li>
              <li>Right to lodge complaints with supervisory authorities</li>
              <li>Data protection impact assessments for high-risk processing</li>
              <li>Automated decision-making and profiling safeguards</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Our EU representative can be contacted at support@afuchat.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Our data practices</li>
              <li>Legal requirements</li>
              <li>Service features and functionality</li>
              <li>Industry best practices</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">14.1 Notification of Changes</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li>Posting the updated Privacy Policy on our Service</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
              <li>Providing in-app notifications for significant changes</li>
              <li>Sending email notifications (for major changes)</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4 mt-4">
              Your continued use of the Service after changes are posted constitutes acceptance of the updated Privacy Policy. If you do not agree to the changes, you must stop using the Service and may request account deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Support & Contact Us</h2>
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
                  <span className="font-medium">Privacy Requests:</span>{' '}
                  Include "Privacy Request" in your email subject line
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
                  <strong>Response Time:</strong> We will respond to all privacy requests within 30 days as required by applicable data protection laws. For CCPA requests, we aim to respond within 45 days. For urgent security or privacy concerns, please mark your email as "Urgent."
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
