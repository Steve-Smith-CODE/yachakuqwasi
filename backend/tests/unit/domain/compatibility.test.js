import { calculateCompatibilityScore } from '../../../src/domain/compatibility.js';

describe('calculateCompatibilityScore', () => {
  it('retorna 1.0 para perfiles identicos', () => {
    const profile = { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 };
    expect(calculateCompatibilityScore(profile, profile)).toBe(1);
  });

  it('retorna 0 cuando todo difiere y el presupuesto es opuesto', () => {
    const a = { fumador: true, mascotas: true, horario: 'diurno', presupuestoMax: 100 };
    const b = { fumador: false, mascotas: false, horario: 'nocturno', presupuestoMax: 100000 };
    expect(calculateCompatibilityScore(a, b)).toBe(0);
  });

  it('pondera parcialmente cuando solo coinciden fumador y horario', () => {
    const a = { fumador: false, mascotas: true, horario: 'diurno', presupuestoMax: 500 };
    const b = { fumador: false, mascotas: false, horario: 'diurno', presupuestoMax: 500 };
    // fumador (0.3) + horario (0.25) + presupuesto igual (0.25) = 0.8
    expect(calculateCompatibilityScore(a, b)).toBe(0.8);
  });

  it('penaliza proporcionalmente la diferencia de presupuesto sin llegar a negativo', () => {
    const a = { fumador: true, mascotas: true, horario: 'diurno', presupuestoMax: 200 };
    const b = { fumador: true, mascotas: true, horario: 'diurno', presupuestoMax: 1000 };
    // fumador+mascotas+horario = 0.75; presupuesto: diff=800, 800/200 > 1 -> max(0, negativo) = 0
    expect(calculateCompatibilityScore(a, b)).toBe(0.75);
  });
});
