/**
 * Test for tags handling including empty array scenarios
 */

import { strict as assert } from 'assert';
import { ParameterMapper, ParameterBuilder, AppleScriptSanitizer } from '../server/utils.js';
import { AppleScriptTemplates } from '../server/applescript-templates.js';

console.log('Testing tags handling functionality...\n');

// Test 1: updateTodo with empty tags array removes all tags
try {
  const args = {
    id: "test-todo-123",
    tags: []
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
  
  // Should contain the command to set tags to empty
  assert(script.includes('set tag names of targetTodo to {}'));
  // Should be within a try block
  assert(script.includes('try\n          set tag names of targetTodo to {}'));
  
  console.log('✅ updateTodo with empty tags array removes all tags');
} catch (error) {
  console.log('❌ updateTodo empty tags:', error.message);
  process.exit(1);
}

// Test 2: updateTodo with non-empty tags array sets tags
try {
  const args = {
    id: "test-todo-123",
    tags: ["work", "urgent"]
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
  
  // Should contain the command to set tags
  assert(script.includes('set tag names of targetTodo to {"work", "urgent"}'));
  
  console.log('✅ updateTodo with non-empty tags array sets tags');
} catch (error) {
  console.log('❌ updateTodo non-empty tags:', error.message);
  process.exit(1);
}

// Test 3: updateProject with empty tags array removes all tags
try {
  const args = {
    id: "test-project-456",
    tags: []
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
  
  // Should contain the command to set tags to empty
  assert(script.includes('set tag names of targetProject to {}'));
  // Should be within a try block
  assert(script.includes('try\n          set tag names of targetProject to {}'));
  
  console.log('✅ updateProject with empty tags array removes all tags');
} catch (error) {
  console.log('❌ updateProject empty tags:', error.message);
  process.exit(1);
}

// Test 4: updateProject with non-empty tags array sets tags
try {
  const args = {
    id: "test-project-456",
    tags: ["milestone", "q1"]
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
  
  // Should contain the command to set tags
  assert(script.includes('set tag names of targetProject to {"milestone", "q1"}'));
  
  console.log('✅ updateProject with non-empty tags array sets tags');
} catch (error) {
  console.log('❌ updateProject non-empty tags:', error.message);
  process.exit(1);
}

// Test 5: updateTodo without tags parameter doesn't modify tags
try {
  const args = {
    id: "test-todo-123",
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
  
  // Should not contain any tag-related commands
  assert(!script.includes('tag names'));
  
  console.log('✅ updateTodo without tags parameter doesn\'t modify tags');
} catch (error) {
  console.log('❌ updateTodo no tags parameter:', error.message);
  process.exit(1);
}

// Test 6: Invalid tags parameter (non-array) throws error
try {
  const scriptParams = {
    id: "test-todo-123",
    tags: "not-an-array"  // This should cause an error
  };
  
  // This should throw an error
  const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
  
  console.log('❌ updateTodo should throw error for non-array tags');
  process.exit(1);
} catch (error) {
  assert(error.message === 'tags parameter must be an array');
  console.log('✅ updateTodo throws error for non-array tags parameter');
}

// Test 7: Null tags parameter is handled correctly
try {
  const scriptParams = {
    id: "test-todo-123",
    title: "Updated title",
    tags: null
  };
  
  const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
  
  // Should not contain any tag-related commands when tags is null
  assert(!scriptTemplate.includes('tag names'));
  
  console.log('✅ updateTodo handles null tags parameter correctly');
} catch (error) {
  console.log('❌ updateTodo null tags parameter:', error.message);
  process.exit(1);
}

console.log('\n✨ All tags handling tests passed!');