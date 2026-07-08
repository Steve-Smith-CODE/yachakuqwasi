import { getStudentStats, getLandlordStats } from '../services/stats.service.js';

export async function studentStats(req, res) {
  const stats = await getStudentStats(req.user.id);
  res.json(stats);
}

export async function landlordStats(req, res) {
  const stats = await getLandlordStats(req.user.id);
  res.json(stats);
}
