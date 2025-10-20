import { Eye, ExternalLink } from 'lucide-react'
import { useState } from 'react'

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

interface PreviewButtonProps {
    status: GenerationStatus
    files: any[]
    theme?: 'light' | 'dark'
}

export default function PreviewButton({ status, files, theme = 'dark' }: PreviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Check if there's an HTML file to preview
    const hasHtmlFile = files.some(file =>
        file.path?.toLowerCase().endsWith('.html') ||
        file.path?.toLowerCase() === 'index.html'
    )

    const handlePreview = () => {
        if (status !== 'completed' || files.length === 0) return

        // Open preview in new window
        const previewWindow = window.open('/preview', '_blank', 'width=1200,height=800')
        if (previewWindow) {
            setIsOpen(true)
        }
    }

    const handleOpenFolder = async () => {
        try {
            // Call backend to open the generated_project folder
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/open-folder`, {
                method: 'POST'
            })
            if (response.ok) {
                console.log('Folder opened')
            }
        } catch (error) {
            console.error('Failed to open folder:', error)
        }
    }

    if (status !== 'completed' || files.length === 0) {
        return null
    }

    return (
        <div className="flex items-center gap-1.5 md:gap-2">
            {hasHtmlFile && (
                <button
                    onClick={handlePreview}
                    className="flex items-center gap-1.5 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs md:text-sm"
                    title="Preview the generated website"
                >
                    <Eye size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">Preview</span>
                </button>
            )}

            <button
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-2 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs md:text-sm"
                title="Open project folder"
            >
                <ExternalLink size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden sm:inline">Open</span>
            </button>
        </div>
    )
}
