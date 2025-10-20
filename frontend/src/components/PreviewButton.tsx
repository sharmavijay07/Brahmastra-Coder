import { Eye, ExternalLink } from 'lucide-react'
import { useState } from 'react'

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error'

interface PreviewButtonProps {
    status: GenerationStatus
    files: any[]
}

export default function PreviewButton({ status, files }: PreviewButtonProps) {
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
            const response = await fetch('http://localhost:8000/api/open-folder', {
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
        <div className="flex items-center gap-2">
            {hasHtmlFile && (
                <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    title="Preview the generated website"
                >
                    <Eye size={18} />
                    Preview
                </button>
            )}

            <button
                onClick={handleOpenFolder}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                title="Open project folder"
            >
                <ExternalLink size={18} />
                Open Folder
            </button>
        </div>
    )
}
