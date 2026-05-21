const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\43285410-061b-4816-96ff-0e5f588cc00e\\.system_generated\\logs\\transcript.jsonl';

async function printLines() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum >= 3120 && lineNum <= 3140) {
      console.log(`LINE ${lineNum}:`);
      console.log(line);
      console.log('--------------------------------------------------');
    }
  }
}

printLines();
