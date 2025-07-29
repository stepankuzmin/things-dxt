/**
 * Test area_id support in AppleScript templates
 * 
 * This test verifies that area_id parameter is properly used
 * when creating projects and todos.
 */

import { strict as assert } from 'assert';
import { AppleScriptTemplates } from '../server/applescript-templates.js';
import { AppleScriptSanitizer } from '../server/utils.js';

console.log('Testing Area ID Support...\n');

// Test 1: Create project with area_id
try {
  const params = {
    name: 'Test Project',
    area_id: '4MvDtua4a4h2a9fwSQLfX2'
  };
  
  const template = AppleScriptTemplates.createProject(params);
  const script = AppleScriptSanitizer.buildScript(template, params);
  
  // Verify the script uses area id syntax
  assert(script.includes('set targetArea to area id "4MvDtua4a4h2a9fwSQLfX2"'));
  assert(script.includes('move newProject to targetArea'));
  console.log('✅ Create project with area_id');
} catch (error) {
  console.log('❌ Create project with area_id:', error.message);
  process.exit(1);
}

// Test 2: Create project with area name (backward compatibility)
try {
  const params = {
    name: 'Test Project',
    area: 'Work'
  };
  
  const template = AppleScriptTemplates.createProject(params);
  const script = AppleScriptSanitizer.buildScript(template, params);
  
  // Verify the script uses area name syntax
  assert(script.includes('set targetArea to first area whose name is "Work"'));
  assert(script.includes('move newProject to targetArea'));
  console.log('✅ Create project with area name');
} catch (error) {
  console.log('❌ Create project with area name:', error.message);
  process.exit(1);
}

// Test 3: Create todo with area_id
try {
  const params = {
    name: 'Test Todo',
    area_id: '4MvDtua4a4h2a9fwSQLfX2'
  };
  
  const template = AppleScriptTemplates.createTodo(params);
  const script = AppleScriptSanitizer.buildScript(template, params);
  
  // Verify the script uses area id syntax
  assert(script.includes('set targetArea to area id "4MvDtua4a4h2a9fwSQLfX2"'));
  assert(script.includes('move newTodo to targetArea'));
  console.log('✅ Create todo with area_id');
} catch (error) {
  console.log('❌ Create todo with area_id:', error.message);
  process.exit(1);
}

// Test 4: Create todo with list_id
try {
  const params = {
    name: 'Test Todo',
    list_id: 'project-123'
  };
  
  const template = AppleScriptTemplates.createTodo(params);
  const script = AppleScriptSanitizer.buildScript(template, params);
  
  // Verify the script uses project id syntax
  assert(script.includes('set targetProject to project id "project-123"'));
  assert(script.includes('move newTodo to targetProject'));
  console.log('✅ Create todo with list_id');
} catch (error) {
  console.log('❌ Create todo with list_id:', error.message);
  process.exit(1);
}

// Test 5: Priority handling - list_id > project > area_id > area
try {
  const params = {
    name: 'Test Todo',
    list_id: 'project-123',
    project: 'Project Name',
    area_id: 'area-456',
    area: 'Area Name'
  };
  
  const template = AppleScriptTemplates.createTodo(params);
  const script = AppleScriptSanitizer.buildScript(template, params);
  
  // Verify list_id takes priority
  assert(script.includes('set targetProject to project id "project-123"'));
  assert(!script.includes('first project whose name'));
  assert(!script.includes('area id'));
  assert(!script.includes('first area whose name'));
  console.log('✅ Priority handling for location parameters');
} catch (error) {
  console.log('❌ Priority handling:', error.message);
  process.exit(1);
}

console.log('\n✨ All area ID support tests passed!');