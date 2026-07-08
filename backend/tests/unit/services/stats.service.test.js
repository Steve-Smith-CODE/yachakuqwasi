import { getStudentStats, getLandlordStats } from '../../../src/services/stats.service.js';
import * as favoritesRepo from '../../../src/repositories/favorites.repository.js';
import * as chatRepo from '../../../src/repositories/chat.repository.js';
import * as housingRepo from '../../../src/repositories/housing.repository.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

describe('Stats Service (Supabase local real)', () => {
  describe('getStudentStats', () => {
    it('devuelve 0/0 reales para un estudiante recien creado, sin favoritos ni chats', async () => {
      const student = await createRealUser({ role: 'student' });

      const stats = await getStudentStats(student.id);

      expect(stats).toEqual({ savedFavorites: 0, activeChats: 0 });
    });

    it('usa 0 por defecto si el conteo de favoritos o chats viene null/undefined', async () => {
      const originalFavorites = favoritesRepo.countFavoritesByUser;
      const originalChats = chatRepo.countChatsForUser;
      favoritesRepo.countFavoritesByUser = jest.fn().mockResolvedValue({ count: null });
      chatRepo.countChatsForUser = jest.fn().mockResolvedValue({ count: undefined });

      try {
        const stats = await getStudentStats('cualquier-id');
        expect(stats).toEqual({ savedFavorites: 0, activeChats: 0 });
      } finally {
        favoritesRepo.countFavoritesByUser = originalFavorites;
        chatRepo.countChatsForUser = originalChats;
      }
    });
  });

  describe('getLandlordStats', () => {
    it('devuelve conteos reales en 0 para un arrendador recien creado, sin publicaciones', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const stats = await getLandlordStats(landlord.id);

      expect(stats).toEqual({
        totalListings: 0,
        listingsByStatus: {},
        favoritesReceived: 0,
        contactsReceived: 0
      });
    });

    it('usa [] y 0 por defecto si el repositorio devuelve data/count null o undefined', async () => {
      const originalListings = housingRepo.findHousingsByLandlord;
      const originalFavorites = favoritesRepo.countFavoritesForLandlordListings;
      const originalChats = chatRepo.countChatsForUser;
      housingRepo.findHousingsByLandlord = jest.fn().mockResolvedValue({ data: null });
      favoritesRepo.countFavoritesForLandlordListings = jest.fn().mockResolvedValue({ count: undefined });
      chatRepo.countChatsForUser = jest.fn().mockResolvedValue({ count: null });

      try {
        const stats = await getLandlordStats('cualquier-id');
        expect(stats).toEqual({
          totalListings: 0,
          listingsByStatus: {},
          favoritesReceived: 0,
          contactsReceived: 0
        });
      } finally {
        housingRepo.findHousingsByLandlord = originalListings;
        favoritesRepo.countFavoritesForLandlordListings = originalFavorites;
        chatRepo.countChatsForUser = originalChats;
      }
    });
  });
});
