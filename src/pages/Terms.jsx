import React from 'react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 sm:p-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          Terms & Conditions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: June 25, 2026</p>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Welcome to Authentic Arts</h2>
            <p>
              Welcome to Authentic Arts ("Company", "we", "our", "us"). These Terms & Conditions govern your use of our website located at authenticarts.com and our interactive web application services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Platform Curation and Authenticity</h2>
            <p>
              We operate a curated exhibition and sales platform. All artists uploading artworks must declare the origin, authenticity, and materials of the artwork. Every submission undergoes a verification check by our curation team before being published publicly. We reserve the right to approve, reject, or request revisions on any artwork listing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Commission and Pricing</h2>
            <p>
              Artwork prices are set by the artists. Authentic Arts charges a **15% platform commission** on all sales completed through the platform. The remaining 85% of the transaction is credited to the artist's virtual wallet, withdrawable via M-Pesa or PayPal. First-time buyers are eligible for a **20% discount** on their purchase, which is subsidized as part of our promotion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Artist Wallet and Withdrawals</h2>
            <p>
              Artists can switch between their buyer profile and artist profile inside the app. Earned balances in the wallet are withdrawable once sales are processed. Platform withdrawals can be initiated to registered mobile money accounts (Lipa Na M-Pesa prompt verification) or verified PayPal emails.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Purchasing and Availability</h2>
            <p>
              To purchase art, users must register an account and accept these Terms & Conditions. Artworks are sold based on listed quantities. Once the available quantity reaches zero, the system automatically marks the piece as sold. 
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Reviews and User Content</h2>
            <p>
              Customers may write reviews and rate purchased artworks on a 5-star basis. Reviews must represent genuine purchase experiences. We reserve the right to remove any review that is defamatory, inappropriate, or falsified.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Limitation of Liability</h2>
            <p>
              Authentic Arts acts as an intermediary connecting buyers and sellers. While we verify artist information and artwork descriptions, we are not liable for differences in subjective aesthetic evaluation or transit damages, though we assist in dispute resolutions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
