import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

// Utilidad de un solo uso: aplica database/schema.sql (y opcionalmente
// database/maintenance.sql) directamente por conexion Postgres, para
// proyectos Supabase nuevos donde no se quiere copiar/pegar en el SQL Editor.
// Requiere SUPABASE_DB_URL en el .env que se cargue (connection string
// "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres").

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Uso: node scripts/apply-schema.js database/schema.sql [database/maintenance.sql ...]');
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('Falta SUPABASE_DB_URL en el .env cargado.');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.resolve(file), 'utf-8');
    console.log(`Aplicando ${file}...`);
    await client.query(sql);
    console.log(`OK: ${file}`);
  }
  await client.end();
}

run().catch((err) => {
  console.error('Fallo aplicando SQL:', err.message);
  process.exit(1);
});
