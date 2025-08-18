const bcrypt = require('bcryptjs');

// Passwords to test
const passwords = ['admin123', '123456', 'admin', 'password'];

// Generate fresh hashes
console.log('=== GENERATING FRESH HASHES ===');
passwords.forEach(pwd => {
  const hash = bcrypt.hashSync(pwd, 12);
  console.log(`Password: "${pwd}"`);
  console.log(`Hash: ${hash}`);
  console.log(`Verification: ${bcrypt.compareSync(pwd, hash)}\n`);
});

// Test the current hash in database
const currentHash = '$2a$12$/CW.qLpf4zVkbP2uZUeIluLvzhKPz7jJcBdruHZ/58fmpfjCwa7OG';
console.log('=== TESTING CURRENT DATABASE HASH ===');
console.log(`Current hash: ${currentHash}`);
passwords.forEach(pwd => {
  console.log(`"${pwd}" -> ${bcrypt.compareSync(pwd, currentHash)}`);
});

// Generate a simple hash for "admin123"
console.log('\n=== RECOMMENDED HASH FOR admin123 ===');
const newHash = bcrypt.hashSync('admin123', 12);
console.log(`New hash: ${newHash}`);
console.log(`Verification: ${bcrypt.compareSync('admin123', newHash)}`);