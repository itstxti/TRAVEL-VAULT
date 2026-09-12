import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copia .env.example a .env y rellénalas ' +
    'con los datos de tu proyecto Supabase (Project Settings → API).'
  );
}

export const supabase = createClient(url || '', anonKey || '');
