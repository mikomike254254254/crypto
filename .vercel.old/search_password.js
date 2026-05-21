const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\43285410-061b-4816-96ff-0e5f588cc00e\\.system_generated\\logs\\transcript.jsonl';

async function search() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('Searching transcript.jsonl...');
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes('postgresql://') || line.includes('db_pass') || line.includes('database password') || (line.includes('password') && (line.includes('supabase') || line.includes('db') || line.includes('postgres')))) {
      // Print first 300 characters of matching line to avoid massive logs
      console.log(`Line ${lineNum}: ${line.slice(0, 300)}...`);
    }
  }
  console.log('Done searching.');
}

search();
