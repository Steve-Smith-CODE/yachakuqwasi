import {
  listMyNotifications,
  markAsRead,
  markAllAsRead,
  notifyLandlordOfHousingReview,
  notifyAdminsOfNewHousing
} from '../../../src/services/notifications.service.js';
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

    it('lanza AppError con NOTIFICATIONS_FETCH_FAILED si solo falla el conteo de no leidas', async () => {
      const originalCount = notificationsRepo.countUnreadNotifications;
      notificationsRepo.countUnreadNotifications = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'Count failed' }
      });

      try {
        await expect(listMyNotifications('cualquier-id')).rejects.toMatchObject({
          statusCode: 500,
          code: 'NOTIFICATIONS_FETCH_FAILED'
        });
      } finally {
        notificationsRepo.countUnreadNotifications = originalCount;
      }
    });

    it('usa 0 como unreadCount si el repositorio devuelve count null sin error', async () => {
      const originalCount = notificationsRepo.countUnreadNotifications;
      notificationsRepo.countUnreadNotifications = jest.fn().mockResolvedValue({ count: null, error: null });

      try {
        const user = await createRealUser({ role: 'student' });
        const result = await listMyNotifications(user.id);

        expect(result.unreadCount).toBe(0);
      } finally {
        notificationsRepo.countUnreadNotifications = originalCount;
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

  describe('notifyLandlordOfHousingReview', () => {
    it('no inserta nada si el estado no es approved/flagged/suspended', async () => {
      const insertSpy = jest.spyOn(notificationsRepo, 'insertNotifications');

      await notifyLandlordOfHousingReview({
        landlordId: 'cualquier-id',
        listingId: null,
        listingTitle: 'Cuarto de prueba',
        estado: 'pending'
      });

      expect(insertSpy).not.toHaveBeenCalled();
      insertSpy.mockRestore();
    });

    it('inserta una notificacion real cuando el estado es valido', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      await notifyLandlordOfHousingReview({
        landlordId: landlord.id,
        listingId: null,
        listingTitle: 'Cuarto de prueba',
        estado: 'approved',
        actorId: null
      });

      const { notifications } = await listMyNotifications(landlord.id);
      expect(notifications.some((n) => n.type === 'listing_approved')).toBe(true);
    });
  });

  describe('notifyAdminsOfNewHousing', () => {
    it('no inserta nada si no hay administradores', async () => {
      const originalFn = notificationsRepo.findAdminIds;
      notificationsRepo.findAdminIds = jest.fn().mockResolvedValue({ data: [], error: null });
      const insertSpy = jest.spyOn(notificationsRepo, 'insertNotifications');

      try {
        await notifyAdminsOfNewHousing({ listingId: null, listingTitle: 'Cuarto de prueba', actorId: null });
        expect(insertSpy).not.toHaveBeenCalled();
      } finally {
        notificationsRepo.findAdminIds = originalFn;
        insertSpy.mockRestore();
      }
    });

    it('no inserta nada si findAdminIds devuelve error', async () => {
      const originalFn = notificationsRepo.findAdminIds;
      notificationsRepo.findAdminIds = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
      const insertSpy = jest.spyOn(notificationsRepo, 'insertNotifications');

      try {
        await notifyAdminsOfNewHousing({ listingId: null, listingTitle: 'Cuarto de prueba', actorId: null });
        expect(insertSpy).not.toHaveBeenCalled();
      } finally {
        notificationsRepo.findAdminIds = originalFn;
        insertSpy.mockRestore();
      }
    });

    it('inserta una notificacion real por cada administrador encontrado', async () => {
      const admin = await createRealUser({ role: 'admin' });
      const originalFn = notificationsRepo.findAdminIds;
      notificationsRepo.findAdminIds = jest.fn().mockResolvedValue({ data: [{ id: admin.id }], error: null });

      try {
        await notifyAdminsOfNewHousing({ listingId: null, listingTitle: 'Cuarto nuevo de prueba', actorId: null });

        const { notifications } = await listMyNotifications(admin.id);
        expect(notifications.some((n) => n.type === 'listing_pending_review')).toBe(true);
      } finally {
        notificationsRepo.findAdminIds = originalFn;
      }
    });
  });
});
