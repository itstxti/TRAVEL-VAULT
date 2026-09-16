// Identity of the person operating Travel Vault.
//
// This is not decoration: if the service is offered from Spain, Article 10 of
// Ley 34/2002 (LSSI-CE) requires the provider to be identifiable, and GDPR
// Art. 13(1)(a) requires the data controller's identity and contact details to
// be given to users at the point of collection. A privacy policy that says
// "contact the administrator" without naming anyone does not satisfy either.
//
// FILL THESE IN BEFORE PUBLISHING. Everything else in the legal pages has been
// written to match what the code actually does; these four values are the only
// ones that can't be derived from the source.
export const OPERATOR = {
  /** Legal name of the individual or company operating the service. */
  name: 'TODO: Tatiana H. Garcia Vergara',
  /** Contact email for privacy requests and general enquiries. */
  email: 'TODO: tatianagarciavergara@example.com',
  /** Country the operator is established in. Drives governing law below. */
  country: 'Spain',
  /**
   * Postal address. Required by LSSI Art. 10 for services established in
   * Spain. If you don't want to publish a home address, use a registered
   * office, a co-working address, or an apartado de correos.
   */
  address: 'TODO: C. del Capitán Blanco Argibay, 134, Tetuán, 28029 Madrid, España',
} as const;

export const LAST_UPDATED = 'September 16, 2026';

/**
 * Minimum age. Spain sets the age of consent for information society services
 * at 14 (LOPDGDD Art. 7), lower than the GDPR default of 16. If you open the
 * service to users outside Spain you should raise this to 16, because the
 * relevant age is the one in the *user's* country, not yours.
 */
export const MINIMUM_AGE = 16;

/**
 * Days a soft-deleted row/photo sits with `deleted_at` set before the daily
 * Supabase Edge Function purges it for good (removes the storage object and
 * hard-deletes the row). Keep this in sync with that function's schedule.
 */
export const PURGE_GRACE_PERIOD_DAYS = 7;