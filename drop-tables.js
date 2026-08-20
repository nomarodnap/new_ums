const postgres = require("postgres");
require("dotenv").config();

const sql = postgres(process.env.DATABASE_URL);

async function dropTables() {
  const tables = [
    "utility_bills",
    "audits",
    "budgets",
    "departments",
    "bills",
    "utility_types",
    "session",
    "account",
    "verification",
    "user",
  ];

  for (const table of tables) {
    try {
      await sql.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.error(`Error dropping ${table}: ${e.message}`);
    }
  }

  // also drop the drizzle migrations table
  try {
    await sql.unsafe(`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`);
    console.log(`Dropped __drizzle_migrations`);
  } catch (e) {}

  process.exit(0);
}

dropTables();
