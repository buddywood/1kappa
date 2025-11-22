import Header from '../components/Header';
import Footer from '../components/Footer';
import { SUPPORT_EMAIL } from '@/lib/constants';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-black flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-black rounded-lg shadow-lg dark:shadow-black/50 border border-frost-gray dark:border-gray-900 p-8 md:p-12">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-6">
            Support & Help Center
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-midnight-navy/80 dark:text-gray-300 mb-8 text-lg">
              We're here to help! If you have questions, need assistance, or want to report an issue, 
              please reach out to us through one of the following channels.
            </p>

            <div className="space-y-8">
              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                  Contact Us
                </h2>
                <div className="bg-cream/50 dark:bg-gray-900/50 rounded-lg p-6 border border-frost-gray dark:border-gray-800">
                  <p className="text-midnight-navy dark:text-gray-200 mb-4">
                    <strong className="text-crimson dark:text-crimson">Email:</strong>{' '}
                    <a 
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                  <p className="text-midnight-navy/70 dark:text-gray-400 text-sm">
                    We typically respond within 24-48 hours during business days.
                  </p>
                </div>
              </section>

              {/* Common Questions */}
              <section>
                <h2 className="text-2xl font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-crimson pl-4">
                    <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      How do I verify my membership?
                    </h3>
                    <p className="text-midnight-navy/80 dark:text-gray-300">
                      Complete your member profile with your full legal name, initiation chapter, initiation year, 
                      and member number. Upload a headshot and provide at least one social link for verification. 
                      Our team will review your submission and verify your membership.
                    </p>
                  </div>

                  <div className="border-l-4 border-crimson pl-4">
                    <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      How do I become a Seller, Promoter, or Steward?
                    </h3>
                    <p className="text-midnight-navy/80 dark:text-gray-300">
                      Once your membership is verified, you can apply for additional roles through your member dashboard. 
                      Each role has specific requirements and benefits. Visit your dashboard to learn more and start the application process.
                    </p>
                  </div>

                  <div className="border-l-4 border-crimson pl-4">
                    <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      How do I report an issue with an order?
                    </h3>
                    <p className="text-midnight-navy/80 dark:text-gray-300">
                      If you experience any issues with a purchase, please contact us at {SUPPORT_EMAIL} with your order details. 
                      Include your order number, product information, and a description of the issue. We'll work to resolve it promptly.
                    </p>
                  </div>

                  <div className="border-l-4 border-crimson pl-4">
                    <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      How do I update my profile information?
                    </h3>
                    <p className="text-midnight-navy/80 dark:text-gray-300">
                      You can update your profile information at any time through your profile settings page. 
                      Note that changes to membership verification information may require re-verification.
                    </p>
                  </div>

                  <div className="border-l-4 border-crimson pl-4">
                    <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      How do chapter donations work?
                    </h3>
                    <p className="text-midnight-navy/80 dark:text-gray-300">
                      When you purchase items from Sellers or claim Steward listings, a portion of the proceeds 
                      goes directly to the sponsoring undergraduate chapter. This supports scholarships, leadership 
                      programs, and service initiatives.
                    </p>
                  </div>
                </div>
              </section>

              {/* Additional Resources */}
              <section>
                <h2 className="text-2xl font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                  Additional Resources
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <a 
                    href="/terms"
                    className="block p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800 hover:border-crimson dark:hover:border-crimson transition-colors"
                  >
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      Terms & Conditions
                    </h3>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                      Review our terms of service and platform policies
                    </p>
                  </a>
                  <a 
                    href="/privacy"
                    className="block p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800 hover:border-crimson dark:hover:border-crimson transition-colors"
                  >
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-200 mb-2">
                      Privacy Policy
                    </h3>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                      Learn how we protect and handle your data
                    </p>
                  </a>
                </div>
              </section>

              {/* Note */}
              <div className="bg-aurora-gold/10 dark:bg-aurora-gold/20 border border-aurora-gold/30 dark:border-aurora-gold/40 rounded-lg p-6">
                <p className="text-midnight-navy dark:text-gray-200 text-sm">
                  <strong>Note:</strong> This website is not affiliated with or endorsed by Kappa Alpha Psi Fraternity, Inc. 
                  For official fraternity information, please visit the{' '}
                  <a 
                    href="https://www.kappaalphapsi1911.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-crimson hover:text-aurora-gold dark:hover:text-crimson/80 hover:underline transition"
                  >
                    Kappa Alpha Psi Fraternity, Inc. official website
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

