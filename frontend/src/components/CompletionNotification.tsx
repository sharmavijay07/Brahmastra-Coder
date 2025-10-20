import { useEffect, useState } from 'react'
import { CheckCircle, Eye, FolderOpen, X } from 'lucide-react'

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

interface CompletionNotificationProps {
    status: GenerationStatus
    files: any[]
    onPreview: () => void
    onOpenFolder: () => void
}

export default function CompletionNotification({
    status,
    files,
    onPreview,
    onOpenFolder
}: CompletionNotificationProps) {
    const [show, setShow] = useState(false)
    const [hasShown, setHasShown] = useState(false)

    useEffect(() => {
        if (status === 'completed' && files.length > 0 && !hasShown) {
            setShow(true)
            setHasShown(true)

            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                setShow(false)
            }, 10000)

            return () => clearTimeout(timer)
        }

        // Reset when new generation starts
        if (status === 'generating') {
            setHasShown(false)
            setShow(false)
        }
    }, [status, files.length, hasShown])

    if (!show) return null

    const hasHtmlFile = files.some(file =>
        file.path?.toLowerCase().endsWith('.html')
    )

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-2xl p-4 max-w-md">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <CheckCircle size={24} className="text-white" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                            🎉 Project Generated Successfully!
                        </h3>
                        <p className="text-green-50 text-sm mb-3">
                            Your project has been created with {files.length} files
                        </p>

                        <div className="flex gap-2">
                            {hasHtmlFile && (
                                <button
                                    onClick={() => {
                                        onPreview()
                                        setShow(false)
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-600 rounded font-medium text-sm hover:bg-green-50 transition-colors"
                                >
                                    <Eye size={16} />
                                    Preview
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    onOpenFolder()
                                    setShow(false)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded font-medium text-sm hover:bg-white/30 transition-colors"
                            >
                                <FolderOpen size={16} />
                                Open Folder
                            </button>
                        </div>
                    </div>

                    <button
                        title='button'
                        onClick={() => setShow(false)}
                        className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
