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
    console.log('Connected!');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);
    console.log('Columns in public.users:');
    console.log(res.rows);
    await client.end();
  } catch (err) {
    console.error('Failed:', err.message || err);
  }
}
run();
