type PrivacyPolicyProps = {
  onBack: () => void;
};

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="legal-page">
      <button className="legal-back" onClick={onBack}>
        ← Back to Travel Vault
      </button>

      <article className="legal-content">
        <p className="brand-eyebrow">Travel Vault</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 16, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Travel Vault is a personal travel journal that allows you to keep
            track of destinations, trips, journal entries and photos.
          </p>
          <p>
            This Privacy Policy explains what information is collected, how it
            is used, and how it is protected when you use Travel Vault.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>Account information</h3>
          <p>
            When you sign in with Google, Travel Vault may receive basic
            information associated with your Google account, such as your name,
            email address, profile picture and account identifier.
          </p>

          <h3>Travel information</h3>
          <p>
            Travel Vault stores information that you choose to provide,
            including destinations, countries, travel dates, destination
            status, companions, journal entries and photos.
          </p>

          <h3>Technical information</h3>
          <p>
            Basic technical information may be processed by the services used
            to operate and secure the application, such as hosting, database
            and authentication providers.
          </p>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>provide and operate Travel Vault;</li>
            <li>authenticate your account;</li>
            <li>store and display your travel information;</li>
            <li>generate travel statistics and map views;</li>
            <li>synchronize your data across supported devices;</li>
            <li>maintain the security and reliability of the service; and</li>
            <li>comply with applicable legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis</h2>
          <p>
            Depending on the processing activity, personal data may be processed
            because it is necessary to provide the service, because you have
            given consent, because of legitimate interests such as security and
            service improvement, or because processing is required by law.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>
            Travel Vault relies on third-party services to provide certain
            functionality, including:
          </p>
          <ul>
            <li>Google for authentication;</li>
            <li>Supabase for authentication, database and storage services;</li>
            <li>Vercel for application hosting; and</li>
            <li>OpenStreetMap and Nominatim for map and location search functionality.</li>
          </ul>
          <p>
            These services may process information according to their own
            privacy policies and terms.
          </p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>
            Your information is retained for as long as necessary to provide
            the service or until you delete it, subject to applicable legal
            requirements and technical retention periods.
          </p>
        </section>

        <section>
          <h2>7. Photos and User Content</h2>
          <p>
            Photos, journal entries and other content you add to Travel Vault
            remain your responsibility. You should only upload content that you
            have the right to use.
          </p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>
            Reasonable technical and organizational measures are used to help
            protect your information against unauthorized access, alteration,
            disclosure or destruction. However, no internet service can
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>9. Your Rights</h2>
          <p>
            Depending on applicable law, you may have rights to access,
            correct, delete, restrict or otherwise control the processing of
            your personal information.
          </p>
        </section>

        <section>
          <h2>10. International Transfers</h2>
          <p>
            Some third-party service providers may process information in
            countries outside your country of residence. Where required,
            appropriate safeguards are used in accordance with applicable data
            protection law.
          </p>
        </section>

        <section>
          <h2>11. Children</h2>
          <p>
            Travel Vault is not intended for children under the minimum age
            required to use online services under applicable law.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Policy</h2>
          <p>
            This Privacy Policy may be updated from time to time. The updated
            version will be published on this page with a new effective date.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            For privacy-related questions or requests, contact the Travel Vault
            administrator at the email address provided with the service.
          </p>
        </section>
      </article>
    </div>
  );
}