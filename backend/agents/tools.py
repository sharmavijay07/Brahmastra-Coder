import pathlib
import subprocess
from typing import Tuple, Callable, Optional

from langchain_core.tools import tool

PROJECT_ROOT = pathlib.Path.cwd() / "generated_project"

# Global callback for file operations (used by server for real-time updates)
_file_operation_callback: Optional[Callable] = None
_should_stop_callback: Optional[Callable[[], bool]] = None


def set_file_operation_callback(callback: Optional[Callable]):
    """Set a callback function to be called when file operations occur."""
    global _file_operation_callback
    _file_operation_callback = callback


def set_should_stop_callback(callback: Optional[Callable[[], bool]]):
    """Set a callback that returns True when generation should stop."""
    global _should_stop_callback
    _should_stop_callback = callback


def should_stop() -> bool:
    """Check if a stop has been requested via the registered callback."""
    try:
        return bool(_should_stop_callback and _should_stop_callback())
    except Exception:
        return False


def safe_path_for_project(path: str) -> pathlib.Path:
    p = (PROJECT_ROOT / path).resolve()
    if PROJECT_ROOT.resolve() not in p.parents and PROJECT_ROOT.resolve() != p.parent and PROJECT_ROOT.resolve() != p:
        raise ValueError("Attempt to write outside project root")
    return p


@tool
def write_file(path: str, content: str) -> str:
    """Writes content to a file at the specified path within the project root."""
    p = safe_path_for_project(path)
    
    # Check if file exists (for update vs create)
    file_existed = p.exists()
    
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    
    relative_path = str(p.relative_to(PROJECT_ROOT))
    operation_type = 'file_update' if file_existed else 'file_create'
    
    print(f"[WRITE_FILE] {operation_type}: {relative_path} (callback: {_file_operation_callback is not None})")
    
    # Notify callback about file operation
    if _file_operation_callback:
        try:
            _file_operation_callback(operation_type, relative_path)
            print(f"[CALLBACK] Successfully called callback for {relative_path}")
        except Exception as e:
            print(f"[CALLBACK_ERROR] Error in file operation callback: {e}")
    else:
        print(f"[CALLBACK] No callback registered")
    
    return f"WROTE:{p}"


@tool
def read_file(path: str) -> str:
    """Reads content from a file at the specified path within the project root."""
    p = safe_path_for_project(path)
    if not p.exists():
        return ""
    with open(p, "r", encoding="utf-8") as f:
        return f.read()


@tool
def get_current_directory() -> str:
    """Returns the current working directory."""
    return str(PROJECT_ROOT)


@tool
def list_files(directory: str = ".") -> str:
    """Lists all files in the specified directory within the project root."""
    p = safe_path_for_project(directory)
    if not p.is_dir():
        return f"ERROR: {p} is not a directory"
    files = [str(f.relative_to(PROJECT_ROOT)) for f in p.glob("**/*") if f.is_file()]
    return "\n".join(files) if files else "No files found."

@tool
def run_cmd(cmd: str, cwd: str = None, timeout: int = 30) -> Tuple[int, str, str]:
    """Runs a shell command in the specified directory and returns the result."""
    cwd_dir = safe_path_for_project(cwd) if cwd else PROJECT_ROOT
    res = subprocess.run(cmd, shell=True, cwd=str(cwd_dir), capture_output=True, text=True, timeout=timeout)
    return res.returncode, res.stdout, res.stderr


def init_project_root():
    PROJECT_ROOT.mkdir(parents=True, exist_ok=True)
    return str(PROJECT_ROOT)