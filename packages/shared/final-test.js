// Final comprehensive test for @bess-pro/shared package
const shared = require('./dist/index.js');

console.log('🔍 Testing @bess-pro/shared package exports...\n');

// Test 1: Required runtime exports
console.log('1️⃣  Required Runtime Exports:');
const requiredExports = [
  'FINANCIAL_DEFAULTS',
  'objectSnakeToCamel',
  'objectCamelToSnake'
];

let allRequiredAvailable = true;
requiredExports.forEach(name => {
  const available = name in shared;
  const status = available ? '✅' : '❌';
  console.log(`   ${status} ${name}`);
  if (!available) allRequiredAvailable = false;
});

// Test 2: Test function functionality
console.log('\n2️⃣  Function Tests:');
try {
  const testObj = { snake_case_key: 'test_value', another_key: 123 };
  const camelCase = shared.objectSnakeToCamel(testObj);
  const snakeCase = shared.objectCamelToSnake(camelCase);
  
  const functionsWork = camelCase.snakeCaseKey === 'test_value' && 
                       snakeCase.snake_case_key === 'test_value';
  console.log(`   ${functionsWork ? '✅' : '❌'} objectSnakeToCamel/objectCamelToSnake functions`);
} catch (error) {
  console.log(`   ❌ Function test failed: ${error.message}`);
}

// Test 3: Test constants
console.log('\n3️⃣  Constants Test:');
try {
  const defaultsAvailable = shared.FINANCIAL_DEFAULTS && 
                           typeof shared.FINANCIAL_DEFAULTS === 'object' &&
                           shared.FINANCIAL_DEFAULTS.vida_util === 25;
  console.log(`   ${defaultsAvailable ? '✅' : '❌'} FINANCIAL_DEFAULTS constant`);
} catch (error) {
  console.log(`   ❌ Constants test failed: ${error.message}`);
}

// Test 4: All exports summary
console.log('\n4️⃣  All Available Exports:');
const allExports = Object.keys(shared).sort();
console.log(`   Total exports: ${allExports.length}`);
console.log('   Available:', allExports.join(', '));

// Final result
console.log('\n🎯 Final Result:');
if (allRequiredAvailable) {
  console.log('   ✅ All required exports are available!');
  console.log('   ✅ Package is ready for Docker build!');
} else {
  console.log('   ❌ Some required exports are missing!');
  process.exit(1);
}