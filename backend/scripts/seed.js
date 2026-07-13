import 'dotenv/config';
import { createUser, createListing, addFavorite, pickRandom, uploadRealListingImages } from './seed-helpers.js';
import { DEMO_ACCOUNTS } from './demo-credentials.js';
import { REAL_LISTINGS } from './real-listings-data.js';

async function seed() {
  console.log('Iniciando seed con las 10 publicaciones reales de Ayacucho (fotos e info de Airbnb)...');

  await createUser({ ...DEMO_ACCOUNTS.admin, role: 'admin', name: 'Admin YachakuqWasi' });
  console.log('Administrador creado.');

  const landlords = [];
  const allListings = [];
  for (const item of REAL_LISTINGS) {
    const landlord = await createUser({
      email: item.email,
      password: 'Demo1234!',
      role: 'landlord',
      name: item.hostFirstName
    });
    landlords.push(landlord);

    const images = await uploadRealListingImages(item.slug, item.folder);
    // priceStayPen es la tarifa turistica total por stayNights noches (Airbnb),
    // no un alquiler mensual: se convierte a precio mensual estimado.
    const pricePenMonthly = Math.round((item.priceStayPen / item.stayNights) * 30);

    const listing = await createListing(landlord.id, {
      title: item.title,
      type: item.type,
      price_pen: pricePenMonthly,
      distance_to_unsch_minutes: item.distanceToUnschMinutes,
      neighborhood: item.neighborhood,
      address: item.address,
      description: item.description,
      contact_phone: item.contactPhone,
      amenities: item.amenities,
      images
    });
    allListings.push(listing);
    console.log(`Publicación creada: "${listing.title}" (${item.hostFirstName}), S/${pricePenMonthly}/mes, ${images.length} fotos.`);
  }
  console.log(`${landlords.length} arrendadores y ${allListings.length} publicaciones reales creadas (aprobadas).`);

  const students = [];
  students.push(await createUser({ ...DEMO_ACCOUNTS.student, role: 'student', name: 'Estudiante Demo' }));
  for (let i = 2; i <= 5; i++) {
    students.push(
      await createUser({
        email: `estudiante${i}@yachakuqwasi.pe`,
        password: 'Demo1234!',
        role: 'student',
        name: `Estudiante Demo ${i}`
      })
    );
  }
  console.log(`${students.length} estudiantes creados.`);

  for (const student of students) {
    const favListings = pickRandom(allListings, Math.min(3, allListings.length));
    for (const listing of favListings) {
      await addFavorite(student.id, listing.id);
    }
  }
  console.log('Favoritos asignados.');

  console.log('\nSeed completado.');
  console.log('Recuerda correr "node scripts/backfill-coordinates.js" para completar coordenadas de mapa.');
  console.log('Cuentas de demostracion:');
  console.table([
    { Rol: 'Estudiante', Email: DEMO_ACCOUNTS.student.email, Contraseña: DEMO_ACCOUNTS.student.password },
    { Rol: 'Arrendador', Email: DEMO_ACCOUNTS.landlord.email, Contraseña: DEMO_ACCOUNTS.landlord.password },
    { Rol: 'Administrador', Email: DEMO_ACCOUNTS.admin.email, Contraseña: DEMO_ACCOUNTS.admin.password }
  ]);
}

seed().catch((err) => {
  console.error('Seed fallo:', err);
  process.exit(1);
});
