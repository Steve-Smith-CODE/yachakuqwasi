import { listMyNotifications, markAsRead, markAllAsRead } from '../../../src/services/notifications.service.js';
import * as notificationsRepo from '../../../src/repositories/notifications.repository.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

describe('Notifications Service (Supabase local real)', () => {
  describe('listMyNotifications', () => {
    it('devuelve notificaciones y unreadCount reales (0 si no tiene ninguna)', async () => {
      const user = await createRealUser({ role: 'student' });

      const result = await listMyNotifications(user.id);

      expect(result).toEqual({ notifications: [], unreadCount: 0 });
    });

    it('lanza AppError con NOTIFICATIONS_FETCH_FAILED si el repositorio falla', async () => {
      const originalFind = notificationsRepo.findNotificationsForUser;
      notificationsRepo.findNotificationsForUser = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      try {
        await expect(listMyNotifications('cualquier-id')).rejects.toMatchObject({
          statusCode: 500,
          code: 'NOTIFICATIONS_FETCH_FAILED'
        });
      } finally {
        notificationsRepo.findNotificationsForUser = originalFind;
      }
    });
  });

  describe('markAsRead', () => {
    it('lanza NotFoundError si la notificacion no existe o no es del usuario', async () => {
      const user = await createRealUser({ role: 'student' });
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(markAsRead(fakeId, user.id)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza AppError con NOTIFICATION_UPDATE_FAILED si el repositorio falla', async () => {
      const originalFn = notificationsRepo.markNotificationRead;
      notificationsRepo.markNotificationRead = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      try {
        await expect(markAsRead('cualquier-id', 'cualquier-user')).rejects.toMatchObject({
          statusCode: 400,
          code: 'NOTIFICATION_UPDATE_FAILED'
        });
      } finally {
        notificationsRepo.markNotificationRead = originalFn;
      }
    });
  });

  describe('markAllAsRead', () => {
    it('marca como leidas y devuelve un mensaje de confirmacion real', async () => {
      const user = await createRealUser({ role: 'student' });

      const result = await markAllAsRead(user.id);

      expect(result).toEqual({ message: 'Notificaciones marcadas como leídas' });
    });

    it('lanza AppError con NOTIFICATIONS_UPDATE_FAILED si el repositorio falla', async () => {
      const originalFn = notificationsRepo.markAllNotificationsRead;
      notificationsRepo.markAllNotificationsRead = jest.fn().mockResolvedValue({
        error: { message: 'Update failed' }
      });

      try {
        await expect(markAllAsRead('cualquier-id')).rejects.toMatchObject({
          statusCode: 400,
          code: 'NOTIFICATIONS_UPDATE_FAILED'
        });
      } finally {
        notificationsRepo.markAllNotificationsRead = originalFn;
      }
    });
  });
});
