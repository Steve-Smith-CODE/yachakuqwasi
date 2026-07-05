jest.mock('../../../src/services/geocoding.service.js', () => ({
  geocode: jest.fn()
}));

import { resolveCoordinates } from '../../../src/services/housing.service.js';
import { geocode } from '../../../src/services/geocoding.service.js';

// resolveCoordinates omite la geocodificacion real cuando NODE_ENV=test (para
// no depender de red externa en el resto de la suite). Estos tests fuerzan
// temporalmente otro NODE_ENV para ejercitar esa rama, con geocode mockeado.
describe('resolveCoordinates (fuera del guard de NODE_ENV=test)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    geocode.mockReset();
  });

  it('devuelve coordenadas cuando geocode encuentra resultados', async () => {
    process.env.NODE_ENV = 'production';
    geocode.mockResolvedValue({ lat: -13.16, lon: -74.22 });

    const result = await resolveCoordinates('Jr. Tres Mascaras 142', 'San Blas');

    expect(result).toEqual({ coordinateX: -74.22, coordinateY: -13.16 });
  });

  it('devuelve null/null cuando geocode no encuentra resultados', async () => {
    process.env.NODE_ENV = 'production';
    geocode.mockResolvedValue(null);

    const result = await resolveCoordinates('Direccion inexistente', 'San Blas');

    expect(result).toEqual({ coordinateX: null, coordinateY: null });
  });

  it('devuelve null/null y no lanza si geocode falla', async () => {
    process.env.NODE_ENV = 'production';
    geocode.mockRejectedValue(new Error('Timeout de red'));

    const result = await resolveCoordinates('Jr. Tres Mascaras 142', 'San Blas');

    expect(result).toEqual({ coordinateX: null, coordinateY: null });
  });

  it('en NODE_ENV=test siempre devuelve null/null sin llamar a geocode', async () => {
    process.env.NODE_ENV = 'test';

    const result = await resolveCoordinates('Jr. Tres Mascaras 142', 'San Blas');

    expect(result).toEqual({ coordinateX: null, coordinateY: null });
    expect(geocode).not.toHaveBeenCalled();
  });
});
