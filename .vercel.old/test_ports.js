const { Client } = require('pg');

async function test(port) {
  const host = 'aws-0-eu-west-1.pooler.supabase.com';
  const user = 'postgres.nzzstvvbrcdhuiqppdpv';
  const password = 'Mmm@29315122';
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
  
  console.log(`Probing port ${port} on ${host}...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log(`SUCCESS! Connected on port ${port}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Port ${port} failed:`, err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  await test(5432);
  await test(6543);
}
run();
