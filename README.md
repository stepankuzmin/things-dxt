# Things DXT - Claude Desktop Extension

A Claude Desktop Extension that provides seamless integration with Things 3, the award-winning personal task manager for macOS. This extension allows you to create, manage, and organize your tasks directly from Claude conversations using AppleScript automation.

## Features

- **Create Tasks**: Add new to-dos with titles, notes, due dates, projects, areas, and tags
- **Create Projects**: Organize your work with new projects and assign them to areas
- **Create Areas**: Set up high-level organization areas for your projects and tasks
- **Retrieve Data**: Get lists of your to-dos, projects, and areas
- **Task Management**: Complete tasks and show specific items in Things
- **Quick Entry**: Open Things Quick Entry panel with optional pre-filled text
- **Search**: Find items across your Things database
- **Security**: Built-in input validation and AppleScript injection protection

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

### Task Creation

#### `create_todo`
Create a new to-do item in Things.

**Parameters:**
- `name` (required): The title of the to-do item
- `notes` (optional): Additional notes for the to-do
- `due_date` (optional): Due date in YYYY-MM-DD format
- `project` (optional): Project name to add the to-do to
- `area` (optional): Area name to add the to-do to
- `tags` (optional): Array of tag names

**Example:**
```json
{
  "name": "Review quarterly reports",
  "notes": "Focus on sales and marketing metrics",
  "due_date": "2024-12-31",
  "project": "Q4 Planning",
  "tags": ["work", "urgent"]
}
```

#### `create_project`
Create a new project in Things.

**Parameters:**
- `name` (required): The name of the project
- `notes` (optional): Project description or notes
- `area` (optional): Area to assign the project to
- `due_date` (optional): Project due date in YYYY-MM-DD format
- `tags` (optional): Array of tag names

#### `create_area`
Create a new area for organizing projects and tasks.

**Parameters:**
- `name` (required): The name of the area
- `tags` (optional): Array of tag names

### Data Retrieval

#### `get_todos`
Retrieve to-do items from specific lists.

**Parameters:**
- `list` (required): One of "inbox", "today", "upcoming", "anytime", "someday"
- `completed` (optional): Include completed to-dos (default: false)
- `limit` (optional): Maximum number of items to return (default: 50)

#### `get_projects`
Get projects from Things.

**Parameters:**
- `area` (optional): Filter projects by area name
- `completed` (optional): Include completed projects (default: false)

#### `get_areas`
Get all areas from Things. No parameters required.

### Task Management

#### `complete_todo`
Mark a to-do as completed.

**Parameters:**
- `name` (required): The name of the to-do to complete

#### `show_item`
Show a specific item in Things.

**Parameters:**
- `name` (required): The name of the item to show
- `type` (required): Type of item ("todo", "project", or "area")

#### `show_quick_entry`
Open Things Quick Entry panel.

**Parameters:**
- `text` (optional): Text to pre-fill in the quick entry

#### `search_items`
Search for items in Things.

**Parameters:**
- `query` (required): Search query text
- `type` (optional): Item type to search ("all", "todo", "project", "area", default: "all")

## Usage Examples

### Creating a Task
```
Create a task called "Prepare presentation" with notes "Include Q3 metrics and future roadmap" due tomorrow in my Work project with tags "urgent" and "presentation"
```

### Planning Your Day
```
Show me all my tasks for today and help me prioritize them
```

### Project Management
```
Create a new project called "Website Redesign" in my "Product Development" area with a due date of March 15th
```

### Quick Task Entry
```
Open Things Quick Entry with "Call dentist to schedule appointment"
```

## Security Features

- **Input Validation**: All inputs are validated for type, length, and content
- **AppleScript Injection Protection**: Special characters are escaped to prevent code injection
- **Error Handling**: Comprehensive error handling with detailed logging
- **Timeout Management**: AppleScript execution timeouts prevent hanging
- **Safe Execution**: Use of secure command execution methods

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
DEBUG=true node src/index.js
```

## Development

### Project Structure
```
things-dxt/
├── manifest.json          # DXT extension manifest
├── package.json           # Node.js dependencies
├── README.md             # This documentation
├── src/
│   ├── index.js          # Main MCP server implementation
│   └── utils.js          # Validation and security utilities
```

### Testing
To test the extension locally:
1. Start the MCP server: `npm start`
2. Test individual AppleScript commands in Script Editor
3. Validate JSON responses match expected schemas

### Contributing
1. Ensure all new features include proper input validation
2. Add comprehensive error handling
3. Update documentation for new tools or parameters
4. Test thoroughly with Things 3 on macOS

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