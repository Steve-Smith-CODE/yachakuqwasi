import 'dotenv/config';
import { createUser, createListing, addFavorite, pickRandom, buildSyntheticListing } from './seed-helpers.js';
import { DEMO_ACCOUNTS } from './demo-credentials.js';

// Mismos barrios que frontend/src/constants/content.js (NEIGHBORHOODS) para
// que los filtros del explorador siempre encuentren resultados.
const NEIGHBORHOODS = ['San Blas', 'Av. Independencia', 'Belén', 'Carmen Alto', 'Santa Ana'];
const TYPES = ['room', 'apartment', 'shared', 'family'];

async function seed() {
  console.log('Iniciando seed con datos sinteticos (no reales, sin scraping)...');

  await createUser({ ...DEMO_ACCOUNTS.admin, role: 'admin', name: 'Admin YachakuqWasi' });
  console.log('Administrador creado.');

  const landlords = [];
  landlords.push(await createUser({ ...DEMO_ACCOUNTS.landlord, role: 'landlord', name: 'Arrendador Demo' }));
  for (let i = 2; i <= 5; i++) {
    landlords.push(
      await createUser({
        email: `arrendador${i}@yachakuqwasi.pe`,
        password: 'Demo1234!',
        role: 'landlord',
        name: `Arrendador Demo ${i}`
      })
    );
  }
  console.log(`${landlords.length} arrendadores creados.`);

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

  const allListings = [];
  for (const landlord of landlords) {
    const numListings = Math.floor(Math.random() * 3) + 2; // 2 a 4
    for (let j = 0; j < numListings; j++) {
      const neighborhood = NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)];
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const listing = await createListing(landlord.id, buildSyntheticListing(neighborhood, type));
      allListings.push(listing);
    }
  }
  console.log(`${allListings.length} publicaciones creadas (todas aprobadas, sin fotos reales).`);

  for (const student of students) {
    const favListings = pickRandom(allListings, Math.min(3, allListings.length));
    for (const listing of favListings) {
      await addFavorite(student.id, listing.id);
    }
  }
  console.log('Favoritos asignados.');

  console.log('\nSeed completado.');
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
