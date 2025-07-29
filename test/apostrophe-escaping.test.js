/**
 * Test apostrophe escaping in AppleScript templates
 * 
 * This test verifies that apostrophes in user input are properly escaped
 * when generating AppleScript commands.
 */

import { strict as assert } from 'assert';
import { AppleScriptSanitizer } from '../server/utils.js';

console.log('Testing Apostrophe Escaping...\n');

// Test 1: Basic apostrophe escaping
try {
  const result = AppleScriptSanitizer.sanitizeString("Matt's iPhone");
  assert.equal(result, "Matt'\"'\"'s iPhone");
  console.log('✅ Basic apostrophe escaping');
} catch (error) {
  console.log('❌ Basic apostrophe escaping:', error.message);
  process.exit(1);
}

// Test 2: Multiple apostrophes
try {
  const result = AppleScriptSanitizer.sanitizeString("Matt's wife's birthday");
  assert.equal(result, "Matt'\"'\"'s wife'\"'\"'s birthday");
  console.log('✅ Multiple apostrophes');
} catch (error) {
  console.log('❌ Multiple apostrophes:', error.message);
  process.exit(1);
}

// Test 3: Mixed quotes and apostrophes
try {
  const result = AppleScriptSanitizer.sanitizeString('Read "Matt\'s Book"');
  assert.equal(result, 'Read \\"Matt\'"\'"\'s Book\\"');
  console.log('✅ Mixed quotes and apostrophes');
} catch (error) {
  console.log('❌ Mixed quotes and apostrophes:', error.message);
  process.exit(1);
}

// Test 4: Build script with apostrophes
try {
  const template = 'make new to do with properties {name: "{{todo_name}}"}';
  const params = { todo_name: "Matt's Task" };
  const result = AppleScriptSanitizer.buildScript(template, params);
  assert.equal(result, 'make new to do with properties {name: "Matt\'"\'"\'s Task"}');
  console.log('✅ Build script with apostrophes');
} catch (error) {
  console.log('❌ Build script with apostrophes:', error.message);
  process.exit(1);
}

// Test 5: Array of todos with apostrophes
try {
  const todos = ["Matt's iPhone", "Sarah's iPad", "Company's policy"];
  const template = todos.map((_, i) => `make new to do with properties {name: "{{todo_${i}}}"}`).join('\n');
  const params = {};
  todos.forEach((todo, i) => {
    params[`todo_${i}`] = todo;
  });
  
  const result = AppleScriptSanitizer.buildScript(template, params);
  assert(result.includes('Matt\'"\'"\'s iPhone'));
  assert(result.includes('Sarah\'"\'"\'s iPad'));
  assert(result.includes('Company\'"\'"\'s policy'));
  console.log('✅ Array of todos with apostrophes');
} catch (error) {
  console.log('❌ Array of todos with apostrophes:', error.message);
  process.exit(1);
}

// Test 6: Shell command escaping doesn't interfere
try {
  // Simulate the shell escaping that executeAppleScript does
  const script = 'tell application "Things3" to make new to do with properties {name: "Matt\'"\'"\'s iPhone"}';
  const shellEscaped = script.replace(/"/g, '\\"');
  const command = `osascript -e "${shellEscaped}"`;
  
  // Should have the escaped quotes but preserve apostrophe escaping
  assert(command.includes('"Matt'));
  assert(command.includes('s iPhone\\"'));
  // Should not have the old double escaping pattern
  assert(!command.includes('"\'"\'"\'"\'"\''));
  console.log('✅ Shell command escaping compatibility');
} catch (error) {
  console.log('❌ Shell command escaping compatibility:', error.message);
  process.exit(1);
}

console.log('\n✨ All apostrophe escaping tests passed!');