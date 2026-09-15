import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAddress, searchPlace, reverseGeocode } from '../geocode';

describe('parseAddress', () => {
  it('prioriza "city" cuando está presente', () => {
    const item = { address: { city: 'Madrid', town: 'Otra', country: 'Spain' }, display_name: 'x' };
    expect(parseAddress(item)).toEqual({ city: 'Madrid', country: 'Spain' });
  });

  it('cae a "town" si no hay "city"', () => {
    const item = { address: { town: 'Alcobendas', country: 'Spain' } };
    expect(parseAddress(item).city).toBe('Alcobendas');
  });

  it('cae a "village" si no hay city ni town', () => {
    const item = { address: { village: 'Pueblo Chico', country: 'Spain' } };
    expect(parseAddress(item).city).toBe('Pueblo Chico');
  });

  it('cae a "municipality" y luego a "county" en ese orden', () => {
    expect(parseAddress({ address: { municipality: 'M' } }).city).toBe('M');
    expect(parseAddress({ address: { county: 'C' } }).city).toBe('C');
  });

  it('si no hay ningún campo de ciudad, usa el primer trozo de display_name', () => {
    const item = { address: {}, display_name: 'Puerta del Sol, Madrid, España' };
    expect(parseAddress(item).city).toBe('Puerta del Sol');
  });

  it('devuelve city vacío si no hay address ni display_name', () => {
    expect(parseAddress({})).toEqual({ city: '', country: '' });
  });

  it('devuelve country vacío si no viene en address', () => {
    expect(parseAddress({ address: { city: 'X' } }).country).toBe('');
  });

  it('no revienta si "address" es undefined pero sí hay display_name', () => {
    expect(parseAddress({ display_name: 'Solo esto' })).toEqual({ city: 'Solo esto', country: '' });
  });
});

describe('searchPlace', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('mapea la respuesta de Nominatim al formato GeocodeResult', async () => {
    const mockResponse = [
      {
        display_name: 'Madrid, Spain',
        lat: '40.4168',
        lon: '-3.7038',
        address: { city: 'Madrid', country: 'Spain' },
      },
    ];
    (fetch as any).mockResolvedValue({ ok: true, json: async () => mockResponse });

    const results = await searchPlace('Madrid');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Madrid')),
      expect.any(Object)
    );
    expect(results).toEqual([
      { label: 'Madrid, Spain', city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
    ]);
  });

  it('lanza un error si la respuesta HTTP no es OK', async () => {
    (fetch as any).mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(searchPlace('lo que sea')).rejects.toThrow('geocoding request failed');
  });

  it('devuelve una lista vacía si la API responde sin resultados', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
    expect(await searchPlace('nada')).toEqual([]);
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('devuelve city/country a partir de lat/lng', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ address: { city: 'Lisboa', country: 'Portugal' } }),
    });
    expect(await reverseGeocode(38.7, -9.1)).toEqual({ city: 'Lisboa', country: 'Portugal' });
  });

  it('lanza un error si la respuesta HTTP no es OK', async () => {
    (fetch as any).mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(reverseGeocode(0, 0)).rejects.toThrow('reverse geocoding failed');
  });
});