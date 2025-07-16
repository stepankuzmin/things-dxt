# Things DXT - Claude Desktop Extension

A comprehensive Claude Desktop Extension that provides seamless integration with Things 3, the award-winning personal task manager for macOS. This extension allows you to create, manage, organize, search, and maintain your entire task workflow directly from Claude conversations using robust AppleScript automation.

## Features

- **Complete Task Lifecycle**: Create, read, update, complete, cancel, and delete tasks
- **Project Management**: Full project creation, management, and organization
- **Area Organization**: Create and manage high-level organizational areas
- **Advanced Search**: Powerful search across all your Things data with filtering
- **Flexible Retrieval**: Get tasks by list type, status, timeframe, and more
- **Update Operations**: Modify existing tasks with full parameter control
- **Status Management**: Complete, cancel, or delete items as needed
- **Upcoming Tasks**: Time-based task retrieval for planning
- **Data Integrity**: Comprehensive input validation and error handling
- **Security**: Built-in AppleScript injection protection and safe execution

## Requirements

- **macOS**: This extension only works on macOS due to AppleScript requirements
- **Things 3**: Must be installed and accessible via AppleScript
- **Node.js**: Version 18.0.0 or higher
- **Claude Desktop**: Compatible with DXT specification 0.1

## Installation

1. **Download or Clone**: Get the extension files to your local machine
2. **Install Dependencies**: 
   ```bash
   cd things-dxt
   npm install
   ```
3. **Package Extension**: Create the DXT package
   ```bash
   dxt pack .
   ```
4. **Install in Claude Desktop**: Follow Claude Desktop's extension installation process

## Available Tools

> **Date Parameter Note**: This extension uses user-friendly date terminology:
> - `due_date` = "when scheduled to work on" (appears in Today/Upcoming lists)
> - `deadline` = "when actually due" (the final deadline)

### Creation Operations

#### `create_todo`
Create a new to-do item in Things.

**Parameters:**
- `name` (required): The title of the to-do item
- `notes` (optional): Additional notes (max 10,000 characters)
- `due_date` (optional): When to work on it in YYYY-MM-DD format
- `deadline` (optional): Final deadline in YYYY-MM-DD format
- `project` (optional): Project name to add the to-do to
- `area` (optional): Area name to add the to-do to
- `tags` (optional): Array of tag names (max 50)

#### `create_project`
Create a new project in Things.

**Parameters:**
- `name` (required): The name of the project
- `notes` (optional): Project description or notes
- `area` (optional): Area to assign the project to
- `due_date` (optional): When to work on project
- `deadline` (optional): Project final deadline
- `tags` (optional): Array of tag names

#### `create_area`
Create a new area for organizing projects and tasks.

**Parameters:**
- `name` (required): The name of the area
- `tags` (optional): Array of tag names

### Retrieval Operations

#### `get_todos`
Retrieve to-do items with advanced filtering.

**Parameters:**
- `list` (optional): "inbox", "today", "upcoming", "anytime", "someday", "all" (default: "all")
- `status` (optional): "open", "completed", "canceled" (default: "open")
- `limit` (optional): Maximum items to return (1-1000, default: 50)

#### `get_projects`
Get projects with filtering options.

**Parameters:**
- `area` (optional): Filter projects by area name
- `status` (optional): "open", "completed", "canceled" (default: "open")
- `limit` (optional): Maximum items to return (1-1000, default: 50)

#### `get_areas`
Get all areas from Things. No parameters required.

#### `get_upcoming_todos`
Get upcoming todos within a specified timeframe.

**Parameters:**
- `days` (optional): Number of days ahead to look (default: 7)
- `completed` (optional): Include completed todos (default: false)
- `limit` (optional): Maximum items to return (default: 50)

### Search Operations

#### `search_items`
Search for items across your Things database.

**Parameters:**
- `query` (required): Search query text
- `type` (optional): "all", "todo", "project", "area" (default: "all")

### Update Operations

#### `update_todo`
Update an existing to-do item.

**Parameters:**
- `name` (required): Current name of the to-do to update
- `new_name` (optional): New name for the to-do
- `notes` (optional): New notes for the to-do
- `due_date` (optional): New due date
- `deadline` (optional): New deadline
- `project` (optional): Move to this project
- `area` (optional): Move to this area
- `tags` (optional): Set new tags (replaces existing)

### Status Management

#### `complete_todo`
Mark a to-do as completed.

**Parameters:**
- `name` (required): The name of the to-do to complete

#### `cancel_todo`
Cancel a to-do item.

**Parameters:**
- `name` (required): The name of the to-do to cancel

#### `cancel_project`
Cancel a project.

**Parameters:**
- `name` (required): The name of the project to cancel

### Delete Operations

#### `delete_todo`
Permanently delete a to-do item.

**Parameters:**
- `name` (required): The name of the to-do to delete

#### `delete_project`
Permanently delete a project.

**Parameters:**
- `name` (required): The name of the project to delete

#### `delete_area`
Permanently delete an area.

**Parameters:**
- `name` (required): The name of the area to delete

## Usage Examples

### Creating and Managing Tasks
```
Create a task called "Prepare presentation" with notes "Include Q3 metrics and future roadmap" due tomorrow in my Work project with tags "urgent" and "presentation"
```

### Planning Your Day
```
Show me all my tasks for today and help me prioritize them
```

### Project Management
```
Create a new project called "Website Redesign" in my "Product Development" area with a deadline of March 15th
```

### Updating Tasks
```
Update my task "Review proposal" to move it to the "Client Work" project and change the due date to next Friday
```

### Advanced Search and Filtering
```
Search for all tasks containing "meeting" and show me upcoming tasks for the next 3 days
```

### Task Lifecycle Management
```
Complete the task "Submit quarterly report" and cancel the project "Outdated Initiative"
```

### Bulk Operations
```
Show me all completed tasks from last week and help me archive the related projects
```

## Security Features

- **Comprehensive Input Validation**: All inputs validated for type, length, and content with strict limits
- **AppleScript Injection Protection**: Advanced sanitization prevents code injection attacks
- **Error Handling**: Robust error handling with structured responses and detailed logging
- **Timeout Management**: AppleScript execution timeouts prevent hanging operations
- **Safe Execution**: Secure command execution with process isolation
- **Data Integrity**: Validation ensures data consistency across all operations
- **Parameter Limits**: Enforced limits on array sizes, string lengths, and object counts

## Troubleshooting

### Things 3 Not Running
If you get an error that Things 3 is not running:
1. Launch Things 3 application
2. Ensure it's not just in the dock but actually running
3. Try the command again

### Permission Issues
If you encounter AppleScript permission errors:
1. Go to System Preferences > Security & Privacy > Privacy
2. Select "Automation" from the left sidebar
3. Ensure the terminal or application running Claude Desktop has permission to control Things 3

### Debug Mode
Enable debug logging by setting the DEBUG environment variable:
```bash
DEBUG=true node server/index.js
```

## Development

### Project Structure
```
things-dxt/
├── manifest.json                    # DXT extension manifest
├── package.json                     # Node.js dependencies
├── README.md                       # This documentation
├── server/
│   ├── index.js                    # Main MCP server implementation
│   ├── utils.js                    # Validation and security utilities
│   ├── applescript-templates.js    # AppleScript generation templates
│   └── data-parser.js              # Response parsing and formatting
```

### Testing
To test the extension locally:
1. Start the MCP server: `npm start`
2. Test individual AppleScript commands in Script Editor
3. Validate JSON responses match expected schemas

### Contributing
1. Ensure all new features include proper input validation and security measures
2. Add comprehensive error handling with structured responses
3. Update documentation for new tools or parameters
4. Test thoroughly with Things 3 on macOS across different scenarios
5. Follow the established patterns for AppleScript templates and data parsing
6. Maintain backward compatibility when possible

## License

MIT License - see package.json for details.

## Support

For issues related to:
- **Things 3**: Contact Cultured Code support
- **Claude Desktop**: Follow Claude Desktop documentation
- **This Extension**: Create an issue in the project repository

## Acknowledgments

- Thanks to Cultured Code for providing comprehensive AppleScript support in Things 3
- Built using the Model Context Protocol (MCP) SDK from Anthropic