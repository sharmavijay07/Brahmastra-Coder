import { CheckCircle, Loader2, AlertCircle, Circle } from 'lucide-react'

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

interface StatusBarProps {
    status: GenerationStatus
    error: string | null
    theme?: 'light' | 'dark'
}

export default function StatusBar({ status, error, theme = 'dark' }: StatusBarProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'generating':
                return <Loader2 size={16} className="animate-spin text-blue-400" />
            case 'completed':
                return <CheckCircle size={16} className="text-green-400" />
            case 'error':
                return <AlertCircle size={16} className="text-red-400" />
            default:
                return <Circle size={16} className="text-gray-500" />
        }
    }

    const getStatusText = () => {
        switch (status) {
            case 'generating':
                return 'Generating project...'
            case 'completed':
                return 'Project generated successfully'
            case 'error':
                return error || 'An error occurred'
            default:
                return 'Ready'
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case 'generating':
                return 'text-blue-400'
            case 'completed':
                return 'text-green-400'
            case 'error':
                return 'text-red-400'
            default:
                return 'text-gray-500'
        }
    }

    return (
        <div className={`border-t px-6 py-2 ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
        }`}>
            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                </span>
            </div>
        </div>
    )
}
