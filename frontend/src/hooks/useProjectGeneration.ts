import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface FileInfo {
    path: string
    type: 'file' | 'directory'
    children?: FileInfo[]
}

interface LogEntry {
    type: 'log' | 'file_create' | 'file_update' | 'file_delete' | 'error'
    message: string
    timestamp: number
    data?: any
}

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

// Get API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'

export function useProjectGeneration() {
    const [files, setFiles] = useState<FileInfo[]>([])
    const [fileContent, setFileContent] = useState<string>('')
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [status, setStatus] = useState<GenerationStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        // Load initial files
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/files`)
            const data = await response.json()
            setFiles(data.files || [])
        } catch (err) {
            console.error('Failed to fetch files:', err)
        }
    }

    const fetchFileContent = async (filePath: string) => {
        try {
            const response = await fetch(`${API_URL}/api/file/${encodeURIComponent(filePath)}`)
            const data = await response.json()
            setFileContent(data.content || '')
        } catch (err) {
            console.error('Failed to fetch file content:', err)
            setFileContent('')
        }
    }

    const addLog = useCallback((entry: Omit<LogEntry, 'timestamp'>) => {
        setLogs(prev => [...prev, { ...entry, timestamp: Date.now() }])
    }, [])

    const generateProject = useCallback((prompt: string) => {
        // Clear previous state
        setLogs([])
        setError(null)
        setStatus('generating')
        setFiles([])
        setFileContent('')

        // Disconnect existing socket
        if (socketRef.current) {
            socketRef.current.disconnect()
        }

        // Create new WebSocket connection
        const socket = io(WS_URL, {
            transports: ['websocket'],
            reconnection: false,
        })
        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnected(true)
            addLog({ type: 'log', message: 'Connected to server' })

            // Send the generation request
            socket.emit('generate', { prompt })
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            addLog({ type: 'log', message: 'Disconnected from server' })
        })

        socket.on('message', (data: any) => {
            console.log('Received:', data)

            if (data.type === 'log') {
                addLog({ type: 'log', message: data.message })
            } else if (data.type === 'file_create' || data.type === 'file_update') {
                addLog({
                    type: data.type,
                    message: `${data.type === 'file_create' ? 'Created' : 'Updated'}: ${data.data.path}`,
                    data: data.data,
                })
                fetchFiles() // Refresh file list
            } else if (data.type === 'file_delete') {
                addLog({
                    type: data.type,
                    message: `Deleted: ${data.data.path}`,
                    data: data.data,
                })
                fetchFiles()
            } else if (data.type === 'status') {
                if (data.status === 'completed') {
                    setStatus('completed')
                    addLog({ type: 'log', message: 'Project generation completed!' })
                    socket.disconnect()
                } else if (data.status === 'error') {
                    setStatus('error')
                    setError(data.message || 'An error occurred')
                    addLog({ type: 'error', message: data.message || 'An error occurred' })
                    socket.disconnect()
                }
            } else if (data.type === 'error') {
                setStatus('error')
                setError(data.message)
                addLog({ type: 'error', message: data.message })
                socket.disconnect()
            }
        })

        socket.on('error', (err: any) => {
            console.error('Socket error:', err)
            setStatus('error')
            setError('Connection error')
            addLog({ type: 'error', message: 'Connection error' })
        })

        socket.on('connect_error', (err: any) => {
            console.error('Connection error:', err)
            setStatus('error')
            setError('Failed to connect to server. Make sure the backend is running.')
            addLog({ type: 'error', message: 'Failed to connect to server' })
            setIsConnected(false)
        })
    }, [addLog])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
            }
        }
    }, [])

    return {
        files,
        fileContent,
        logs,
        status,
        error,
        isConnected,
        generateProject,
        fetchFileContent,
        fetchFiles,
    }
}
