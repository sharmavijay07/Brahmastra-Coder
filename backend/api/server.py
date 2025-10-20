"""
FastAPI backend that wraps the existing agent system with Socket.IO streaming.
Streams file operations (create, update, delete) to the frontend in real-time.
"""
import asyncio
import json
import sys
import subprocess
import platform
import threading
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from queue import Queue
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import socketio
import os

# Add parent directory to path to import agents
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.graph import agent
from agents.tools import PROJECT_ROOT, init_project_root, set_file_operation_callback

# ----------------------------------------------------------------------------
# Configure allowed origins (CORS) for both REST and Socket.IO
# Read from env var ALLOWED_ORIGINS (comma-separated). If not provided, use sane defaults.
# ----------------------------------------------------------------------------
def _get_allowed_origins() -> list[str]:
    env_val = os.getenv("ALLOWED_ORIGINS", "").strip()
    if env_val:
        return [o.strip() for o in env_val.split(",") if o.strip()]
    # Defaults: localhost (dev) + common production frontend domain
    return [
        "http://localhost:3000",
        "https://brahmastra-coder.vercel.app",
    ]

ALLOWED_ORIGINS = _get_allowed_origins()

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=ALLOWED_ORIGINS,
    logger=True,
    engineio_logger=False,
)

app = FastAPI(title="Brahmastra Coder API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Frontend domains allowed
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
        
        # Create a thread-safe queue for file operations
        file_op_queue = Queue()
        monitoring_active = True
        
        # Set up real-time file operation callback
        def file_op_callback(operation_type: str, filepath: str):
            """Callback for real-time file operations (runs in agent thread)"""
            try:
                print(f"[FILE_OP] {operation_type}: {filepath}")
                file_op_queue.put((operation_type, filepath))
            except Exception as e:
                print(f"Error in file operation callback: {e}")
        
        # Register the callback
        set_file_operation_callback(file_op_callback)
        
        # Background task to monitor queue and emit events
        async def queue_monitor():
            """Monitor the queue and emit Socket.IO events"""
            while monitoring_active or not file_op_queue.empty():
                try:
                    # Non-blocking check for queue items
                    if not file_op_queue.empty():
                        operation_type, filepath = file_op_queue.get_nowait()
                        action = 'Created' if operation_type == 'file_create' else 'Updated'
                        
                        print(f"[EMIT] {action}: {filepath}")
                        
                        await sio.emit('message', {
                            'type': operation_type,
                            'message': f'{action}: {filepath}',
                            'data': {
                                'path': filepath,
                                'type': 'file'
                            }
                        }, room=sid)
                        
                        # Also refresh the file list
                        await asyncio.sleep(0.1)
                    else:
                        await asyncio.sleep(0.1)
                except Exception as e:
                    print(f"Error in queue monitor: {e}")
                    await asyncio.sleep(0.1)
        
        # Start queue monitor
        monitor_task = asyncio.create_task(queue_monitor())
        
        # Run agent in background task
        async def run_agent_with_monitoring():
            nonlocal monitoring_active
            try:
                # Execute the agent
                await sio.emit('message', {
                    'type': 'log',
                    'message': '🤖 AI agent is working...'
                }, room=sid)
                
                # Run agent with increased recursion limit
                result = await asyncio.to_thread(
                    agent.invoke, 
                    {"user_prompt": prompt},
                    {"recursion_limit": 150}
                )
                
                # Wait a bit for any remaining queue items
                await asyncio.sleep(0.5)
                
                # Send completion message
                await sio.emit('message', {
                    'type': 'status',
                    'status': 'completed',
                    'message': '✅ Project generated successfully!'
                }, room=sid)
                
                # Stop monitoring
                monitoring_active = False
                
                # Wait for monitor to finish
                await monitor_task
                
                # Clear the callback
                set_file_operation_callback(None)
                
                return result
                
            except Exception as e:
                error_msg = str(e)
                print(f"Error in agent execution: {error_msg}")
                
                # Stop monitoring
                monitoring_active = False
                
                # Wait for monitor to finish
                try:
                    await monitor_task
                except:
                    pass
                
                # Clear the callback
                set_file_operation_callback(None)
                
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
