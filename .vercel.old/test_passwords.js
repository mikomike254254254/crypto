const { Client } = require('pg');

const host = "aws-0-eu-west-1.pooler.supabase.com";
const user = "postgres.nzzstvvbrcdhuiqppdpv";

const passwords = [
  "wallex-admin-a0eef92d4f9b4f10b16b931b",
  "KzgtTHDVxnk8WfrUuM41aohvAC9cbPQZLiFR0XYwqdG6NeEj",
  "wallex-admin",
  "wallex-online",
  "wallex-db-pass",
  "wallexcrypto",
  "wallex-password",
  "postgres",
  "nzzstvvbrcdhuiqppdpv"
];

async function testPassword(password) {
  const connectionString = `postgresql://${user}:${password}@${host}:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS! Connected with password: ${password}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Password "${password}" failed:`, err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  console.log('Testing password candidates for Supabase DB in eu-west-1...');
  for (const password of passwords) {
    const success = await testPassword(password);
    if (success) {
      console.log('Found the correct database password!');
      break;
    }
  }
}
run();
