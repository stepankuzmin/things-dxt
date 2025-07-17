# Things DXT - Claude Desktop Extension

A comprehensive Claude Desktop Extension that provides seamless integration with Things 3, enabling you to manage your complete task workflow directly from Claude conversations using robust AppleScript automation.

## Quick Start

1. **Install Dependencies**: `npm install`
2. **Package Extension**: `dxt pack .`
3. **Install in Claude Desktop**: Follow Claude Desktop's extension installation process
4. **Launch Things 3**: Ensure Things 3 is running before using commands

> **💡 Pro Tip**: Use `when` for scheduling (when to work on) and `deadline` for final due dates.

## Features

### 🎯 Core Functionality
- **Complete Task Management**: Create, read, update, and search todos and projects
- **Smart List Access**: Work with all Things 3 lists (Inbox, Today, Upcoming, Anytime, Someday)
- **Project & Area Organization**: Full project and area management capabilities
- **Advanced Search**: Multiple search types across all your Things data

### 🔍 Discovery & Navigation  
- **Tag Management**: Get all tags and find items by specific tags
- **Logbook Access**: View completed tasks with flexible time periods
- **Trash Management**: Access and review trashed items
- **Recent Items**: Find recently modified items

### 🛠️ Advanced Features
- **Flexible Updates**: Modify existing tasks and projects with full parameter control
- **Data Integrity**: Comprehensive input validation and error handling
- **Security**: Built-in AppleScript injection protection and safe execution
- **User-Friendly Parameters**: Intuitive date terminology and parameter mapping

## API Reference

### 📝 Creation Tools

#### `add_todo` - Create a new to-do
**Required**: `title`  
**Optional**: `notes`, `when`, `deadline`, `list_title`, `list_id`, `heading`, `tags`, `checklist_items`

#### `add_project` - Create a new project  
**Required**: `title`  
**Optional**: `notes`, `when`, `deadline`, `area_title`, `area_id`, `tags`, `todos`

### 📋 List Access Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_inbox` | Get todos from Inbox | None |
| `get_today` | Get todos due today | None |
| `get_upcoming` | Get upcoming todos | None |
| `get_anytime` | Get Anytime list todos | None |
| `get_someday` | Get Someday list todos | None |
| `get_logbook` | Get completed todos | `period`, `limit` |
| `get_trash` | Get trashed todos | None |

#### `get_todos` - Get todos with filtering
**Optional**: `project_uuid`, `include_items`

#### `get_projects` - Get all projects
**Optional**: `include_items`

#### `get_areas` - Get all areas
**Optional**: `include_items`

### 🔍 Search & Discovery Tools

#### `search_items` - Universal search
**Required**: `query`

#### `search_todos` - Todo-specific search  
**Required**: `query`

#### `search_advanced` - Multi-criteria search
**Required**: `query`  
**Optional**: `tags`, `completed`, `canceled`, `trashed`

#### `get_tags` - Get all tags
**Parameters**: None

#### `get_tagged_items` - Find items by tag
**Required**: `tag_title`

#### `get_recent` - Get recent items
**Optional**: `days` (default: 7)

### ✏️ Update Tools

#### `update_todo` - Update existing todo
**Required**: `id`  
**Optional**: `title`, `notes`, `when`, `deadline`, `tags`, `completed`, `canceled`

#### `update_project` - Update existing project
**Required**: `id`  
**Optional**: `title`, `notes`, `when`, `deadline`, `tags`, `completed`, `canceled`

#### `show_item` - Show item details
**Required**: `id`

## Usage Examples

### Daily Workflow
```
Show me my inbox and today's tasks, then help me plan my day
```

### Task Creation
```
Create a task "Prepare quarterly report" with notes "Include Q3 metrics and future roadmap" due next Friday in my Work project with tags "urgent" and "quarterly"
```

### Project Management
```
Create a new project "Website Redesign" in my "Product Development" area with deadline March 15th and add initial todos: "Research competitors", "Create wireframes", "Design mockups"
```

### Search & Organization
```
Search for all tasks containing "meeting" and show me what's tagged with "urgent"
```

### Weekly Review
```
Show me what I completed last week, what's in my logbook, and help me organize my upcoming tasks
```

## Parameter Guide

### Date Parameters
- **`when`**: When scheduled to work on (appears in Today/Upcoming)
- **`deadline`**: When actually due (final deadline)
- **Format**: YYYY-MM-DD (e.g., "2024-03-15")

### Organization Parameters
- **`list_title`/`area_title`**: Use names for easy reference
- **`list_id`/`area_id`**: Use IDs for precise targeting
- **`tags`**: Array of tag names (e.g., ["urgent", "work"])

### Update Parameters
- **`id`**: Required for all update operations
- **Status flags**: `completed`, `canceled` (boolean)

## Requirements

- **macOS**: Required for AppleScript integration
- **Things 3**: Must be installed and accessible
- **Node.js**: Version 18.0.0 or higher
- **Claude Desktop**: Compatible with DXT specification

## Installation

```bash
# Clone or download the extension
cd things-dxt

# Install dependencies
npm install

# Package the extension
dxt pack .

# Install in Claude Desktop (follow Claude Desktop docs)
```

## Architecture

### Project Structure
```
things-dxt/
├── manifest.json              # DXT extension manifest
├── package.json               # Dependencies and scripts
├── README.md                  # Documentation
└── server/
    ├── index.js               # Main MCP server
    ├── tool-definitions.js    # MCP tool schemas
    ├── tool-handlers.js       # Tool implementation logic
    ├── server-config.js       # Configuration constants
    ├── utils.js               # Validation and utilities
    ├── applescript-templates.js # AppleScript generation
    └── data-parser.js         # Response parsing
```

### Key Design Principles
- **Separation of Concerns**: Modular architecture with clear responsibilities
- **Security First**: Input validation and AppleScript injection protection
- **User-Friendly**: Intuitive parameter names and helpful error messages
- **Robust Error Handling**: Comprehensive error catching and reporting
- **Extensible**: Easy to add new tools and functionality

## Security Features

- **Input Validation**: All parameters validated for type, length, and content
- **AppleScript Protection**: Advanced sanitization prevents code injection
- **Error Handling**: Structured error responses with detailed logging
- **Timeout Management**: Prevents hanging AppleScript operations
- **Safe Execution**: Secure command execution with process isolation

## Development

### Testing
```bash
# Syntax validation
npm run validate

# Debug mode
DEBUG=true npm start

# Test individual AppleScript in Script Editor
```

### Adding New Tools
1. Add tool definition to `tool-definitions.js`
2. Implement handler in `tool-handlers.js`
3. Add routing in `index.js` `getHandlerMethod()`
4. Update documentation

### Contributing Guidelines
- Include comprehensive input validation
- Add structured error handling
- Update documentation for new features
- Test thoroughly with Things 3 on macOS
- Follow established patterns and conventions
- Maintain backward compatibility when possible

## Troubleshooting

### Common Issues

**Things 3 Not Running**
```
Solution: Launch Things 3 application and ensure it's running (not just in dock)
```

**Permission Errors**
```
Solution: 
1. System Preferences > Security & Privacy > Privacy
2. Select "Automation" 
3. Grant permission for your terminal/Claude Desktop to control Things 3
```

**Debug Information**
```bash
# Enable detailed logging
DEBUG=true npm start
```

### Getting Help

- **Things 3 Issues**: Contact Cultured Code support
- **Claude Desktop**: Follow Claude Desktop documentation  
- **Extension Issues**: Create issue in project repository

## License

MIT License - See package.json for details

## Acknowledgments

- **Cultured Code** for comprehensive AppleScript support in Things 3
- **Anthropic** for the Model Context Protocol (MCP) SDK
- **things-mcp project** for architectural inspiration

---

*Built with ❤️ for the Claude Desktop ecosystem*