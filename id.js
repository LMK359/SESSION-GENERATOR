const fs = require('fs');
const { File } = require('megajs');

// Simple short random ID (e.g., for temporary use)
function makeid(num = 4) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Full session ID with prefix
function generateSessionID(length = 48) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#_";
  let session = "";
  for (let i = 0; i < length; i++) {
    session += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LMK~session`;


// Download session file from mega.nz using ID
function downloadSessionFromMega(sessionId) 
  const idOnly = sessionId.replace('LMK ', ”);
  const file = File.fromURL(`https://mega.nz/file/{idOnly}`);

  file.download((err, data) => {
    if (err) return console.error('❌ Download failed:', err);
    fs.mkdirSync('./sessions', { recursive: true });
    fs.writeFileSync('./sessions/creds.json', data);
    console.log('✅ Session downloaded and saved!');
  });
}

// Example usage:
// const sessionId = generateSessionID();
// console.log('Generated ID:', sessionId);
// downloadSessionFromMega(sessionId);

module.exports = {
  makeid,
  generateSessionID,
  downloadSessionFromMega
};
