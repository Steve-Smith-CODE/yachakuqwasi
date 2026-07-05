import { compatibility } from '../../../src/controllers/roommates.controller.js';

describe('Roommates Controller', () => {
  it('responde con el score calculado a partir del body', () => {
    const req = {
      body: {
        profileA: { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 },
        profileB: { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 }
      }
    };
    const res = { json: jest.fn() };

    compatibility(req, res);

    expect(res.json).toHaveBeenCalledWith({ score: 1 });
  });
});
