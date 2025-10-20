"""
FastAPI backend that wraps the existing agent system with Socket.IO streaming.
Streams file operations (create, update, delete) to the frontend in real-time.
"""
import asyncio
import json
import sys
import subprocess
import platform
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import socketio
import os

# Add parent directory to path to import agents
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.graph import agent
from agents.tools import PROJECT_ROOT, init_project_root

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000'],
    logger=True,
    engineio_logger=False
)

app = FastAPI(title="Brahmastra Coder API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)


class GenerateRequest(BaseModel):
    prompt: str


# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client {sid} connected")
    await sio.emit('message', {
        'type': 'log',
        'message': 'Connected to server'
    }, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client {sid} disconnected")


@sio.event
async def generate(sid, data):
    """Handle project generation request"""
    try:
        prompt = data.get('prompt', '')
        if not prompt:
            await sio.emit('message', {
                'type': 'error',
                'message': 'No prompt provided'
            }, room=sid)
            return
        
        # Initialize project root
        project_path = init_project_root()
        
        # Send initial status
        await sio.emit('message', {
            'type': 'log',
            'message': f'🚀 Starting project generation...'
        }, room=sid)
        
        await sio.emit('message', {
            'type': 'log',
            'message': f'📝 Prompt: {prompt}'
        }, room=sid)
        
        # Get initial file list with timestamps
        initial_files = {}
        if Path(project_path).exists():
            for f in Path(project_path).rglob("*"):
                if f.is_file():
                    try:
                        initial_files[str(f.relative_to(project_path))] = f.stat().st_mtime
                    except:
                        pass
        
        # Run agent in background task
        async def run_agent_with_monitoring():
            try:
                # Execute the agent
                await sio.emit('message', {
                    'type': 'log',
                    'message': '🤖 AI agent is working...'
                }, room=sid)
                
                # Run agent synchronously (it's not async)
                result = await asyncio.to_thread(agent.invoke, {"user_prompt": prompt})
                
                # Monitor for new/updated files
                await asyncio.sleep(0.5)  # Give filesystem time to settle
                
                if Path(project_path).exists():
                    current_files = {}
                    for f in Path(project_path).rglob("*"):
                        if f.is_file():
                            try:
                                rel_path = str(f.relative_to(project_path))
                                current_files[rel_path] = f.stat().st_mtime
                                
                                # Check if file is new or updated
                                if rel_path not in initial_files:
                                    # New file
                                    await sio.emit('message', {
                                        'type': 'file_create',
                                        'message': f'Created: {rel_path}',
                                        'data': {
                                            'path': rel_path,
                                            'type': 'file'
                                        }
                                    }, room=sid)
                                elif current_files[rel_path] > initial_files[rel_path]:
                                    # Updated file
                                    await sio.emit('message', {
                                        'type': 'file_update',
                                        'message': f'Updated: {rel_path}',
                                        'data': {
                                            'path': rel_path,
                                            'type': 'file'
                                        }
                                    }, room=sid)
                            except Exception as e:
                                print(f"Error processing file {f}: {e}")
                
                # Check for deleted files
                for old_file in initial_files:
                    if old_file not in current_files:
                        await sio.emit('message', {
                            'type': 'file_delete',
                            'message': f'Deleted: {old_file}',
                            'data': {
                                'path': old_file
                            }
                        }, room=sid)
                
                # Send completion message
                await sio.emit('message', {
                    'type': 'status',
                    'status': 'completed',
                    'message': '✅ Project generated successfully!'
                }, room=sid)
                
                return result
                
            except Exception as e:
                error_msg = str(e)
                print(f"Error in agent execution: {error_msg}")
                await sio.emit('message', {
                    'type': 'error',
                    'message': f'Error: {error_msg}'
                }, room=sid)
                await sio.emit('message', {
                    'type': 'status',
                    'status': 'error',
                    'message': error_msg
                }, room=sid)
        
        # Start the agent execution
        asyncio.create_task(run_agent_with_monitoring())
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error in generate handler: {error_msg}")
        await sio.emit('message', {
            'type': 'error',
            'message': f'Error: {error_msg}'
        }, room=sid)


# REST API endpoints
@app.get("/")
async def root():
    return {
        "message": "Brahmastra Coder API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "files": "/api/files",
            "file": "/api/file/{filepath}",
            "websocket": "ws://localhost:8000/socket.io/"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "project_root": str(PROJECT_ROOT)
    }


def build_file_tree(directory: Path, base_path: Path) -> list:
    """Recursively build file tree structure"""
    items = []
    try:
        for item in sorted(directory.iterdir()):
            rel_path = str(item.relative_to(base_path))
            if item.is_dir():
                items.append({
                    "path": rel_path,
                    "type": "directory",
                    "children": build_file_tree(item, base_path)
                })
            else:
                items.append({
                    "path": rel_path,
                    "type": "file"
                })
    except PermissionError:
        pass
    return items


@app.get("/api/files")
async def list_files():
    """List all files in the generated project"""
    project_path = Path(PROJECT_ROOT)
    
    if not project_path.exists():
        return {"files": [], "message": "No project generated yet"}
    
    files = build_file_tree(project_path, project_path)
    
    return {
        "files": files,
        "project_root": str(PROJECT_ROOT)
    }


@app.get("/api/file/{filepath:path}")
async def read_file(filepath: str):
    """Read a specific file's content"""
    try:
        file_path = Path(PROJECT_ROOT) / filepath
        
        # Security: ensure path is within PROJECT_ROOT
        if not str(file_path.resolve()).startswith(str(Path(PROJECT_ROOT).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Not a file")
        
        # Read file content
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # Try reading as binary for non-text files
            content = f"[Binary file: {file_path.suffix}]"
        
        return {
            "path": filepath,
            "content": content,
            "size": file_path.stat().st_size,
            "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        }
    
    except HTTPException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/file/{filepath:path}")
async def delete_file(filepath: str):
    """Delete a specific file"""
    try:
        file_path = Path(PROJECT_ROOT) / filepath
        
        # Security: ensure path is within PROJECT_ROOT
        if not str(file_path.resolve()).startswith(str(Path(PROJECT_ROOT).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path.unlink()
        
        return {
            "message": f"File {filepath} deleted successfully",
            "path": filepath
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/open-folder")
async def open_project_folder():
    """Open the generated_project folder in file explorer"""
    try:
        project_path = Path(PROJECT_ROOT).resolve()
        
        if not project_path.exists():
            raise HTTPException(status_code=404, detail="Project folder not found")
        
        # Open folder based on OS
        system = platform.system()
        if system == "Windows":
            os.startfile(str(project_path))
        elif system == "Darwin":  # macOS
            subprocess.run(["open", str(project_path)])
        else:  # Linux
            subprocess.run(["xdg-open", str(project_path)])
        
        return {"message": "Folder opened successfully", "path": str(project_path)}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/preview/{filepath:path}")
async def serve_preview_file(filepath: str):
    """Serve files for preview with proper MIME types"""
    try:
        file_path = Path(PROJECT_ROOT) / filepath
        
        # Security check
        if not str(file_path.resolve()).startswith(str(Path(PROJECT_ROOT).resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Not a file")
        
        # Determine MIME type
        mime_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        }
        
        ext = file_path.suffix.lower()
        media_type = mime_types.get(ext, 'text/plain')
        
        # Read and return file
        try:
            if media_type.startswith('text/') or media_type == 'application/javascript':
                content = file_path.read_text(encoding='utf-8')
                return Response(content=content, media_type=media_type)
            else:
                content = file_path.read_bytes()
                return Response(content=content, media_type=media_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Brahmastra Coder API server...")
    print("📡 Socket.IO endpoint: http://localhost:8000/socket.io/")
    print("🌐 REST API: http://localhost:8000/")
    print("📁 Project root:", PROJECT_ROOT)
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")
