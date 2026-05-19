const dns = require('dns').promises;
const { Client } = require('pg');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const user = `postgres.nzzstvvbrcdhuiqppdpv`;
  const connectionString = `postgresql://${user}:wallex-admin@${host}:6543/postgres`;
  
  try {
    // First try DNS lookup
    await dns.lookup(host);
    console.log(`Region ${region}: DNS resolved! Trying DB connection...`);
    
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    await client.connect();
    console.log(`SUCCESS! Connected to region: ${region}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Region ${region} failed:`, err.message || err);
    return false;
  }
}

async function run() {
  console.log('Probing regions to find the correct Supabase pooler region...');
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      console.log(`Found correct region: ${region}`);
      break;
    }
  }
}
run();
