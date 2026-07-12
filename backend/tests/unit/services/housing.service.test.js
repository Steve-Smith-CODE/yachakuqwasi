import {
  createHousing,
  listHousings,
  listMyHousings,
  addHousingImages,
  getHousingById,
  deleteHousing
} from '../../../src/services/housing.service.js';
import * as housingRepo from '../../../src/repositories/housing.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Housing Service (Supabase local real)', () => {
  describe('createHousing', () => {
    it('inserta la publicacion real con estado pending', async () => {
      const landlord = await createRealUser({ role: 'landlord', name: 'Arrendador Real' });

      const listing = await createHousing(landlord.id, {
        title: 'Habitacion real de prueba',
        description: 'Creada por test real',
        pricePen: 300,
        distanceToUnschMinutes: 12,
        neighborhood: 'San Blas',
        address: 'Jr. Real 123',
        contactPhone: '966000000',
        type: 'room'
      });
      createdListingIds.push(listing.id);

      expect(listing.landlord_id).toBe(landlord.id);
      expect(listing.status).toBe('pending');
      expect(listing.title).toBe('Habitacion real de prueba');
    });

    it('lanza error con statusCode 400 si falta un campo obligatorio (address NOT NULL)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      await expect(
        createHousing(landlord.id, {
          title: 'Sin direccion',
          pricePen: 100,
          distanceToUnschMinutes: 5,
          neighborhood: 'Belén',
          contactPhone: '900000000'
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('registra la creacion en audit_logs como landlord_activity', async () => {
      const landlord = await createRealUser({ role: 'landlord', name: 'Arrendador Audit Create' });

      const listing = await createHousing(
        landlord.id,
        {
          title: 'Habitacion audit al crear',
          pricePen: 300,
          distanceToUnschMinutes: 12,
          neighborhood: 'San Blas',
          address: 'Jr. Audit Create 1',
          contactPhone: '966000000'
        },
        { id: landlord.id, name: landlord.name, role: 'landlord' }
      );
      createdListingIds.push(listing.id);

      const { data: log } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('action', 'Creó anuncio')
        .maybeSingle();
      expect(log?.type).toBe('landlord_activity');
    });
  });

  describe('listHousings', () => {
    it('solo devuelve publicaciones con estado approved', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const { data: approved } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Aprobada real',
          price_pen: 200,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Carmen Alto',
          address: 'Jr. Aprobada 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(approved.id);

      const { data: pending } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Pendiente real',
          price_pen: 200,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Carmen Alto',
          address: 'Jr. Pendiente 1',
          contact_phone: '900000000',
          status: 'pending'
        })
        .select()
        .single();
      createdListingIds.push(pending.id);

      const result = await listHousings({ barrio: 'Carmen Alto' });
      const ids = result.map((r) => r.id);

      expect(ids).toContain(approved.id);
      expect(ids).not.toContain(pending.id);
    });

    it('filtra por precio maximo', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const { data: barato } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Barata real',
          price_pen: 150,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Santa Ana',
          address: 'Jr. Barata 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(barato.id);

      const { data: cara } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Cara real',
          price_pen: 500,
          distance_to_unsch_minutes: 5,
          neighborhood: 'Santa Ana',
          address: 'Jr. Cara 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(cara.id);

      const result = await listHousings({ barrio: 'Santa Ana', precioMax: 200 });
      const ids = result.map((r) => r.id);

      expect(ids).toContain(barato.id);
      expect(ids).not.toContain(cara.id);
    });

    it('lanza error con statusCode 500 si el tipo no es un valor valido del enum (error real de Postgres)', async () => {
      await expect(listHousings({ tipo: 'no-existe-este-tipo' })).rejects.toMatchObject({ statusCode: 500 });
    });

    it('usa {} por defecto cuando se llama sin argumentos', async () => {
      const result = await listHousings();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('listMyHousings', () => {
    it('devuelve solo las publicaciones reales del arrendador indicado', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Mia real',
        pricePen: 250,
        distanceToUnschMinutes: 8,
        neighborhood: 'San Blas',
        address: 'Jr. Mia 1',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      const result = await listMyHousings(landlord.id);

      expect(result.map((l) => l.id)).toContain(listing.id);
    });

    it('lanza error con statusCode 500 si el repositorio falla', async () => {
      const originalFn = housingRepo.findHousingsByLandlord;
      housingRepo.findHousingsByLandlord = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      try {
        await expect(listMyHousings('cualquier-id')).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        housingRepo.findHousingsByLandlord = originalFn;
      }
    });
  });

  describe('getHousingById', () => {
    it('devuelve la publicacion aprobada real por id', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Detalle service real',
        pricePen: 300,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. Detalle 1',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);
      await supabaseAdmin.from('housing_listings').update({ status: 'approved' }).eq('id', listing.id);

      const result = await getHousingById(listing.id);

      expect(result.id).toBe(listing.id);
    });

    it('lanza error 404 si no existe', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(getHousingById(fakeId)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza error 404 si la publicacion existe pero no esta aprobada', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Pendiente service real',
        pricePen: 300,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. Pendiente 1',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      await expect(getHousingById(listing.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('addHousingImages', () => {
    it('agrega imagenes a una publicacion como landlord propietario', async () => {
      const landlord = await createRealUser({ role: 'landlord' });

      const listing = await createHousing(landlord.id, {
        title: 'Habitacion para imagenes',
        pricePen: 250,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. Imagenes 123',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      // Mock de imagen base64 (PNG minimo)
      const TINY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

      const updated = await addHousingImages(listing.id, { id: landlord.id, role: 'landlord' }, [TINY_IMAGE]);

      expect(updated.images).toBeDefined();
      expect(Array.isArray(updated.images)).toBe(true);
    });

    it('lanza error 404 si la publicacion no existe', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(
        addHousingImages(fakeId, { id: landlord.id, role: 'landlord' }, ['data:image/png;base64,...'])
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza error 403 si el usuario no es propietario ni admin', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const otherStudent = await createRealUser({ role: 'student' });

      const listing = await createHousing(landlord.id, {
        title: 'Habitacion sin permiso',
        pricePen: 250,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. SinPermiso 123',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      await expect(
        addHousingImages(listing.id, { id: otherStudent.id, role: 'student' }, ['data:image/png;base64,...'])
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza AppError con IMAGE_UPDATE_FAILED si el repositorio falla al guardar las imagenes', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Falla al guardar imagenes',
        pricePen: 250,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. FallaImagen 123',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      const TINY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const originalFn = housingRepo.updateHousingImages;
      housingRepo.updateHousingImages = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      try {
        await expect(
          addHousingImages(listing.id, { id: landlord.id, role: 'landlord' }, [TINY_IMAGE])
        ).rejects.toMatchObject({ statusCode: 400, code: 'IMAGE_UPDATE_FAILED' });
      } finally {
        housingRepo.updateHousingImages = originalFn;
      }
    });

    it('funciona si la publicacion real no tenia images (columna null/undefined)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Sin images previas',
        pricePen: 250,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. SinImages 123',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      const originalFn = housingRepo.findHousingById;
      housingRepo.findHousingById = jest.fn().mockResolvedValue({
        data: { ...listing, images: undefined },
        error: null
      });

      const TINY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

      try {
        const updated = await addHousingImages(listing.id, { id: landlord.id, role: 'landlord' }, [TINY_IMAGE]);
        expect(updated.images).toHaveLength(1);
      } finally {
        housingRepo.findHousingById = originalFn;
      }
    });

    it('permite agregar imagenes como admin', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const admin = await createRealUser({ role: 'admin' });

      const listing = await createHousing(landlord.id, {
        title: 'Habitacion para admin',
        pricePen: 250,
        distanceToUnschMinutes: 10,
        neighborhood: 'San Blas',
        address: 'Jr. Admin 123',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      const TINY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

      const updated = await addHousingImages(listing.id, { id: admin.id, role: 'admin' }, [TINY_IMAGE]);
      expect(updated).toBeDefined();
    });
  });

  describe('deleteHousing', () => {
    it('el propio arrendador elimina su anuncio y el log queda como landlord_activity', async () => {
      const landlord = await createRealUser({ role: 'landlord', name: 'Dueño Real Delete' });
      const listing = await createHousing(landlord.id, {
        title: 'Habitacion a eliminar por su dueño',
        pricePen: 200,
        distanceToUnschMinutes: 8,
        neighborhood: 'San Blas',
        address: 'Jr. Delete Dueño 1',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);

      const updated = await deleteHousing(listing.id, { id: landlord.id, name: landlord.name, role: 'landlord' }, 'rented');
      expect(updated.deleted_at).toBeTruthy();

      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('action', 'Eliminó anuncio');
      expect(logs.some((l) => l.type === 'landlord_activity')).toBe(true);
    });

    it('un admin elimina el anuncio de otro y el log queda como listing, no landlord_activity', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await createHousing(landlord.id, {
        title: 'Habitacion a eliminar por admin',
        pricePen: 200,
        distanceToUnschMinutes: 8,
        neighborhood: 'San Blas',
        address: 'Jr. Delete Admin 1',
        contactPhone: '900000000'
      });
      createdListingIds.push(listing.id);
      const admin = await createRealUser({ role: 'admin', name: 'Admin Real Delete' });

      const updated = await deleteHousing(listing.id, { id: admin.id, name: admin.name, role: 'admin' });
      expect(updated.deleted_at).toBeTruthy();

      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('action', 'Eliminó anuncio');
      expect(logs.some((l) => l.type === 'listing')).toBe(true);
      expect(logs.some((l) => l.type === 'landlord_activity')).toBe(false);
    });
  });
});
