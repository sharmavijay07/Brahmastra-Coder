import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'

interface InlinePreviewProps {
    files: any[]
    theme: 'light' | 'dark'
}

// Get API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function InlinePreview({ files, theme }: InlinePreviewProps) {
    const [htmlContent, setHtmlContent] = useState<string>('')
    const [selectedHtmlFile, setSelectedHtmlFile] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Find HTML files
    const flattenFiles = (items: any[], result: any[] = []): any[] => {
        items.forEach(item => {
            if (item.type === 'file') {
                result.push(item)
            }
            if (item.children) {
                flattenFiles(item.children, result)
            }
        })
        return result
    }

    const flatFiles = flattenFiles(files)
    const htmlFiles = flatFiles.filter(f => f.path?.toLowerCase().endsWith('.html'))

    useEffect(() => {
        if (htmlFiles.length > 0 && !selectedHtmlFile) {
            // Prefer index.html
            const indexHtml = htmlFiles.find(f => f.path === 'index.html')
            const selectedFile = indexHtml || htmlFiles[0]
            setSelectedHtmlFile(selectedFile.path)
        }
    }, [htmlFiles.length, selectedHtmlFile])

    useEffect(() => {
        if (selectedHtmlFile) {
            loadHtmlContent(selectedHtmlFile)
        }
    }, [selectedHtmlFile])

    const loadHtmlContent = async (filePath: string) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/api/file/${encodeURIComponent(filePath)}`)
            if (!response.ok) {
                throw new Error('Failed to load file')
            }

            const data = await response.json()
            let content = data.content || ''

            // Replace relative CSS/JS paths with API calls
            content = content.replace(
                /(href|src)=["'](?!http|\/\/|#)([^"']+)["']/gi,
                (_match: string, attr: string, path: string) => {
                    const cleanPath = path.startsWith('./') ? path.slice(2) : path
                    return `${attr}="${API_URL}/api/preview/${encodeURIComponent(cleanPath)}"`
                }
            )

            // Inject theme if dark mode
            if (theme === 'dark') {
                // Add a style tag for dark theme background
                const darkThemeStyle = `
          <style>
            body { 
              background-color: #1a1a1a !important; 
              color: #e5e5e5 !important; 
            }
          </style>
        `
                content = content.replace('</head>', `${darkThemeStyle}</head>`)
            }

            setHtmlContent(content)
        } catch (err) {
            console.error('Failed to load HTML:', err)
            setError('Failed to load preview')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = () => {
        if (selectedHtmlFile) {
            loadHtmlContent(selectedHtmlFile)
        }
    }

    if (htmlFiles.length === 0) {
        return (
            <div className={`h-full flex items-center justify-center ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-500'
            }`}>
                <div className="text-center">
                    <AlertCircle size={48} className={`mx-auto mb-4 ${
                        theme === 'light' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <p className="text-lg mb-2">No HTML files to preview</p>
                    <p className="text-sm">Generate a project with HTML to use preview mode</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Loading preview...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`h-full flex items-center justify-center ${
                theme === 'light' ? 'text-red-600' : 'text-red-400'
            }`}>
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4" />
                    <p className="text-lg mb-2">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            theme === 'light'
                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Preview Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
                theme === 'light' 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-900 border-gray-800'
            }`}>
                <div className="flex items-center gap-3">
                    {htmlFiles.length > 1 && (
                        <select
                            value={selectedHtmlFile || ''}
                            onChange={(e) => setSelectedHtmlFile(e.target.value)}
                            className={`px-3 py-1.5 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                theme === 'light'
                                    ? 'bg-gray-50 text-gray-900 border-gray-300'
                                    : 'bg-gray-800 text-gray-200 border-gray-700'
                            }`}
                            title="Select HTML file to preview"
                        >
                            {htmlFiles.map(file => (
                                <option key={file.path} value={file.path}>
                                    {file.path}
                                </option>
                            ))}
                        </select>
                    )}
                    <span className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                        {selectedHtmlFile}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className={`p-2 rounded transition-colors ${
                            theme === 'light'
                                ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                        title="Refresh preview"
                    >
                        <RefreshCw size={18} />
                    </button>

                    <a
                        href={`${API_URL}/api/preview/${encodeURIComponent(selectedHtmlFile || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded transition-colors ${
                            theme === 'light'
                                ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                        title="Open in new tab"
                    >
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>

            {/* Preview Content */}
            <div className={`flex-1 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
                <iframe
                    srcDoc={htmlContent}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                    title="Preview"
                />
            </div>
        </div>
    )
}
