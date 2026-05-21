const { Client } = require('pg');

async function run() {
  const host = 'aws-0-eu-west-1.pooler.supabase.com';
  const user = 'postgres.nzzstvvbrcdhuiqppdpv';
  const password = 'Mmm@29315122';
  const connectionString = `postgresql://${user}:${password}@${host}:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
    await client.end();
  } catch (err) {
    console.error('Failed to query tables:', err.message || err);
    try { await client.end(); } catch (e) {}
  }
}
run();
