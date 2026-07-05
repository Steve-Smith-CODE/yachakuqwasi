const WEIGHTS = { fumador: 0.3, mascotas: 0.2, horario: 0.25, presupuesto: 0.25 };

// Logica de dominio pura: sin I/O, sin Supabase, sin req/res.
// Recibe dos perfiles de estilo de vida y devuelve un score 0-1 de afinidad.
export function calculateCompatibilityScore(profileA, profileB) {
  let score = 0;

  if (profileA.fumador === profileB.fumador) score += WEIGHTS.fumador;
  if (profileA.mascotas === profileB.mascotas) score += WEIGHTS.mascotas;
  if (profileA.horario === profileB.horario) score += WEIGHTS.horario;

  const budgetDiff = Math.abs(profileA.presupuestoMax - profileB.presupuestoMax);
  score += WEIGHTS.presupuesto * Math.max(0, 1 - budgetDiff / profileA.presupuestoMax);

  return Math.round(score * 100) / 100;
}
