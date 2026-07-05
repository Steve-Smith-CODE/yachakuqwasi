import { calculateCompatibilityScore } from '../domain/compatibility.js';

export function getCompatibilityScore({ profileA, profileB }) {
  return { score: calculateCompatibilityScore(profileA, profileB) };
}
