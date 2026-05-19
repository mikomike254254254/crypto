const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/user/OneDrive/Desktop/crypto wallex.online/crypto-main/.env.local' });

async function run() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing URL or service role key in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  
  console.log('Testing connection to Supabase:', url);
  try {
    const { data: users, error } = await supabase.from('users').select('id, wallet, email, kyc_status').limit(5);
    if (error) throw error;
    console.log('Connection successful! Found users count:', users.length);
    console.log('Users sample:', users);
    
    // Check tables in db
    const { data: tables, error: tableErr } = await supabase.rpc('get_tables');
    console.log('Available tables loaded (if RPC exists):', tables || 'No get_tables RPC');
    
    // Let's query kyc_submissions table
    const { data: kyc, error: kycErr } = await supabase.from('kyc_submissions').select('count').limit(1);
    console.log('kyc_submissions check:', kycErr ? kycErr.message : 'Table exists');
    
    // Check storage bucket
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    console.log('Storage buckets:', bucketErr ? bucketErr.message : buckets);
  } catch (err) {
    console.error('Error connecting to Supabase database:', err);
  }
}
run();
