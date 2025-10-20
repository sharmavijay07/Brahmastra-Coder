# Brahmastra Coder - Frontend

A Next.js frontend for the Brahmastra Coder AI project generator. This interface provides real-time visualization of AI-generated projects with live file operations display, similar to Lovable.

## Features

- 🎨 **Real-time Project Generation**: Watch as AI creates your project file-by-file
- 📁 **Interactive File Explorer**: Browse generated files in a tree structure
- 💻 **Monaco Code Editor**: View file contents with syntax highlighting
- 📝 **Live Activity Log**: Track all file operations (create, update, delete) in real-time
- 🔌 **WebSocket Integration**: Streaming updates via Socket.IO
- 🌓 **Dark Mode**: Modern dark theme interface
- ⚡ **Fast & Responsive**: Built with Next.js 14 and TypeScript

## Prerequisites

- Node.js 18+ installed
- Backend API server running (see `api/server.py`)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

# Running the Application

1. **Start the Backend API** (in a separate terminal):
```bash
cd ..
python -m uvicorn api.server:socket_app --reload
```

2. **Start the Frontend (dev)**:
```bash
npm run dev
```

3. **Build static export (production)**:
```bash
npm run build
npm run start # serves the exported out/ folder if configured, or deploy to Vercel
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter a Project Description**: Describe what you want to build in the prompt input
   - Example: "Create a todo app with HTML, CSS, and vanilla JavaScript"
   
2. **Click Generate**: The AI will start creating your project

3. **Watch Real-time Updates**:
   - Files appear in the explorer as they're created
   - Activity log shows all operations
   - Click any file to view its contents in the editor
   - Status bar shows current generation progress

4. **Generated Files**: Find your project in `../generated_project/`

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page
│   ├── components/       # React components
│   │   ├── PromptInput.tsx      # Project description input
│   │   ├── FileExplorer.tsx     # File tree view
│   │   ├── CodeEditor.tsx       # Monaco editor
│   │   ├── ActivityLog.tsx      # Real-time activity feed
│   │   └── StatusBar.tsx        # Status indicator
│   └── hooks/            # Custom React hooks
│       └── useProjectGeneration.ts  # WebSocket & state management
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code's editor)
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client
- **State Management**: React Hooks

## Configuration

### Backend URL
The frontend connects to `http://localhost:8000` by default. To change this, update the URLs in:
- `src/hooks/useProjectGeneration.ts`

### Styling
Customize colors and theme in:
- `tailwind.config.js`
- `src/app/globals.css`

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## WebSocket Events

The frontend listens for these event types from the backend:

- `log`: General log messages
- `file_create`: New file created
- `file_update`: File modified
- `file_delete`: File deleted
- `status`: Generation status (completed/error)
- `error`: Error messages

## Troubleshooting

### Connection Failed
- Ensure backend is running on port 8000
- Check CORS settings in `api/server.py`
- Verify firewall/antivirus isn't blocking connections

### No Files Showing
- Backend might not have write permissions to `generated_project/`
- Check backend console for errors
- Refresh file list after generation

### Editor Not Loading
- Monaco Editor requires client-side rendering
- Check browser console for errors
- Ensure @monaco-editor/react is installed

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
