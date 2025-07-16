/**
 * Centralized AppleScript templates for Things 3 integration
 */

export class AppleScriptTemplates {
  
  /**
   * Check if Things 3 is running
   */
  static isThingsRunning() {
    return `tell application "System Events" to (name of processes) contains "Things3"`;
  }

  /**
   * Create a new to-do item
   */
  static createTodo({ name, notes, due_date, project, area, tags }) {
    let script = `tell application "Things3"
      set newTodo to make new to do with properties {name: "{{name}}"`;
    
    if (notes) {
      script += `, notes: "{{notes}}"`;
    }
    
    if (due_date) {
      // Convert YYYY-MM-DD to AppleScript-friendly format
      script += `, due date: date "{{due_date_formatted}}"`;
    }
    
    script += `}`;
    
    if (project) {
      script += `
      try
        set targetProject to first project whose name is "{{project}}"
        move newTodo to targetProject
      on error
        -- Project not found, leave todo in inbox
      end try`;
    } else if (area) {
      script += `
      try
        set targetArea to first area whose name is "{{area}}"
        move newTodo to targetArea
      on error
        -- Area not found, leave todo in inbox
      end try`;
    }
    
    if (tags && tags.length > 0) {
      // Build tag list with sanitized tag names (handled by AppleScriptSanitizer)
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newTodo to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    script += `
      return id of newTodo
    end tell`;
    
    return script;
  }

  /**
   * Create a new project
   */
  static createProject({ name, notes, area, due_date, tags }) {
    let script = `tell application "Things3"
      set newProject to make new project with properties {name: "{{name}}"`;
    
    if (notes) {
      script += `, notes: "{{notes}}"`;
    }
    
    if (due_date) {
      // Convert YYYY-MM-DD to AppleScript-friendly format
      script += `, due date: date "{{due_date_formatted}}"`;
    }
    
    script += `}`;
    
    if (area) {
      script += `
      try
        set targetArea to first area whose name is "{{area}}"
        move newProject to targetArea
      on error
        -- Area not found, leave project without area assignment
      end try`;
    }
    
    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newProject to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    script += `
      return id of newProject
    end tell`;
    
    return script;
  }

  /**
   * Create a new area
   */
  static createArea({ name, tags }) {
    let script = `tell application "Things3"
      set newArea to make new area with properties {name: "{{name}}"}`;
    
    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newArea to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    script += `
      return id of newArea
    end tell`;
    
    return script;
  }

  /**
   * Get todos from a specific list
   */
  static getTodos(listName, includeCompleted = false) {
    const completedFilter = includeCompleted ? '' : ' whose status is not completed';
    
    return `tell application "Things3"
      set todoList to to dos of list "${listName}"${completedFilter}
      set output to ""
      repeat with t in todoList
        set output to output & (id of t) & tab & (name of t) & tab
        
        -- Get notes (handle missing value)
        try
          set output to output & (notes of t) & tab
        on error
          set output to output & tab
        end try
        
        -- Get due date (handle missing value)
        try
          set output to output & (due date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get status
        set output to output & (status of t as string) & tab
        
        -- Get creation date
        try
          set output to output & (creation date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get modification date
        try
          set output to output & (modification date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get completion date
        try
          set output to output & (completion date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get project name
        try
          set parentProject to project of t
          if parentProject is not missing value then
            set output to output & (name of parentProject) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get area name
        try
          set parentArea to area of t
          if parentArea is not missing value then
            set output to output & (name of parentArea) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get tags (as comma-separated string)
        try
          set tagList to tag names of t
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Get projects
   */
  static getProjects(area = null, includeCompleted = false) {
    let script;
    
    if (area && !includeCompleted) {
      // Need to filter both by area and completion status
      script = `tell application "Things3"
        try
          set targetArea to area "${area}"
          set allProjects to projects of targetArea
          set projectList to {}
          repeat with p in allProjects
            if status of p is not completed then
              set end of projectList to p
            end if
          end repeat
        on error
          set projectList to {}
        end try`;
    } else if (area) {
      // Filter by area only
      script = `tell application "Things3"
        try
          set targetArea to area "${area}"
          set projectList to projects of targetArea
        on error
          set projectList to {}
        end try`;
    } else if (!includeCompleted) {
      // Filter by completion status only
      script = `tell application "Things3"
        set projectList to projects whose status is not completed`;
    } else {
      // No filtering
      script = `tell application "Things3"
        set projectList to projects`;
    }
    
    script += `
      set output to ""
      repeat with p in projectList
        set output to output & (id of p) & tab & (name of p) & tab
        
        try
          set output to output & (notes of p) & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (due date of p as string) & tab
        on error
          set output to output & tab
        end try
        
        set output to output & (status of p as string) & tab
        
        try
          set output to output & (creation date of p as string) & tab
        on error
          set output to output & tab
        end try
        
        try
          set parentArea to area of p
          if parentArea is not missing value then
            set output to output & (name of parentArea) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        try
          set todoCount to count of to dos of p
          set output to output & todoCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        try
          set tagList to tag names of p
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
    
    return script;
  }

  /**
   * Get areas
   */
  static getAreas() {
    return `tell application "Things3"
      set areaList to areas
      set output to ""
      repeat with a in areaList
        set output to output & (id of a) & tab & (name of a) & tab
        
        try
          set projectCount to count of projects of a
          set output to output & projectCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        try
          set todoCount to count of to dos of a
          set output to output & todoCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        try
          set tagList to tag names of a
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Complete a todo by name
   */
  static completeTodo(name) {
    return `tell application "Things3"
      try
        set targetTodo to first to do whose name is "{{name}}"
        set status of targetTodo to completed
        return "completed"
      on error
        return "not_found"
      end try
    end tell`;
  }

  /**
   * Search for todos
   */
  static searchTodos(query) {
    return `tell application "Things3"
      set foundTodos to to dos whose name contains "{{query}}"
      set output to ""
      repeat with t in foundTodos
        set output to output & "todo" & tab & (id of t) & tab & (name of t) & tab
        
        try
          set output to output & (notes of t) & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (due date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        set output to output & (status of t as string) & tab
        
        try
          set parentProject to project of t
          if parentProject is not missing value then
            set output to output & (name of parentProject) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        try
          set parentArea to area of t
          if parentArea is not missing value then
            set output to output & (name of parentArea)
          else
            set output to output & ""
          end if
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Search for projects
   */
  static searchProjects(query) {
    return `tell application "Things3"
      set foundProjects to projects whose name contains "{{query}}"
      set output to ""
      repeat with p in foundProjects
        set output to output & "project" & tab & (id of p) & tab & (name of p) & tab
        
        try
          set output to output & (notes of p) & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (due date of p as string) & tab
        on error
          set output to output & tab
        end try
        
        set output to output & (status of p as string) & tab
        
        try
          set parentArea to area of p
          if parentArea is not missing value then
            set output to output & (name of parentArea)
          else
            set output to output & ""
          end if
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Search for areas
   */
  static searchAreas(query) {
    return `tell application "Things3"
      set foundAreas to areas whose name contains "{{query}}"
      set output to ""
      repeat with a in foundAreas
        set output to output & "area" & tab & (id of a) & tab & (name of a) & linefeed
      end repeat
      return output
    end tell`;
  }
}