type TermsOfServiceProps = {
  onBack: () => void;
};

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="legal-page">
      <button className="legal-back" onClick={onBack}>
        ← Back to Travel Vault
      </button>

      <article className="legal-content">
        <p className="brand-eyebrow">Travel Vault</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: September 16, 2026</p>

        <section>
          <h2>1. About Travel Vault</h2>
          <p>
            Travel Vault is a personal travel journaling application designed
            to help users organize and record their travel experiences.
          </p>
        </section>

        <section>
          <h2>2. Accounts</h2>
          <p>
            You are responsible for maintaining the security of the account
            used to access Travel Vault and for all activity carried out
            through your account.
          </p>
        </section>

        <section>
          <h2>3. User Content</h2>
          <p>
            You retain responsibility for the destinations, photos, journal
            entries and other content that you add to Travel Vault.
          </p>
          <p>
            By using the service, you confirm that you have the necessary
            rights to upload and use that content.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>
            You agree not to use Travel Vault for unlawful purposes, to
            interfere with the service, to attempt unauthorized access, or to
            upload content that violates applicable law or the rights of
            others.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>
            Travel Vault uses third-party services including Google, Supabase,
            Vercel and OpenStreetMap/Nominatim. Their availability and terms
            may be outside the control of Travel Vault.
          </p>
        </section>

        <section>
          <h2>6. Maps and Geographic Information</h2>
          <p>
            Geographic information and map results are provided through
            third-party services and may contain inaccuracies or become
            unavailable.
          </p>
        </section>

        <section>
          <h2>7. Availability</h2>
          <p>
            Travel Vault is provided on an as-available basis. Features may
            occasionally be unavailable because of maintenance, technical
            problems or issues affecting third-party services.
          </p>
        </section>

        <section>
          <h2>8. Data and Backups</h2>
          <p>
            Although reasonable measures are taken to protect stored
            information, no online service can guarantee that data will never
            be lost or become unavailable. You remain responsible for keeping
            copies of important information where appropriate.
          </p>
        </section>

        <section>
          <h2>9. Intellectual Property</h2>
          <p>
            The Travel Vault application, including its original design,
            source code and branding, belongs to its respective owner unless
            otherwise stated.
          </p>
        </section>

        <section>
          <h2>10. Privacy</h2>
          <p>
            Use of Travel Vault is also subject to the Travel Vault Privacy
            Policy.
          </p>
        </section>

        <section>
          <h2>11. Disclaimer</h2>
          <p>
            Travel Vault is provided for personal organizational and journaling
            purposes. No guarantee is made that the service will always be
            error-free, uninterrupted or suitable for every particular use.
          </p>
        </section>

        <section>
          <h2>12. Limitation of Liability</h2>
          <p>
            To the extent permitted by applicable law, Travel Vault shall not
            be liable for indirect, incidental or consequential losses arising
            from the use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2>13. Suspension and Termination</h2>
          <p>
            Access to Travel Vault may be suspended or terminated where
            necessary to protect the service, its users or comply with legal
            obligations.
          </p>
        </section>

        <section>
          <h2>14. Changes to These Terms</h2>
          <p>
            These Terms of Service may be updated from time to time. Updated
            terms will be published on this page.
          </p>
        </section>

        <section>
          <h2>15. Governing Law</h2>
          <p>
            These terms are governed by the laws of Spain, subject to any
            mandatory consumer protection rules that may apply.
          </p>
        </section>

        <section>
          <h2>16. Contact</h2>
          <p>
            For questions regarding these Terms of Service, contact the Travel
            Vault administrator through the contact information provided with
            the service.
          </p>
        </section>
      </article>
    </div>
  );
}