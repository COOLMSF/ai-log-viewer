# Advanced Log Viewer with AI Analysis

A modern web-based log viewer with syntax highlighting and AI-powered analysis capabilities. Built with Python Flask backend and React frontend.

## Features

### Core Functionality
- **Multi-format Log Support**: Automatically detects and parses syslog, Apache access logs, Kubernetes logs, MySQL logs, and more
- **Syntax Highlighting**: Beautiful color-coded display for both parsed and raw log views
- **AI Analysis**: Powered by DeepSeek LLM for intelligent log analysis and issue detection
- **Modern UI**: Responsive design with drag-and-drop upload, search, and filtering
- **Real-time Processing**: Automatic log parsing and structured data extraction

### AI Analysis Features
- Automatic issue detection (errors, warnings, security concerns)
- Performance bottleneck identification
- Configuration problem analysis
- Pattern recognition and anomaly detection
- Actionable recommendations
- Custom question analysis
- Demo mode when API key not configured

### Supported Log Formats
- **Syslog** (RFC3164): System logs from Linux/Unix systems
- **Apache Access Logs**: Web server access logs in Common Log Format
- **Kubernetes Logs**: Container orchestration platform logs
- **MySQL Logs**: Database server logs
- **Docker Logs**: Container runtime logs
- **Generic Text Logs**: Any text-based log format

## Architecture

### Backend (Python Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (easily configurable for PostgreSQL/MySQL)
- **AI Integration**: DeepSeek API (OpenAI-compatible)
- **Log Processing**: Custom parsers for different log formats
- **API**: RESTful endpoints for file upload, parsing, and analysis

### Frontend (React)
- **Framework**: React 18 with Vite build tool
- **UI Library**: Tailwind CSS + shadcn/ui components
- **Syntax Highlighting**: react-syntax-highlighter library
- **File Upload**: react-dropzone for drag-and-drop functionality
- **State Management**: React hooks and context

## Installation and Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or pnpm

### Backend Setup
```bash
cd log-viewer-backend
source venv/bin/activate
pip install -r requirements.txt

# Set up environment variables (optional for AI features)
export DEEPSEEK_API_KEY="your-deepseek-api-key"

# Run the backend server
python src/main.py
```

The backend will start on `http://localhost:5001`

### Frontend Setup
```bash
cd log-viewer-frontend
pnpm install

# Run the development server
pnpm run dev
```

The frontend will start on `http://localhost:5174`

### AI Analysis Configuration (Optional)

To enable AI analysis features:

1. Get a DeepSeek API key from https://platform.deepseek.com/
2. Set the environment variable:
   ```bash
   export DEEPSEEK_API_KEY="your-api-key-here"
   ```
3. Restart the backend server

Without the API key, the application runs in demo mode with mock analysis results.

## Usage

### Uploading Log Files
1. Navigate to the "Upload & Manage" tab
2. Drag and drop log files or click to browse
3. Supported formats: .log, .txt, .out, .err, .json (up to 100MB)
4. Files are automatically processed and parsed

### Viewing Logs
1. Click "View" on any uploaded file
2. Switch to "Log Viewer" tab
3. Choose between "Parsed" (structured) or "Raw" (syntax highlighted) views
4. Use search and filtering to find specific entries

### AI Analysis
1. Select text in the log viewer by highlighting it
2. Click the "Analyze" button that appears
3. Choose from suggested analysis topics or ask custom questions
4. View detailed analysis results with recommendations

### Search and Filtering
- **Text Search**: Find specific terms across all log entries
- **Level Filtering**: Filter by log levels (INFO, WARNING, ERROR, etc.)
- **Time Range**: Navigate through chronological log entries
- **Source Filtering**: Filter by log source/component

## API Endpoints

### Log Management
- `POST /api/logs/upload` - Upload log files
- `GET /api/logs/files` - List uploaded files
- `GET /api/logs/files/{id}` - Get file details
- `GET /api/logs/files/{id}/entries` - Get parsed log entries
- `DELETE /api/logs/files/{id}` - Delete file

### Log Parsing
- `POST /api/parser/process/{id}` - Process/reprocess log file
- `GET /api/parser/formats` - Get supported log formats

### AI Analysis
- `POST /api/analysis/analyze` - Analyze selected text
- `GET /api/analysis/suggestions/{id}` - Get analysis suggestions
- `GET /api/analysis/config` - Get AI configuration status
- `GET /api/analysis/history/{id}` - Get analysis history

## Development

### Project Structure
```
log-viewer-backend/
├── src/
│   ├── main.py              # Flask application entry point
│   ├── models/              # Database models
│   ├── routes/              # API route handlers
│   ├── parsers/             # Log format parsers
│   └── services/            # Business logic services
└── requirements.txt

log-viewer-frontend/
├── src/
│   ├── App.jsx              # Main application component
│   ├── components/          # React components
│   └── assets/              # Static assets
├── package.json
└── vite.config.js
```

### Adding New Log Formats
1. Create a new parser in `backend/src/parsers/`
2. Add format detection logic in `log_parser.py`
3. Update the supported formats list in the frontend

### Extending AI Analysis
1. Modify `ai_analyzer.py` to add new analysis types
2. Update the analysis routes in `routes/analysis.py`
3. Enhance the frontend AI panel for new features

## Security Considerations

- File uploads are validated and stored securely
- API keys are handled through environment variables
- SQL injection protection through SQLAlchemy ORM
- CORS properly configured for cross-origin requests
- File size limits enforced (100MB default)

## Performance Optimization

- Pagination for large log files
- Efficient parsing with streaming for large files
- Database indexing on frequently queried fields
- Frontend virtualization for large log displays
- Caching of parsed results

## Troubleshooting

### Common Issues

**Backend not starting:**
- Check Python version (3.11+ required)
- Ensure all dependencies are installed
- Verify database permissions

**Frontend not loading:**
- Check Node.js version (18+ required)
- Clear npm/pnpm cache: `pnpm store prune`
- Verify backend is running on port 5001

**AI analysis not working:**
- Verify DEEPSEEK_API_KEY is set correctly
- Check API key validity at DeepSeek platform
- Review backend logs for API errors

**File upload failing:**
- Check file size (100MB limit)
- Verify file format is supported
- Ensure backend storage directory is writable

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the API documentation
- Submit issues on the project repository

