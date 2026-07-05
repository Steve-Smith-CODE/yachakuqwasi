import { geocode, clearGeocodeCache } from '../../../src/services/geocoding.service.js';

// Unica excepcion en la suite a "siempre contra servicios reales": Nominatim
// es un servicio externo de terceros con limite de 1 req/segundo, no un
// componente propio (a diferencia de Supabase, que si se prueba real en
// todo el resto del proyecto). Mockear global.fetch evita depender de red
// externa y de ese rate limit durante los tests.
describe('geocoding.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearGeocodeCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('devuelve lat/lon cuando Nominatim encuentra resultados', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '-13.1588', lon: '-74.2232' }]
    });

    const coords = await geocode('Jr. Tres Mascaras 142, San Blas, Ayacucho, Peru');

    expect(coords).toEqual({ lat: -13.1588, lon: -74.2232 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('devuelve null cuando Nominatim no encuentra resultados', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    const coords = await geocode('Direccion inexistente en la luna');

    expect(coords).toBeNull();
  });

  it('devuelve null cuando la respuesta no es ok, sin lanzar', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => [] });

    const coords = await geocode('Direccion cualquiera');

    expect(coords).toBeNull();
  });

  it('usa el cache y no vuelve a llamar a fetch para la misma direccion', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '-13.1', lon: '-74.2' }]
    });

    await geocode('Jr. Cache 1, San Blas');
    await geocode('Jr. Cache 1, San Blas');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
