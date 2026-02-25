import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | UPCAT Filipino Adaptive Reviewer",
  description:
    "Privacy Policy for the UPCAT Filipino Adaptive Reviewer (Google OAuth branding verification).",
};

export default function PrivacyPolicyPage() {
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

          <Link
            href="/login"
            className="text-gray-700 hover:text-gray-900 font-semibold text-sm"
          >
            Go to Login
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8 sm:p-10 border-b border-gray-200">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Privacy Policy
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              This Privacy Policy explains how{" "}
              <span className="font-semibold">
                UPCAT Filipino Adaptive Reviewer
              </span>{" "}
              (“we”, “our”, “the app”) collects, uses, and protects your
              information.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-10">
            {/* Summary */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Quick Summary
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <span className="font-semibold">What we collect:</span>{" "}
                  account info (e.g., name, email) and learning progress (e.g.,
                  scores, attempts).
                </li>
                <li>
                  <span className="font-semibold">Why we collect it:</span>{" "}
                  authentication, personalization, and progress tracking.
                </li>
                <li>
                  <span className="font-semibold">
                    We do not sell your data:
                  </span>{" "}
                  your personal information is never sold to third parties.
                </li>
              </ul>
            </section>

            {/* What data we collect */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                1) Information We Collect
              </h2>

              <div className="space-y-4 text-gray-700">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    A. Account & Identity Information
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name (e.g., first name and last name)</li>
                    <li>Email address</li>
                    <li>
                      Profile image/avatar (if provided by your sign-in
                      provider)
                    </li>
                    <li>
                      Authentication provider (e.g., Google Sign-In or
                      email/password)
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    B. Learning & Progress Data
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Exercise attempts and completion status</li>
                    <li>Scores, mastery level, and difficulty served</li>
                    <li>
                      Performance metrics (e.g., missed items, similar choice
                      errors)
                    </li>
                    <li>Study streak / last activity timestamps</li>
                    <li>
                      Spaced-repetition review state for exercises (where
                      applicable)
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    C. Technical Data (Limited)
                  </h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Basic device/browser information needed to operate the app
                      (e.g., for security and troubleshooting)
                    </li>
                    <li>
                      Session/auth tokens stored on your device (e.g., in
                      browser storage) to keep you signed in
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Why we collect */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                2) Why We Collect This Data
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We collect and use your information for the following
                  purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-semibold">Authentication:</span> to
                    create and manage your account and let you sign in securely
                    (including Google OAuth).
                  </li>
                  <li>
                    <span className="font-semibold">Progress tracking:</span> to
                    record your learning progress, attempts, scores, and mastery
                    to support adaptive practice.
                  </li>
                  <li>
                    <span className="font-semibold">Personalization:</span> to
                    recommend appropriate exercises and difficulty based on your
                    performance history.
                  </li>
                  <li>
                    <span className="font-semibold">
                      App operations & security:
                    </span>{" "}
                    to maintain functionality, prevent abuse, and troubleshoot
                    issues.
                  </li>
                </ul>
              </div>
            </section>

            {/* Sharing / third parties */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                3) Data Sharing
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  <span className="font-semibold">
                    We do not sell your personal data.
                  </span>
                </p>
                <p>
                  We only share information when necessary to provide the
                  service, for example:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-semibold">
                      Authentication providers (e.g., Google):
                    </span>{" "}
                    if you choose Google Sign-In, Google processes the sign-in
                    flow and may provide us your basic profile info (such as
                    name, email, and profile picture) depending on your Google
                    account settings.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Service infrastructure:
                    </span>{" "}
                    we may use third-party services to host and operate the app
                    (e.g., authentication and database services). These
                    providers are used to run the app—not to sell your data.
                  </li>
                </ul>
              </div>
            </section>

            {/* Retention & security */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                4) Data Retention & Security
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We retain account and progress data for as long as your
                  account is active or as needed to provide the service. We take
                  reasonable measures to protect your information, including
                  access controls and secure authentication.
                </p>
                <p className="text-sm text-gray-500">
                  Note: No method of transmission or storage is $100\%$ secure,
                  but we aim to use appropriate safeguards for an educational
                  application.
                </p>
              </div>
            </section>

            {/* Choices */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                5) Your Choices
              </h2>
              <div className="text-gray-700 space-y-3">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    You can choose to sign in with Google or with email/password
                    (where available).
                  </li>
                  <li>
                    You may log out at any time, which ends your session on the
                    device.
                  </li>
                  <li>
                    If you need help with your account or data, contact us (see
                    below).
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Contact</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, contact us at{" "}
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
                transparency. By using the app, you acknowledge this Privacy
                Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
