import {
  OPERATOR,
  LAST_UPDATED,
  MINIMUM_AGE,
  PURGE_GRACE_PERIOD_DAYS,
} from '../legal';

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

        <p className="legal-updated">
          Last updated: {LAST_UPDATED}
        </p>

        <section>
          <h2>1. Who provides this service</h2>

          <p>
            Travel Vault is a personal travel journalling application operated
            by {OPERATOR.name}
            {OPERATOR.address ? `, ${OPERATOR.address}` : ''} (
            {OPERATOR.country}), contactable at{' '}
            <a href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>
            .
          </p>

          <p>
            It is a personal, non-commercial project provided free of charge.
            There is no subscription, no payment and nothing to cancel.
            Nothing in these terms is intended to limit any rights that may
            apply under mandatory consumer or digital services law.
          </p>
        </section>

        <section>
          <h2>2. Accounts</h2>

          <p>
            You need an account to use Travel Vault. You can register with an
            email address and password, or with a Google account. You must be at
            least {MINIMUM_AGE} years old.
          </p>

          <p>
            Keep your credentials to yourself and let us know at{' '}
            <a href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>{' '}
            if you think someone else has access to your account.
          </p>
        </section>

        <section>
          <h2>3. Your content</h2>

          <p>
            The destinations, photos, journal entries and other content you add
            remain yours. You grant no licence over them beyond what is
            technically needed to store, sync and display them back to you, and
            they are not used for any other purpose.
          </p>

          <p>
            You are responsible for having the right to upload what you upload,
            including where content shows or describes other people.
          </p>
        </section>

        <section>
          <h2>4. Acceptable use</h2>

          <p>
            Do not use Travel Vault for unlawful purposes, to attempt
            unauthorized access to other accounts or to the infrastructure, to
            disrupt the service, or to store content that is unlawful or
            infringes the rights of others.
          </p>

          <p>
            Because place search runs against the free OpenStreetMap Nominatim
            service, use must remain moderate and directly related to searches
            initiated by you. Automated or high-volume querying, systematic
            queries, autocomplete requests, scraping, bulk geocoding or other
            uses prohibited by the Nominatim usage policy are not permitted.
          </p>
        </section>

        <section>
          <h2>5. Third-party services and map data</h2>

          <p>
            Travel Vault depends on Supabase, Vercel, Google and
            OpenStreetMap/Nominatim, as described in the Privacy Policy. Their
            availability and terms are outside our control, and an outage at
            any of them can make Travel Vault unavailable.
          </p>

          <p>
            Map tiles and geocoding results come from OpenStreetMap. Map data is
            © OpenStreetMap contributors and is made available under the Open
            Database Licence (ODbL). Geographic results are approximate and may
            be inaccurate, incomplete or out of date; do not rely on them for
            navigation or for any safety-critical purpose.
          </p>
        </section>

        <section>
          <h2>6. Availability and changes to the service</h2>

          <p>
            Travel Vault is provided on an as-available basis and may be
            unavailable because of maintenance, technical problems or
            third-party outages. Because this is a personal project, it may
            also be changed or discontinued. If the service is going to be shut
            down, reasonable advance notice will be sent to your account email
            so that you can request a copy of your data first, where reasonably
            possible.
          </p>
        </section>

        <section>
          <h2>7. Data, deletion and backups</h2>

          <p>
            Reasonable measures are taken to protect stored information, but no
            online service can guarantee that data is never lost. You should
            keep your own copies of anything you cannot afford to lose.
          </p>

          <p>
            Deleting content in the app removes it from the app on all your
            devices immediately. As explained in the Privacy Policy, the
            server-side copy is erased automatically within{' '}
            {PURGE_GRACE_PERIOD_DAYS} days, including the underlying photo
            file; if you need it erased sooner, contact{' '}
            <a href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>
            .
          </p>

          <p>
            Where applicable, these deletion and data-retrieval provisions are
            subject to the rights provided by applicable data protection and
            consumer law.
          </p>
        </section>

        <section>
          <h2>8. Intellectual property and licence</h2>

          <p>
            The Travel Vault source code is published by its author under the
            MIT Licence, which permits you to use, copy, modify and redistribute
            the code subject to the conditions in the LICENSE file, including
            retaining the copyright notice. Copyright in the code remains with
            its author.
          </p>

          <p>
            The MIT Licence covers the source code only. It is not permission to
            use the hosted service in ways these terms prohibit, and it does not
            transfer any rights in other users' content.
          </p>
        </section>

        <section>
          <h2>9. Privacy</h2>

          <p>
            Use of Travel Vault is also governed by the Travel Vault Privacy
            Policy, which forms part of these terms.
          </p>
        </section>

        <section>
          <h2>10. Warranties</h2>

          <p>
            Travel Vault is supplied free of charge for personal organizational
            and journalling purposes, and is not guaranteed to be error-free,
            uninterrupted or fit for any particular purpose. Nothing in this
            section removes or limits rights that consumer protection,
            digital-content or other mandatory applicable law gives you and
            that cannot lawfully be waived by agreement.
          </p>
        </section>

        <section>
          <h2>11. Liability</h2>

          <p>
            To the extent permitted by law, and taking into account that the
            service is provided free of charge, we are not liable for indirect
            or consequential loss, loss of profit, or loss arising from your
            failure to keep appropriate copies of content that you choose to
            store through the service.
          </p>

          <p>
            Nothing in these terms excludes or limits liability where doing so
            would be unlawful, including liability for death or personal injury
            caused by negligence, fraud or wilful misconduct, or any other
            liability that cannot lawfully be excluded or limited. If you are a
            consumer, the mandatory protections of consumer law apply in full
            and terms that would be unfair within the meaning of that law do
            not bind you.
          </p>
        </section>

        <section>
          <h2>12. Suspension and termination</h2>

          <p>
            You can stop using Travel Vault at any time and ask for your account
            to be deleted. We may suspend or terminate access where necessary to
            protect the service or its users, or to comply with legal
            obligations. Except where immediate action is required or the law
            prevents it, you will be told the reason and given the chance to
            retrieve your data.
          </p>
        </section>

        <section>
          <h2>13. Changes to these terms</h2>

          <p>
            These terms may be updated, and the updated version will be
            published on this page. Material changes will be notified to your
            account email before they take effect. Continuing to use the service
            after that point means you accept the new terms to the extent
            permitted by applicable law; if you do not agree with the changes,
            you may stop using the service and request deletion of your account.
          </p>
        </section>

        <section>
          <h2>14. Governing law and disputes</h2>

          <p>
            These terms are governed by the laws of {OPERATOR.country}. If you
            are a consumer resident in the European Union, this choice cannot
            deprive you of the protection of the mandatory rules of your country
            of residence, and you may bring proceedings in the courts that have
            jurisdiction under applicable consumer law.
          </p>

          <p>
            Please contact us first at{' '}
            <a href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>{' '}
            — most issues can be settled that way. Consumers may also seek help
            from their national consumer protection authority or other
            competent dispute-resolution bodies where available.
          </p>
        </section>

        <section>
          <h2>15. Contact</h2>

          <p>
            {OPERATOR.name} —{' '}
            <a href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>
          </p>
        </section>
      </article>
    </div>
  );
}