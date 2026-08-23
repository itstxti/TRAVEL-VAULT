export const id = () => crypto.randomUUID();

export const tripDays = (start?: string, end?: string): number | null =>
  start && end
    ? Math.max(1, Math.round((+new Date(end + 'T00:00:00') - +new Date(start + 'T00:00:00')) / 86400000) + 1)
    : null;

export const formatDate = (s?: string) =>
  s ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s + 'T00:00:00')) : '';

// Debounce a value: returns the latest value only after `delay` ms of
// inactivity. Used to avoid hammering the geocoding API on every keystroke.
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
