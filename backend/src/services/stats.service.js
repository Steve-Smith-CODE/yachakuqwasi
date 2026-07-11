import { findHousingsByLandlord } from '../repositories/housing.repository.js';
import { countFavoritesByUser, countFavoritesForLandlordListings } from '../repositories/favorites.repository.js';
import { countChatsForUser } from '../repositories/chat.repository.js';
import { withCache } from '../utils/cache.js';

// Los dashboards se refrescan al navegar/enfocar la pestana, asi que un
// desfase corto es aceptable a cambio de no recalcular 3 counts en cada request.
const STATS_CACHE_TTL_MS = 20_000;

export async function getStudentStats(userId) {
  return withCache(`stats:student:${userId}`, STATS_CACHE_TTL_MS, async () => {
    const [favorites, chats] = await Promise.all([countFavoritesByUser(userId), countChatsForUser(userId, 'student')]);

    return {
      savedFavorites: favorites.count ?? 0,
      activeChats: chats.count ?? 0
    };
  });
}

export async function getLandlordStats(landlordId) {
  return withCache(`stats:landlord:${landlordId}`, STATS_CACHE_TTL_MS, async () => {
    const [listingsResult, favoritesResult, chatsResult] = await Promise.all([
      findHousingsByLandlord(landlordId),
      countFavoritesForLandlordListings(landlordId),
      countChatsForUser(landlordId, 'landlord')
    ]);

    const listings = listingsResult.data || [];
    const listingsByStatus = listings.reduce((acc, listing) => {
      acc[listing.status] = (acc[listing.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalListings: listings.length,
      listingsByStatus,
      favoritesReceived: favoritesResult.count ?? 0,
      contactsReceived: chatsResult.count ?? 0
    };
  });
}
