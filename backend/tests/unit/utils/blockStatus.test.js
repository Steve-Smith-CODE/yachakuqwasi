import { isProfileBlocked } from '../../../src/utils/blockStatus.js';

describe('isProfileBlocked', () => {
  it('false si no hay blocked_reason', () => {
    expect(isProfileBlocked({ blocked_reason: null, blocked_until: null })).toBe(false);
  });

  it('true si hay blocked_reason y blocked_until es null (bloqueo permanente)', () => {
    expect(isProfileBlocked({ blocked_reason: 'Spam', blocked_until: null })).toBe(true);
  });

  it('true si blocked_until esta en el futuro', () => {
    const manana = new Date(Date.now() + 86400000).toISOString();
    expect(isProfileBlocked({ blocked_reason: 'Spam', blocked_until: manana })).toBe(true);
  });

  it('false si blocked_until ya paso', () => {
    const ayer = new Date(Date.now() - 86400000).toISOString();
    expect(isProfileBlocked({ blocked_reason: 'Spam', blocked_until: ayer })).toBe(false);
  });

  it('false si el perfil es null/undefined', () => {
    expect(isProfileBlocked(null)).toBe(false);
    expect(isProfileBlocked(undefined)).toBe(false);
  });
});
