import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tripDays, formatDate, debounce, id } from '../utils';

describe('tripDays', () => {
  it('devuelve null si falta la fecha de inicio o la de fin', () => {
    expect(tripDays(undefined, '2024-01-05')).toBeNull();
    expect(tripDays('2024-01-01', undefined)).toBeNull();
    expect(tripDays()).toBeNull();
  });

  it('cuenta un viaje de un solo día como 1', () => {
    expect(tripDays('2024-01-01', '2024-01-01')).toBe(1);
  });

  it('cuenta correctamente un rango de varios días (inclusive)', () => {
    // 1 -> 5 de enero: 5 días (1,2,3,4,5)
    expect(tripDays('2024-01-01', '2024-01-05')).toBe(5);
  });

  it('funciona cruzando el fin de mes', () => {
    expect(tripDays('2024-01-30', '2024-02-02')).toBe(4);
  });

  it('funciona cruzando un año bisiesto (29 feb 2024)', () => {
    expect(tripDays('2024-02-28', '2024-03-01')).toBe(3);
  });

  it('nunca devuelve menos de 1 aunque end sea anterior a start', () => {
    // Math.max(1, ...) protege ante datos corruptos/orden invertido
    expect(tripDays('2024-01-10', '2024-01-05')).toBe(1);
  });
});

describe('formatDate', () => {
  it('devuelve cadena vacía si no hay fecha', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('formatea en formato en-GB: día mes-abreviado año', () => {
    // new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric'})
    expect(formatDate('2024-03-05')).toBe('5 Mar 2024');
  });

  it('no se desplaza de día por zona horaria (usa T00:00:00 local)', () => {
    expect(formatDate('2024-01-01')).toBe('1 Jan 2024');
    expect(formatDate('2024-12-31')).toBe('31 Dec 2024');
  });
});

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('no llama a la función antes de que pase el delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
  });

  it('llama a la función una vez transcurrido el delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced('a');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('cada llamada reinicia el temporizador (solo se ejecuta la última)', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced('primero');
    vi.advanceTimersByTime(200);
    debounced('segundo');
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled(); // aún no pasaron 300ms desde 'segundo'
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('segundo');
  });
});

describe('id', () => {
  it('genera identificadores distintos en llamadas sucesivas', () => {
    const a = id();
    const b = id();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
  });
});