import { listMyNotifications, markAsRead, markAllAsRead } from '../services/notifications.service.js';

export async function list(req, res) {
  const result = await listMyNotifications(req.user.id);
  res.json(result);
}

export async function readOne(req, res) {
  const notification = await markAsRead(req.params.id, req.user.id);
  res.json({ notification });
}

export async function readAll(req, res) {
  const result = await markAllAsRead(req.user.id);
  res.json(result);
}
