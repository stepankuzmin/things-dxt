/**
 * Test for the AppleScript scheduling fix
 */

import { strict as assert } from 'assert';
import { ParameterMapper, ParameterBuilder, AppleScriptSanitizer } from '../server/utils.js';
import { AppleScriptTemplates } from '../server/applescript-templates.js';

console.log('Testing AppleScript scheduling functionality...\n');

// Test 1: updateTodo with activation date generates correct schedule command
try {
  const args = {
    id: "test-todo-123",
    when: "2025-07-17"
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
  const buildParams = ParameterBuilder.buildParameters(
    scriptParams, 
    scriptParams.tags, 
    scriptParams.due_date, 
    scriptParams.activation_date
  );
  const script = AppleScriptSanitizer.buildScript(scriptTemplate, buildParams);
  
  // Should contain the schedule command
  assert(script.includes('schedule targetTodo for date "July 17, 2025"'));
  // Should use correct object reference syntax
  assert(script.includes('to do id "test-todo-123"'));
  // Should not contain the old invalid property assignment
  assert(!script.includes('set activation date of targetTodo to'));
  
  console.log('✅ updateTodo generates correct schedule command');
} catch (error) {
  console.log('❌ updateTodo schedule command:', error.message);
  process.exit(1);
}

// Test 2: createTodo with activation date generates correct schedule command
try {
  const args = {
    title: "Test scheduled todo",
    when: "2025-07-19"
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const scriptTemplate = AppleScriptTemplates.createTodo(scriptParams);
  const buildParams = ParameterBuilder.buildParameters(
    scriptParams, 
    scriptParams.tags, 
    scriptParams.due_date, 
    scriptParams.activation_date
  );
  const script = AppleScriptSanitizer.buildScript(scriptTemplate, buildParams);
  
  // Should contain the schedule command after creation
  assert(script.includes('schedule newTodo for date "July 19, 2025"'));
  // Should create todo first
  assert(script.includes('make new to do with properties {name: "Test scheduled todo"}'));
  // Should not contain the old invalid property in creation
  assert(!script.includes('activation date: date'));
  
  console.log('✅ createTodo generates correct schedule command');
} catch (error) {
  console.log('❌ createTodo schedule command:', error.message);
  process.exit(1);
}

// Test 3: updateProject with activation date generates correct schedule command
try {
  const args = {
    id: "test-project-456",
    when: "2025-07-20"
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const scriptTemplate = AppleScriptTemplates.updateProject(scriptParams);
  const buildParams = ParameterBuilder.buildParameters(
    scriptParams, 
    scriptParams.tags, 
    scriptParams.due_date, 
    scriptParams.activation_date
  );
  const script = AppleScriptSanitizer.buildScript(scriptTemplate, buildParams);
  
  // Should contain the schedule command for project
  assert(script.includes('schedule targetProject for date "July 20, 2025"'));
  // Should use correct object reference syntax
  assert(script.includes('project id "test-project-456"'));
  // Should not contain the old invalid property assignment
  assert(!script.includes('set activation date of targetProject to'));
  
  console.log('✅ updateProject generates correct schedule command');
} catch (error) {
  console.log('❌ updateProject schedule command:', error.message);
  process.exit(1);
}

// Test 4: Templates work without activation date
try {
  const args = {
    id: "test-todo-789",
    title: "Updated title"
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
  const buildParams = ParameterBuilder.buildParameters(
    scriptParams, 
    scriptParams.tags, 
    scriptParams.due_date, 
    scriptParams.activation_date
  );
  const script = AppleScriptSanitizer.buildScript(scriptTemplate, buildParams);
  
  // Should not contain schedule command when no activation date
  assert(!script.includes('schedule'));
  // Should contain title update
  assert(script.includes('set name of targetTodo to "Updated title"'));
  
  console.log('✅ Templates work correctly without activation date');
} catch (error) {
  console.log('❌ Templates without activation date:', error.message);
  process.exit(1);
}

console.log('\n✨ All AppleScript scheduling tests passed!');