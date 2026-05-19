const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  // Let's try direct connection hostname first, then pooler with correct user format
  const connectionStrings = [
    "postgresql://postgres:wallex-admin@db.nzzstvvbrcdhuiqppdpv.supabase.co:5432/postgres",
    "postgresql://postgres.nzzstvvbrcdhuiqppdpv:wallex-admin@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:wallex-admin@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  ];
  
  const schemaPath = path.join(__dirname, '../supabase/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  for (const connectionString of connectionStrings) {
    console.log('Trying connection string:', connectionString.replace(/:[^:]+@/, ':****@'));
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('Connected successfully! Running schema.sql...');
      await client.query(sql);
      console.log('schema.sql executed successfully! All tables, triggers, and functions created.');
      await client.end();
      return; // success!
    } catch (err) {
      console.error('Connection failed:', err.message || err);
      try { await client.end(); } catch (e) {}
    }
  }
}
run();
