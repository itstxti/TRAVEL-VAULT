import { OPERATOR, LAST_UPDATED, MINIMUM_AGE, PURGE_GRACE_PERIOD_DAYS } from '../legal';

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
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <section>
          <h2>1. Who is responsible for your data</h2>
          <p>
            Travel Vault is a personal travel journal that lets you record
            destinations, trips, journal entries and photos. It is operated as a
            personal, non-commercial project by {OPERATOR.name}
            {OPERATOR.address ? `, ${OPERATOR.address}` : ''} (
            {OPERATOR.country}), who is the data controller for the information
            described below.
          </p>
          <p>
            For any privacy question or request, write to{' '}
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>

          <h3>Account information</h3>
          <p>
            You can create an account in two ways, and what we receive depends
            on which you choose:
          </p>
          <ul>
            <li>
              <strong>Email and password.</strong> We receive your email address
              and an account identifier. Your password is handled and stored by
              our authentication provider (Supabase) in hashed form; it is never
              visible to the operator of Travel Vault.
            </li>
            <li>
              <strong>Sign in with Google.</strong> We receive the basic profile
              information your Google account releases, which typically includes
              your email address, name, profile picture and an account
              identifier.
            </li>
          </ul>
          <p>
            If you use the password reset feature, your email address is used to
            send you a reset link.
          </p>

          <h3>Travel information</h3>
          <p>
            Travel Vault stores what you choose to enter: destination names,
            countries, map coordinates, destination type and status, trip start
            and end dates, the names of travel companions, dated journal entries
            and photos with their captions.
          </p>

          <h3>Information about other people</h3>
          <p>
            Some of this content can describe people other than you — a
            companion's name, a journal entry that mentions someone, or a photo
            they appear in. You decide what to enter, and you are responsible
            for doing so lawfully. Please do not upload information about others
            that they would not expect you to store in a private journal.
          </p>

          <h3>Technical information</h3>
          <p>
            Travel Vault contains no analytics, advertising, tracking pixels or
            profiling of any kind, and the operator does not receive usage
            statistics about you. However, the infrastructure providers listed
            in section 5 necessarily process technical data such as your IP
            address and browser user agent in order to serve requests and to
            keep the service secure.
          </p>
        </section>

        <section>
          <h2>3. Where your data is stored</h2>
          <p>Travel Vault keeps two copies of your data, and you should know about both:</p>
          <ul>
            <li>
              <strong>On our servers.</strong> Your destinations, journal
              entries and photo records are stored in a Supabase database, and
              photo files are stored in Supabase Storage. Database access is
              restricted per account at the database level, so one account
              cannot read another account's rows.
            </li>
            <li>
              <strong>On your device.</strong> Travel Vault also keeps a local
              copy in your browser so the app works quickly and offline: trip
              data in <code>localStorage</code> and photo files in{' '}
              <code>IndexedDB</code>. Your login session is likewise stored in{' '}
              <code>localStorage</code> by the authentication provider. These
              are not advertising cookies and are used only to run the service.
            </li>
          </ul>
          <p>
            <strong>Important:</strong> signing out ends your session but does
            not currently erase the local copy from that browser. On a shared or
            public computer, clear the site's browsing data afterwards if you
            want the local copy removed.
          </p>
        </section>

        <section>
          <h2>4. How we use your information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>create your account and authenticate you;</li>
            <li>store and display your travel information;</li>
            <li>generate travel statistics and map views;</li>
            <li>synchronize your data across devices where you sign in;</li>
            <li>keep the service secure and working; and</li>
            <li>comply with applicable legal obligations.</li>
          </ul>
          <p>
            Your travel content is not sold, rented, used to train models, or
            disclosed to anyone except the infrastructure providers in section 5
            acting on our behalf, or where disclosure is legally required.
          </p>
        </section>

        <section>
          <h2>5. Legal basis</h2>
          <p>
            Account data and travel content are processed because it is
            necessary to perform the contract of providing the service to you
            (GDPR Art. 6(1)(b)). Security, abuse prevention and keeping the
            service running rely on legitimate interests (Art. 6(1)(f)).
            Anything we are obliged to keep or disclose by law relies on Art.
            6(1)(c).
          </p>
          <p>
            Journal entries and photos can contain special categories of data
            (for example health or religious references) if you choose to write
            them. Where that happens, the basis is your explicit consent under
            Art. 9(2)(a), given by entering the content; you can withdraw it at
            any time by deleting the entry.
          </p>
        </section>

        <section>
          <h2>6. Third-party services</h2>
          <p>
            Travel Vault could not run without the following providers, each of
            which processes data under its own privacy terms:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — authentication, database and photo
              storage. It holds your account record and all synced content.
            </li>
            <li>
              <strong>Google</strong> — only if you choose "Continue with
              Google", for authentication.
            </li>
            <li>
              <strong>Google Fonts</strong> — an icon font is loaded from{' '}
              <code>fonts.googleapis.com</code> and{' '}
              <code>fonts.gstatic.com</code> on every page load, which discloses
              your IP address to Google even if you never use Google sign-in.
            </li>
            <li>
              <strong>Vercel</strong> — hosting and delivery of the application.
            </li>
            <li>
              <strong>OpenStreetMap and Nominatim</strong> — map tiles and place
              search. When you search for a place or move a map pin, the text
              you typed or the coordinates you selected, along with your IP
              address, are sent to OpenStreetMap servers.
            </li>
          </ul>
          <p>
            Travel Vault does not request access to your device's GPS location;
            map positions come only from what you search for or click.
          </p>
        </section>

        <section>
          <h2>7. Retention and deletion</h2>
          <p>
            Deleting a destination, journal entry or photo removes it from the
            app immediately, on every device where you sign in.
          </p>
          <p>
            On the server, deletion happens in two steps. The record is first
            marked as deleted rather than removed outright, so that the
            deletion can propagate correctly to your other devices. An
            automated process then runs daily and permanently erases anything
            that has been marked as deleted for more than{' '}
            {PURGE_GRACE_PERIOD_DAYS} days — this includes deleting the photo
            file itself from storage, not just the database record. In
            practice this means deleted content is gone from our servers
            within {PURGE_GRACE_PERIOD_DAYS} days at the latest, and often
            sooner.
          </p>
          <p>
            If you need something erased from the server before that window
            closes, or want your account and all its data removed entirely,
            email <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> and
            it will be handled within one month, as required by GDPR Art.
            12(3).
          </p>
          <p>
            Backups kept by the infrastructure providers may retain copies for
            a limited period after deletion, following those providers' own
            backup cycles.
          </p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>
            Connections are encrypted in transit, the application sets a strict
            Content Security Policy and related security headers, and database
            access rules restrict each account to its own rows. Passwords are
            stored hashed by the authentication provider.
          </p>
          <p>
            No internet service can guarantee absolute security. Because a full
            copy of your data also sits in your browser, the security of the
            device you use matters as much as the security of the server.
          </p>
        </section>

        <section>
          <h2>9. Your rights</h2>
          <p>
            Under the GDPR you have the right to access your data, correct it,
            delete it, restrict or object to its processing, and receive it in a
            portable format. Most content can be viewed and corrected directly
            in the app; for access copies, portability, or erasure, email{' '}
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. There is
            no automated export feature in the app at present, so portability
            requests are handled manually.
          </p>
          <p>
            If you believe your data has been mishandled you can complain to
            your local supervisory authority. In Spain this is the Agencia
            Española de Protección de Datos (www.aepd.es).
          </p>
          <p>
            Travel Vault does not carry out automated decision-making or
            profiling that produces legal or similarly significant effects.
          </p>
        </section>

        <section>
          <h2>10. International transfers</h2>
          <p>
            The providers in section 6 are able to process data outside the
            European Economic Area, including in the United States. Such
            transfers rely on the transfer mechanisms those providers put in
            place, such as the EU Standard Contractual Clauses or an adequacy
            decision. The specific region where your database and photos are
            hosted depends on the Supabase project configuration chosen by the
            operator, and can be confirmed on request.
          </p>
        </section>

        <section>
          <h2>11. Children</h2>
          <p>
            Travel Vault is not directed at children. You must be at least{' '}
            {MINIMUM_AGE} years old to create an account. If you believe a child
            has created an account, contact{' '}
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> and it will
            be removed.
          </p>
        </section>

        <section>
          <h2>12. Changes to this policy</h2>
          <p>
            This policy may be updated. The updated version is published on this
            page with a new date at the top. If a change materially affects how
            your data is handled, you will be notified by email before it takes
            effect.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            {OPERATOR.name} —{' '}
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          </p>
        </section>
      </article>
    </div>
  );
}