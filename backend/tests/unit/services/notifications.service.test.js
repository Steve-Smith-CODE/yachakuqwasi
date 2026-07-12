import {
  listMyNotifications,
  markAsRead,
  markAllAsRead,
  notifyLandlordOfHousingReview,
  notifyAdminsOfNewHousing,
  notifyAdminsOfNewUser,
  notifyUserOfBlock,
  notifyUserOfReactivation
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

  // notifyAdminsOfNewUser/notifyUserOfBlock/notifyUserOfReactivation usan
  // tipos de notification_type agregados en 20260712000000_add_user_notifications.sql;
  // se verifica la forma del insert con un mock (no insert real) para que el
  // test no dependa de que esa migracion ya este aplicada en Supabase.
  describe('notifyAdminsOfNewUser', () => {
    it('no inserta nada si no hay administradores', async () => {
      const originalFn = notificationsRepo.findAdminIds;
      notificationsRepo.findAdminIds = jest.fn().mockResolvedValue({ data: [], error: null });
      const insertSpy = jest.spyOn(notificationsRepo, 'insertNotifications');

      try {
        await notifyAdminsOfNewUser({ userId: 'nuevo-user-id', userName: 'Nuevo Usuario', role: 'student' });
        expect(insertSpy).not.toHaveBeenCalled();
      } finally {
        notificationsRepo.findAdminIds = originalFn;
        insertSpy.mockRestore();
      }
    });

    it('inserta una fila por admin con actor_id apuntando al usuario nuevo', async () => {
      const originalFindAdmins = notificationsRepo.findAdminIds;
      const originalInsert = notificationsRepo.insertNotifications;
      notificationsRepo.findAdminIds = jest.fn().mockResolvedValue({ data: [{ id: 'admin-1' }, { id: 'admin-2' }], error: null });
      notificationsRepo.insertNotifications = jest.fn().mockResolvedValue({ data: [], error: null });

      try {
        await notifyAdminsOfNewUser({ userId: 'nuevo-user-id', userName: 'Nuevo Usuario', role: 'landlord' });

        expect(notificationsRepo.insertNotifications).toHaveBeenCalledWith([
          expect.objectContaining({ recipient_id: 'admin-1', actor_id: 'nuevo-user-id', type: 'new_user' }),
          expect.objectContaining({ recipient_id: 'admin-2', actor_id: 'nuevo-user-id', type: 'new_user' })
        ]);
      } finally {
        notificationsRepo.findAdminIds = originalFindAdmins;
        notificationsRepo.insertNotifications = originalInsert;
      }
    });
  });

  describe('notifyUserOfBlock', () => {
    it('inserta type account_blocked con el motivo en el body', async () => {
      const originalInsert = notificationsRepo.insertNotifications;
      notificationsRepo.insertNotifications = jest.fn().mockResolvedValue({ data: [], error: null });

      try {
        await notifyUserOfBlock({ userId: 'user-bloqueado', motivo: 'Publicaciones fraudulentas', blockedUntil: null });

        expect(notificationsRepo.insertNotifications).toHaveBeenCalledWith([
          expect.objectContaining({ recipient_id: 'user-bloqueado', type: 'account_blocked', body: 'Publicaciones fraudulentas' })
        ]);
      } finally {
        notificationsRepo.insertNotifications = originalInsert;
      }
    });

    it('usa titulo de suspension temporal si hay blockedUntil', async () => {
      const originalInsert = notificationsRepo.insertNotifications;
      notificationsRepo.insertNotifications = jest.fn().mockResolvedValue({ data: [], error: null });

      try {
        await notifyUserOfBlock({ userId: 'user-suspendido', motivo: 'Spam', blockedUntil: new Date().toISOString() });

        expect(notificationsRepo.insertNotifications).toHaveBeenCalledWith([
          expect.objectContaining({ title: 'Tu cuenta fue suspendida temporalmente' })
        ]);
      } finally {
        notificationsRepo.insertNotifications = originalInsert;
      }
    });
  });

  describe('notifyUserOfReactivation', () => {
    it('inserta type account_reactivated para el usuario', async () => {
      const originalInsert = notificationsRepo.insertNotifications;
      notificationsRepo.insertNotifications = jest.fn().mockResolvedValue({ data: [], error: null });

      try {
        await notifyUserOfReactivation('user-reactivado');

        expect(notificationsRepo.insertNotifications).toHaveBeenCalledWith([
          expect.objectContaining({ recipient_id: 'user-reactivado', type: 'account_reactivated' })
        ]);
      } finally {
        notificationsRepo.insertNotifications = originalInsert;
      }
    });
  });
});
