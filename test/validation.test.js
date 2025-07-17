/**
 * Unit tests for input validation
 */

import { strict as assert } from 'assert';
import { ThingsValidator } from '../server/utils.js';

console.log('Testing ThingsValidator...\n');

// Test 1: Valid string input
try {
  const result = ThingsValidator.validateStringInput('Test task', 'name');
  assert.equal(result, 'Test task');
  console.log('✅ Valid string input');
} catch (error) {
  console.log('❌ Valid string input:', error.message);
  process.exit(1);
}

// Test 2: String with quotes and apostrophes
try {
  const result1 = ThingsValidator.validateStringInput('Review "Clean Code" book', 'name');
  assert.equal(result1, 'Review "Clean Code" book');
  
  const result2 = ThingsValidator.validateStringInput("Mom's birthday", 'name');
  assert.equal(result2, "Mom's birthday");
  
  console.log('✅ Allows quotes and apostrophes');
} catch (error) {
  console.log('❌ Allows quotes and apostrophes:', error.message);
  process.exit(1);
}

// Test 3: Rejects dangerous patterns
try {
  ThingsValidator.validateStringInput('tell application "Finder"', 'name');
  console.log('❌ Should reject dangerous patterns');
  process.exit(1);
} catch (error) {
  if (error.message.includes('dangerous script patterns')) {
    console.log('✅ Rejects dangerous patterns');
  } else {
    console.log('❌ Wrong error for dangerous patterns:', error.message);
    process.exit(1);
  }
}

// Test 4: Valid date format
try {
  const result = ThingsValidator.validateDateInput('2024-12-25', 'due_date');
  assert.equal(result, '2024-12-25');
  console.log('✅ Valid date format');
} catch (error) {
  console.log('❌ Valid date format:', error.message);
  process.exit(1);
}

// Test 5: Invalid date format
try {
  ThingsValidator.validateDateInput('12/25/2024', 'due_date');
  console.log('❌ Should reject invalid date format');
  process.exit(1);
} catch (error) {
  if (error.message.includes('YYYY-MM-DD format')) {
    console.log('✅ Rejects invalid date format');
  } else {
    console.log('❌ Wrong error for invalid date format:', error.message);
    process.exit(1);
  }
}

// Test 6: Array validation
try {
  const result = ThingsValidator.validateArrayInput(['tag1', 'tag2'], 'tags');
  assert.deepEqual(result, ['tag1', 'tag2']);
  console.log('✅ Valid array input');
} catch (error) {
  console.log('❌ Valid array input:', error.message);
  process.exit(1);
}

// Test 7: Number validation
try {
  const result = ThingsValidator.validateNumberInput(7, 'days');
  assert.equal(result, 7);
  console.log('✅ Valid number input');
} catch (error) {
  console.log('❌ Valid number input:', error.message);
  process.exit(1);
}

console.log('\n✨ All validation tests passed!');