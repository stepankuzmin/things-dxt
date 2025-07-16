/**
 * Helper functions for parsing AppleScript output data
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
          due_date: parts[3] || '',
          status: parts[4] || '',
          creation_date: parts[5] || '',
          modification_date: parts[6] || '',
          completion_date: parts[7] || '',
          project: parts[8] || '',
          area: parts[9] || '',
          tags: parts[10] ? parts[10].split(',') : []
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
          due_date: parts[3] || '',
          status: parts[4] || '',
          creation_date: parts[5] || '',
          area: parts[6] || '',
          todo_count: parseInt(parts[7]) || 0,
          tags: parts[8] ? parts[8].split(',') : []
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
            due_date: parts[4] || '',
            status: parts[5] || '',
            project: parts[6] || '',
            area: parts[7] || ''
          });
        } else if (type === 'project' || parts[0] === 'project') {
          results.push({
            type: 'project',
            id: parts[1] || '',
            name: parts[2] || '',
            notes: parts[3] || '',
            due_date: parts[4] || '',
            status: parts[5] || '',
            area: parts[6] || ''
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