/**
 * Unit tests for data parsing
 */

import { strict as assert } from 'assert';
import { DataParser } from '../server/data-parser.js';

console.log('Testing DataParser...\n');

// Test 1: Parse single todo
try {
  const output = 'todo-123\tBuy groceries\tGet milk and bread\t2024-12-31\t2024-12-25\topen\t2024-12-01\t2024-12-02\t\tShopping\tPersonal\turgent,shopping';
  
  const result = DataParser.parseTodos(output);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'todo-123');
  assert.equal(result[0].name, 'Buy groceries');
  assert.equal(result[0].notes, 'Get milk and bread');
  assert.equal(result[0].deadline, '2024-12-31');
  assert.equal(result[0].due_date, '2024-12-25');
  assert.equal(result[0].status, 'open');
  assert.equal(result[0].project, 'Shopping');
  assert.equal(result[0].area, 'Personal');
  assert.deepEqual(result[0].tags, ['urgent', 'shopping']);
  console.log('✅ Parse single todo');
} catch (error) {
  console.log('❌ Parse single todo:', error.message);
  process.exit(1);
}

// Test 2: Handle empty output
try {
  const result = DataParser.parseTodos('');
  assert.deepEqual(result, []);
  console.log('✅ Handle empty output');
} catch (error) {
  console.log('❌ Handle empty output:', error.message);
  process.exit(1);
}

// Test 3: Handle missing fields
try {
  const output = 'todo-456\tSimple task\t\t\t\topen\t\t\t\t\t\t';
  
  const result = DataParser.parseTodos(output);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'todo-456');
  assert.equal(result[0].name, 'Simple task');
  assert.equal(result[0].notes, '');
  assert.equal(result[0].deadline, '');
  assert.equal(result[0].due_date, '');
  assert.equal(result[0].status, 'open');
  assert.deepEqual(result[0].tags, []);
  console.log('✅ Handle missing fields');
} catch (error) {
  console.log('❌ Handle missing fields:', error.message);
  process.exit(1);
}

// Test 4: Parse project
try {
  const output = 'project-789\tWebsite Redesign\tComplete redesign by Q1\t2024-03-31\t2024-01-15\topen\t2024-01-01\tWork\t15\tdesign,priority';
  
  const result = DataParser.parseProjects(output);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'project-789');
  assert.equal(result[0].name, 'Website Redesign');
  assert.equal(result[0].notes, 'Complete redesign by Q1');
  assert.equal(result[0].deadline, '2024-03-31');
  assert.equal(result[0].due_date, '2024-01-15');
  assert.equal(result[0].area, 'Work');
  assert.equal(result[0].todo_count, 15);
  assert.deepEqual(result[0].tags, ['design', 'priority']);
  console.log('✅ Parse project');
} catch (error) {
  console.log('❌ Parse project:', error.message);
  process.exit(1);
}

// Test 5: Parse area
try {
  const output = 'area-101\tWork\t5\t25\tprofessional,active';
  
  const result = DataParser.parseAreas(output);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'area-101');
  assert.equal(result[0].name, 'Work');
  assert.equal(result[0].project_count, 5);
  assert.equal(result[0].todo_count, 25);
  assert.deepEqual(result[0].tags, ['professional', 'active']);
  console.log('✅ Parse area');
} catch (error) {
  console.log('❌ Parse area:', error.message);
  process.exit(1);
}

// Test 6: Parse search results
try {
  const output = 'todo\ttodo-111\tSearch result 1\tNotes here\t2024-12-31\t2024-12-25\topen\tProject A\tArea B\nproject\tproject-222\tSearch result 2\tProject notes\t2024-06-30\t2024-04-01\topen\tArea C';
  
  const result = DataParser.parseSearchResults(output);
  assert.equal(result.length, 2);
  assert.equal(result[0].type, 'todo');
  assert.equal(result[0].name, 'Search result 1');
  assert.equal(result[1].type, 'project');
  assert.equal(result[1].name, 'Search result 2');
  console.log('✅ Parse search results');
} catch (error) {
  console.log('❌ Parse search results:', error.message);
  process.exit(1);
}

// Test 7: Create success response
try {
  const data = { success: true, message: 'Operation completed' };
  const result = DataParser.createSuccessResponse(data);
  
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  assert.equal(result.content[0].text, JSON.stringify(data));
  console.log('✅ Create success response');
} catch (error) {
  console.log('❌ Create success response:', error.message);
  process.exit(1);
}

console.log('\n✨ All data parser tests passed!');