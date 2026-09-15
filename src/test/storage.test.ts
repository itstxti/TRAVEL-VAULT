import { describe, it, expect, beforeEach } from 'vitest';
import { load, save, putPhoto, getPhoto, deletePhoto, hydrate } from '../storage';
import { Destination } from '../types';

function makeDestination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: 'dest-1',
    name: 'Lisboa',
    country: 'Portugal',
    type: 'city',
    status: 'visited',
    companions: [],
    lat: 38.7,
    lng: -9.1,
    journal: [],
    photos: [],
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('load / save (localStorage)', () => {
  it('devuelve [] si no hay nada guardado para ese usuario', () => {
    expect(load('user-sin-datos')).toEqual([]);
  });

  it('guarda y recupera destinos para un usuario', () => {
    const dest = makeDestination();
    save('user-a', [dest]);
    const loaded = load('user-a');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('dest-1');
  });

  it('aísla los datos entre distintos usuarios en el mismo navegador', () => {
    save('user-a', [makeDestination({ id: 'a1', name: 'A' })]);
    save('user-b', [makeDestination({ id: 'b1', name: 'B' })]);

    expect(load('user-a').map(d => d.id)).toEqual(['a1']);
    expect(load('user-b').map(d => d.id)).toEqual(['b1']);
  });

  it('no revienta y devuelve [] si el JSON guardado está corrupto', () => {
    localStorage.setItem('my-travels-destinations:user-a', '{esto no es json');
    expect(load('user-a')).toEqual([]);
  });

  it('no persiste el dataUrl de las fotos (solo metadatos) para no llenar localStorage', () => {
    const dest = makeDestination({
      photos: [{ id: 'p1', dataUrl: 'data:image/png;base64,AAAA', caption: 'playa' }],
    });
    save('user-a', [dest]);

    const raw = localStorage.getItem('my-travels-destinations:user-a')!;
    const parsed = JSON.parse(raw);
    expect(parsed[0].photos[0].dataUrl).toBeUndefined();
    expect(parsed[0].photos[0].caption).toBe('playa');
    expect(parsed[0].photos[0].id).toBe('p1');
  });

  it('no lanza si localStorage.setItem falla (p.ej. cuota excedida)', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
    expect(() => save('user-a', [makeDestination()])).not.toThrow();
    Storage.prototype.setItem = original;
  });
});

describe('putPhoto / getPhoto / deletePhoto (IndexedDB)', () => {
  it('guarda y recupera una foto por id', async () => {
    await putPhoto({ id: 'p1', dataUrl: 'data:image/png;base64,AAAA', caption: '' });
    expect(await getPhoto('p1')).toBe('data:image/png;base64,AAAA');
  });

  it('devuelve undefined al pedir una foto que no existe', async () => {
    expect(await getPhoto('no-existe')).toBeUndefined();
  });

  it('elimina una foto y deja de estar disponible', async () => {
    await putPhoto({ id: 'p2', dataUrl: 'data:image/png;base64,BBBB', caption: '' });
    await deletePhoto('p2');
    expect(await getPhoto('p2')).toBeUndefined();
  });
});

describe('hydrate', () => {
  it('rellena dataUrl desde IndexedDB cuando falta en el destino', async () => {
    await putPhoto({ id: 'p3', dataUrl: 'data:image/png;base64,CCCC', caption: '' });
    const dest = makeDestination({
      photos: [{ id: 'p3', dataUrl: '', caption: 'monumento' }],
    });

    const [hydrated] = await hydrate([dest]);
    expect(hydrated.photos[0].dataUrl).toBe('data:image/png;base64,CCCC');
    expect(hydrated.photos[0].caption).toBe('monumento');
  });

  it('deja cadena vacía si la foto tampoco está en IndexedDB', async () => {
    const dest = makeDestination({ photos: [{ id: 'huerfana', dataUrl: '', caption: '' }] });
    const [hydrated] = await hydrate([dest]);
    expect(hydrated.photos[0].dataUrl).toBe('');
  });

  it('no toca dataUrl si ya viene con datos', async () => {
    const dest = makeDestination({
      photos: [{ id: 'p4', dataUrl: 'ya-tengo-datos', caption: '' }],
    });
    const [hydrated] = await hydrate([dest]);
    expect(hydrated.photos[0].dataUrl).toBe('ya-tengo-datos');
  });

  it('procesa varios destinos en paralelo sin mezclar sus fotos', async () => {
    await putPhoto({ id: 'x1', dataUrl: 'foto-x1', caption: '' });
    await putPhoto({ id: 'y1', dataUrl: 'foto-y1', caption: '' });
    const destX = makeDestination({ id: 'destX', photos: [{ id: 'x1', dataUrl: '', caption: '' }] });
    const destY = makeDestination({ id: 'destY', photos: [{ id: 'y1', dataUrl: '', caption: '' }] });

    const [hx, hy] = await hydrate([destX, destY]);
    expect(hx.photos[0].dataUrl).toBe('foto-x1');
    expect(hy.photos[0].dataUrl).toBe('foto-y1');
  });
});