/**
 * Data Parser for Things 3 AppleScript Output
 * 
 * This module handles parsing of tab-separated data returned from AppleScript commands.
 * Key features:
 * - Maps internal Things 3 fields to user-friendly response fields
 * - due_date (internal: activation_date) = when scheduled to work on
 * - deadline (internal: due_date) = when actually due
 * - Handles various data types: todos, projects, areas, search results
 * - Robust parsing with fallback values for missing data
 */

export class DataParser {
  
  /**
   * Parse tab-separated todo data from AppleScript output
   */
  static parseTodos(output) {
    const todos = [];
    
    if (!output || !output.trim()) {
      return todos;
    }
    
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split('\t');
        const todo = {
          id: parts[0] || '',
          name: parts[1] || '',
          notes: parts[2] || '',
          deadline: parts[3] || '',  // Internal due_date -> user-friendly deadline
          due_date: parts[4] || '',  // Internal activation_date -> user-friendly due_date
          status: parts[5] || '',
          creation_date: parts[6] || '',
          modification_date: parts[7] || '',
          completion_date: parts[8] || '',
          project: parts[9] || '',
          area: parts[10] || '',
          tags: parts[11] ? parts[11].split(',') : []
        };
        todos.push(todo);
      }
    }
    
    return todos;
  }

  /**
   * Parse tab-separated project data from AppleScript output
   */
  static parseProjects(output) {
    const projects = [];
    
    if (!output || !output.trim()) {
      return projects;
    }
    
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split('\t');
        const project = {
          id: parts[0] || '',
          name: parts[1] || '',
          notes: parts[2] || '',
          deadline: parts[3] || '',        // Internal due_date -> user-friendly deadline
          due_date: parts[4] || '',        // Internal activation_date -> user-friendly due_date
          status: parts[5] || '',
          creation_date: parts[6] || '',
          area: parts[7] || '',
          todo_count: parseInt(parts[8]) || 0,
          tags: parts[9] ? parts[9].split(',') : []
        };
        projects.push(project);
      }
    }
    
    return projects;
  }

  /**
   * Parse tab-separated area data from AppleScript output
   */
  static parseAreas(output) {
    const areas = [];
    
    if (!output || !output.trim()) {
      return areas;
    }
    
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split('\t');
        const area = {
          id: parts[0] || '',
          name: parts[1] || '',
          project_count: parseInt(parts[2]) || 0,
          todo_count: parseInt(parts[3]) || 0,
          tags: parts[4] ? parts[4].split(',') : []
        };
        areas.push(area);
      }
    }
    
    return areas;
  }

  /**
   * Parse search results (todos, projects, areas)
   */
  static parseSearchResults(output, type) {
    const results = [];
    
    if (!output || !output.trim()) {
      return results;
    }
    
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split('\t');
        
        if (type === 'todo' || parts[0] === 'todo') {
          results.push({
            type: 'todo',
            id: parts[1] || '',
            name: parts[2] || '',
            notes: parts[3] || '',
            deadline: parts[4] || '',     // Internal due_date -> user-friendly deadline
            due_date: parts[5] || '',     // Internal activation_date -> user-friendly due_date
            status: parts[6] || '',
            project: parts[7] || '',
            area: parts[8] || ''
          });
        } else if (type === 'project' || parts[0] === 'project') {
          results.push({
            type: 'project',
            id: parts[1] || '',
            name: parts[2] || '',
            notes: parts[3] || '',
            deadline: parts[4] || '',     // Internal due_date -> user-friendly deadline
            due_date: parts[5] || '',     // Internal activation_date -> user-friendly due_date
            status: parts[6] || '',
            area: parts[7] || ''
          });
        } else if (type === 'area' || parts[0] === 'area') {
          results.push({
            type: 'area',
            id: parts[1] || '',
            name: parts[2] || ''
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Create a standardized success response
   */
  static createSuccessResponse(data) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  }
}