import { describe, it, expect } from 'vitest';
import { COUNTRIES, countryData, flag } from '../data';

describe('countryData', () => {
  it('encuentra un país por nombre exacto', () => {
    const spain = countryData('Spain');
    expect(spain).toBeDefined();
    expect(spain?.[1]).toBe('ES');
  });

  it('la búsqueda no distingue mayúsculas/minúsculas', () => {
    expect(countryData('spain')).toEqual(countryData('SPAIN'));
    expect(countryData('sPaIn')?.[1]).toBe('ES');
  });

  it('devuelve undefined si el país no existe en el dataset', () => {
    expect(countryData('Narnia')).toBeUndefined();
  });

  it('devuelve undefined con cadena vacía', () => {
    expect(countryData('')).toBeUndefined();
  });
});

describe('flag', () => {
  it('convierte un código ISO de 2 letras en el emoji de bandera correspondiente', () => {
    // Regional indicator symbols: 'ES' -> 🇪🇸
    expect(flag('ES')).toBe('🇪🇸');
    expect(flag('US')).toBe('🇺🇸');
  });

  it('devuelve la bandera de "sin país" (blanca) cuando no se pasa código', () => {
    expect(flag(undefined)).toBe('\u{1F3F3}\uFE0F');
    expect(flag('')).toBe('\u{1F3F3}\uFE0F');
  });
});

describe('dataset COUNTRIES (invariantes)', () => {
  it('no tiene códigos ISO duplicados', () => {
    const codes = COUNTRIES.map(c => c[1]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no tiene nombres duplicados', () => {
    const names = COUNTRIES.map(c => c[0].toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('todas las coordenadas están en rangos válidos', () => {
    for (const [name, , lat, lng] of COUNTRIES) {
      expect(lat, `lat de ${name}`).toBeGreaterThanOrEqual(-90);
      expect(lat, `lat de ${name}`).toBeLessThanOrEqual(90);
      expect(lng, `lng de ${name}`).toBeGreaterThanOrEqual(-180);
      expect(lng, `lng de ${name}`).toBeLessThanOrEqual(180);
    }
  });

  it('todos los códigos ISO tienen exactamente 2 letras mayúsculas', () => {
    for (const [name, code] of COUNTRIES) {
      expect(code, `código de ${name}`).toMatch(/^[A-Z]{2}$/);
    }
  });
});