import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | UPCAT Filipino Adaptive Reviewer",
  description:
    "Terms of Service for the UPCAT Filipino Adaptive Reviewer (Google OAuth branding verification).",
};

export default function TermsOfServicePage() {
  const lastUpdated = "February 25, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link
            href="/"
            className="text-blue-700 hover:text-blue-800 font-semibold text-sm"
          >
            ← Back to Home
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-gray-700 hover:text-gray-900 font-semibold text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-900 font-semibold text-sm"
            >
              Go to Login
            </Link>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8 sm:p-10 border-b border-gray-200">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Terms of Service
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              These Terms of Service (“Terms”) govern your use of{" "}
              <span className="font-semibold">
                UPCAT Filipino Adaptive Reviewer
              </span>{" "}
              (“we”, “our”, “the app”). By accessing or using the app, you agree
              to these Terms.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-10">
            {/* Proper use */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                1) Proper Use
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  You agree to use the app properly and responsibly, and to
                  follow applicable laws and school policies where relevant.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Do not misuse the app (e.g., attempt to hack, disrupt,
                    overload, or bypass security).
                  </li>
                  <li>
                    Do not use the app to upload or share harmful, illegal, or
                    abusive content.
                  </li>
                  <li>
                    Do not attempt to access other users’ accounts or data.
                  </li>
                </ul>
              </div>
            </section>

            {/* Accounts */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                2) Accounts & Access
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  You are responsible for maintaining the confidentiality of
                  your account and for activities that occur under your account.
                  If you believe your account has been compromised, contact us.
                </p>
              </div>
            </section>

            {/* Updates / discontinuation */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                3) Updates, Changes, or Discontinuation
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update the app, change features, or discontinue the
                  service (in whole or in part) at any time, including for
                  maintenance, security, or operational reasons.
                </p>
                <p className="text-sm text-gray-500">
                  We may also update these Terms from time to time. Continued
                  use of the app after updates means you accept the revised
                  Terms.
                </p>
              </div>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                4) Limitation of Liability
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  The app is provided on an “as is” and “as available” basis. To
                  the extent permitted by law, we are not liable for any
                  indirect, incidental, special, consequential, or punitive
                  damages, or any loss of data, profits, or learning outcomes
                  resulting from your use of (or inability to use) the app.
                </p>
                <p className="text-sm text-gray-500">
                  This is an educational tool; practice results do not guarantee
                  exam results.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Contact</h2>
              <p className="text-gray-700">
                If you have questions about these Terms, contact us at{" "}
                <a
                  href="mailto:panawid.team@gmail.com"
                  className="text-blue-700 hover:text-blue-800 font-semibold"
                >
                  panawid.team@gmail.com
                </a>
                .
              </p>
            </section>

            {/* Footer note */}
            <section className="pt-2">
              <p className="text-xs text-gray-500">
                This page is provided for branding verification and
                transparency. By using the app, you agree to these Terms of
                Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
