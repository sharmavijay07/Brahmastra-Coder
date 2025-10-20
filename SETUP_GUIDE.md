# Brahmastra Coder - Complete Setup Guide

## Overview
A full-stack AI-powered project generator with real-time file operations display. The system uses LangChain agents to plan, architect, and code complete projects based on natural language prompts.

## Architecture

```
┌─────────────────┐         WebSocket/         ┌──────────────────┐
│  Next.js        │◄────────Socket.IO─────────►│  FastAPI         │
│  Frontend       │                             │  Server          │
│                 │         REST API            │                  │
│  - React UI     │◄──────────────────────────►│  - Wraps agents  │
│  - Monaco Editor│                             │  - Streams files │
│  - File Explorer│                             │                  │
└─────────────────┘                             └──────────────────┘
                                                         │
                                                         ▼
                                                ┌──────────────────┐
                                                │  LangGraph       │
                                                │  Agent System    │
                                                │                  │
                                                │  - Planner       │
                                                │  - Architect     │
                                                │  - Coder         │
                                                └──────────────────┘
```

## Prerequisites

### Required
- Python 3.11+
- Node.js 18+ and npm
- Groq API key (for LLM)

### Optional
- Git (for version control)

## Backend Setup

### 1. Create Virtual Environment

```bash
# Navigate to project root
cd "c:\Users\SURAJ\Documents\5clear chatapp\AI SE"

# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\activate
```

### 2. Install Python Dependencies

```bash
# Install main dependencies
pip install langchain langchain-groq langgraph

# Install API server dependencies
pip install -r api/requirements.txt
```

Dependencies:
- `fastapi==0.115.0` - Web framework
- `uvicorn[standard]==0.32.0` - ASGI server
- `python-socketio==5.11.0` - Socket.IO for real-time streaming
- `python-multipart==0.0.12` - File upload support
- `pydantic==2.9.2` - Data validation
- `aiofiles==23.2.1` - Async file operations

### 3. Configure Environment

Create `.env` file in project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com/

### 4. Test Agent System

```bash
# Run the basic agent
python main.py
```

This should successfully generate a project in `generated_project/` folder.

### 5. Start API Server

```bash
# From project root
python -m uvicorn api.server:socket_app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
🚀 Starting Brahmastra Coder API server...
📡 Socket.IO endpoint: http://localhost:8000/socket.io/
🌐 REST API: http://localhost:8000/
📁 Project root: C:\Users\SURAJ\...\generated_project
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Frontend Setup

### 1. Install Node.js

If npm is not recognized, install Node.js from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### 2. Navigate to Frontend

```bash
cd frontend
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety
- `@monaco-editor/react` - Code editor
- `socket.io-client` - Real-time connection
- `lucide-react` - Icons
- `tailwindcss` - Styling

### 4. Start Development Server

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 14.2.18
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### 5. Open Browser

Navigate to: http://localhost:3000

## Usage

### 1. Generate a Project

1. Enter a description in the prompt input:
   ```
   Create a todo app with HTML, CSS, and vanilla JavaScript
   ```

2. Click "Generate Project"

3. Watch real-time updates:
   - Activity Log shows agent actions
   - Files appear in File Explorer as created
   - Status bar shows progress

4. Click files to view contents in Monaco Editor

### 2. View Generated Files

Files are created in: `generated_project/`

You can also browse them through the file explorer in the UI.

### 3. Download/Use Project

Simply copy files from `generated_project/` to your desired location.

## Project Structure

```
AI SE/
├── agents/                      # Agent system
│   ├── graph.py                 # LangGraph orchestration
│   ├── prompts.py               # Agent prompts
│   ├── states.py                # Pydantic models
│   └── tools.py                 # File operation tools
│
├── api/                         # Backend API
│   ├── server.py                # FastAPI + Socket.IO server
│   └── requirements.txt         # API dependencies
│
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Next.js app directory
│   │   │   ├── globals.css      # Global styles
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Main page
│   │   ├── components/          # React components
│   │   │   ├── PromptInput.tsx
│   │   │   ├── FileExplorer.tsx
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   └── StatusBar.tsx
│   │   └── hooks/               # Custom hooks
│   │       └── useProjectGeneration.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── generated_project/           # Output folder (created automatically)
│
├── main.py                      # Direct agent execution
├── .env                         # Environment variables
└── pyproject.toml               # Python project config
```

## API Endpoints

### REST API

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/files` - List all generated files (tree structure)
- `GET /api/file/{filepath}` - Get file content
- `DELETE /api/file/{filepath}` - Delete file

### Socket.IO Events

#### Client → Server
- `generate` - Start project generation
  ```json
  {
    "prompt": "Create a todo app..."
  }
  ```

#### Server → Client
- `message` - All updates sent via this event
  ```json
  {
    "type": "log|file_create|file_update|file_delete|status|error",
    "message": "Human readable message",
    "data": {}  // Optional additional data
  }
  ```

## Troubleshooting

### Backend Issues

**ImportError: No module named 'langchain'**
```bash
pip install langchain langchain-groq langgraph
```

**Groq API Error**
- Check `.env` file exists with valid `GROQ_API_KEY`
- Verify API key at https://console.groq.com/

**Port 8000 already in use**
```bash
# Change port in server startup
uvicorn api.server:socket_app --port 8001
# Also update frontend hook URL
```

### Frontend Issues

**npm not recognized**
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

**Connection Failed**
- Ensure backend is running on port 8000
- Check CORS settings in `api/server.py`
- Verify firewall isn't blocking connections

**Monaco Editor not loading**
- Clear browser cache
- Check browser console for errors
- Ensure @monaco-editor/react is installed

**No files showing**
- Check `generated_project/` folder exists
- Verify backend has write permissions
- Refresh page or click generate again

### Common Errors

**Rate Limiting (429 Error)**
- Groq free tier has request limits
- Wait a few minutes between generations
- Consider upgrading Groq plan

**File Permission Errors**
- Run terminal as administrator (Windows)
- Check folder permissions
- Ensure antivirus isn't blocking writes

## Development

### Backend Development

```bash
# Run with auto-reload
uvicorn api.server:socket_app --reload

# Run tests (if any)
pytest

# Format code
black .
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Production Deployment

### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with gunicorn (recommended for production)
pip install gunicorn
gunicorn api.server:socket_app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend

```bash
cd frontend

# Build optimized production bundle
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
vercel deploy
```

## Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=gsk_...
PROJECT_ROOT=generated_project  # Optional, defaults to ./generated_project
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## Features Checklist

- ✅ Three-agent system (Planner, Architect, Coder)
- ✅ LangGraph orchestration
- ✅ FastAPI + Socket.IO streaming
- ✅ Next.js 14 with TypeScript
- ✅ Real-time file operations display
- ✅ Monaco code editor with syntax highlighting
- ✅ File tree explorer with expand/collapse
- ✅ Activity log with timestamps
- ✅ Status indicators
- ✅ Dark mode UI
- ✅ Responsive design
- ✅ Error handling

## Next Steps / Enhancements

1. **File Editing**: Allow editing files directly in Monaco Editor and saving back
2. **Project Templates**: Pre-built templates for common project types
3. **Multi-Project**: Support multiple concurrent projects
4. **Export**: ZIP download of generated projects
5. **History**: View past generated projects
6. **Collaborative**: Multiple users working on same project
7. **Authentication**: User accounts and project ownership
8. **Cloud Storage**: Store projects in cloud (S3, etc.)
9. **Git Integration**: Auto-commit generated files
10. **Deployment**: One-click deploy to Vercel/Netlify

## License

MIT

## Support

For issues:
1. Check this guide first
2. Review error messages in terminal/console
3. Search existing issues
4. Open new issue with full error details

---

**Created with ❤️ by AI Software Engineering Team**
