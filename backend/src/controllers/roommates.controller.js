import { getCompatibilityScore } from '../services/roommates.service.js';

export function compatibility(req, res) {
  res.json(getCompatibilityScore(req.body));
}
