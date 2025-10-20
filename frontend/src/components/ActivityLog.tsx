import { useEffect, useRef } from 'react'
import { FileText, FilePlus, FileEdit, Trash2, AlertCircle, Info } from 'lucide-react'

interface LogEntry {
    type: 'log' | 'file_create' | 'file_update' | 'file_delete' | 'error'
    message: string
    timestamp: number
    data?: any
}

interface ActivityLogProps {
    logs: LogEntry[]
    theme?: 'light' | 'dark'
}

function LogIcon({ type, theme = 'dark' }: { type: LogEntry['type'], theme?: 'light' | 'dark' }) {
    const lightColors = {
        create: 'text-green-600',
        update: 'text-blue-600',
        delete: 'text-red-600',
        error: 'text-red-600',
        default: 'text-gray-600'
    }
    const darkColors = {
        create: 'text-green-400',
        update: 'text-blue-400',
        delete: 'text-red-400',
        error: 'text-red-400',
        default: 'text-gray-400'
    }
    const colors = theme === 'light' ? lightColors : darkColors

    switch (type) {
        case 'file_create':
            return <FilePlus size={16} className={colors.create} />
        case 'file_update':
            return <FileEdit size={16} className={colors.update} />
        case 'file_delete':
            return <Trash2 size={16} className={colors.delete} />
        case 'error':
            return <AlertCircle size={16} className={colors.error} />
        default:
            return <Info size={16} className={colors.default} />
    }
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

export default function ActivityLog({ logs, theme = 'dark' }: ActivityLogProps) {
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-scroll to bottom when new logs are added
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <div className="h-full flex flex-col">
            <div className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                    Activity Log
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-2">
                {logs.length === 0 ? (
                    <div className={`py-8 text-center text-xs sm:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                        Activity will appear here when you generate a project
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 text-xs sm:text-sm">
                            <div className="flex-shrink-0 mt-0.5">
                                <LogIcon type={log.type} theme={theme} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`break-words ${theme === 'light' ? (
                                    log.type === 'error' ? 'text-red-600' :
                                        log.type === 'file_create' ? 'text-green-600' :
                                            log.type === 'file_update' ? 'text-blue-600' :
                                                log.type === 'file_delete' ? 'text-red-600' :
                                                    'text-gray-700'
                                ) : (
                                    log.type === 'error' ? 'text-red-400' :
                                        log.type === 'file_create' ? 'text-green-400' :
                                            log.type === 'file_update' ? 'text-blue-400' :
                                                log.type === 'file_delete' ? 'text-red-400' :
                                                    'text-gray-300'
                                )
                                    }`}>
                                    {log.message}
                                </p>
                                <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {formatTime(log.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    )
}
