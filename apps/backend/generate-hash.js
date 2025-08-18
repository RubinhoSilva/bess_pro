const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('New Hash:', hash);

// Test verification
const isValid = bcrypt.compareSync(password, hash);
console.log('Verification works:', isValid);

// Also test some known hashes
const testHashes = [
  '$2a$12$LQv3c1yqBWVHxkd0LQ.vCuhtjb7bPUv6YF2w0cLyf1B7V8J8iV.MS', // Should be 123
  '$2a$12$d3nj5.1YHJOzLDpfLdZJdOqKd9/fV2yNyOVzrM2CJ0A5s8HPk/Tqu' // Should be 123456
];

testHashes.forEach((testHash, i) => {
  console.log(`\nTest Hash ${i+1}:`);
  console.log('Hash:', testHash);
  console.log('Valid with "123":', bcrypt.compareSync('123', testHash));
  console.log('Valid with "123456":', bcrypt.compareSync('123456', testHash));
  console.log('Valid with "admin123":', bcrypt.compareSync('admin123', testHash));
});