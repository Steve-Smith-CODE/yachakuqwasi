import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

// Utilidad de un solo uso: remapea el campo `neighborhood` de las
// publicaciones existentes, que usaba barrios tradicionales de Ayacucho
// (San Blas, Belen, etc.), hacia los distritos oficiales de la provincia
// de Huamanga. Los distritos son un nombre de ubicacion mas reconocible
// para el usuario que un barrio informal. Mapeo geografico aproximado.
const BARRIO_TO_DISTRICT = {
  'San Blas': 'Ayacucho',
  'Av. Independencia': 'Ayacucho',
  Belén: 'San Juan Bautista',
  'Carmen Alto': 'Carmen Alto',
  'Santa Ana': 'Jesús Nazareno'
};

async function run() {
  const { data: listings, error } = await supabaseAdmin.from('housing_listings').select('id, title, neighborhood');

  if (error) {
    console.error('Error consultando publicaciones:', error.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;

  for (const listing of listings) {
    const district = BARRIO_TO_DISTRICT[listing.neighborhood];
    if (!district) {
      console.log(`Sin mapeo conocido, se omite: "${listing.title}" (${listing.neighborhood})`);
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from('housing_listings')
      .update({ neighborhood: district })
      .eq('id', listing.id);

    if (updateError) {
      console.log(`Error guardando "${listing.title}": ${updateError.message}`);
      skipped += 1;
    } else {
      console.log(`OK: "${listing.title}" -> ${listing.neighborhood} => ${district}`);
      updated += 1;
    }
  }

  console.log(`\nCompletado. ${updated} actualizadas, ${skipped} omitidas.`);
}

run().catch((err) => {
  console.error('Fallo el remapeo:', err.message);
  process.exit(1);
});
