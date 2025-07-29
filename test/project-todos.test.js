/**
 * Test for project todos functionality
 */

import { strict as assert } from 'assert';
import { AppleScriptTemplates } from '../server/applescript-templates.js';
import { ParameterBuilder } from '../server/utils.js';

console.log("Testing project todos functionality...\n");

function testCreateProjectWithTodos() {
  console.log("✅ createProject generates todos correctly");
  
  const params = {
    name: "Road Trip Todo List",
    notes: "Complete all tasks before the road trip",
    todos: ["Pack snacks", "Get gas", "Check tires"]
  };
  
  // Build parameters with todos
  const buildParams = ParameterBuilder.buildParameters(params, null, null, null);
  
  // Verify todo parameters are created
  assert.equal(buildParams.todo_0, "Pack snacks");
  assert.equal(buildParams.todo_1, "Get gas");
  assert.equal(buildParams.todo_2, "Check tires");
  
  // Generate the AppleScript
  const script = AppleScriptTemplates.createProject(params);
  
  // Verify the script contains todo creation commands
  assert(script.includes('make new to do with properties {name: "{{todo_0}}", project: newProject}'));
  assert(script.includes('make new to do with properties {name: "{{todo_1}}", project: newProject}'));
  assert(script.includes('make new to do with properties {name: "{{todo_2}}", project: newProject}'));
  assert(script.includes('-- Create todos for the project'));
}

function testCreateProjectWithoutTodos() {
  console.log("✅ createProject works without todos parameter");
  
  const params = {
    name: "Simple Project",
    notes: "A project without todos"
  };
  
  const script = AppleScriptTemplates.createProject(params);
  
  // Verify the script doesn't contain todo creation commands
  assert(!script.includes('-- Create todos for the project'));
  assert(!script.includes('make new to do'));
}

function testCreateProjectWithEmptyTodos() {
  console.log("✅ createProject handles empty todos array");
  
  const params = {
    name: "Project with Empty Todos",
    todos: []
  };
  
  const script = AppleScriptTemplates.createProject(params);
  
  // Verify the script doesn't contain todo creation commands for empty array
  assert(!script.includes('-- Create todos for the project'));
  assert(!script.includes('make new to do'));
}

// Run tests
try {
  testCreateProjectWithTodos();
  testCreateProjectWithoutTodos();
  testCreateProjectWithEmptyTodos();
  
  console.log("\n✨ All project todos tests passed!");
} catch (error) {
  console.error("\n❌ Test failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}