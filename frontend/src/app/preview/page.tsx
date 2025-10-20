'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, X } from 'lucide-react'

export default function PreviewPage() {
    const [files, setFiles] = useState<any[]>([])
    const [htmlFile, setHtmlFile] = useState<string | null>(null)
    const [htmlContent, setHtmlContent] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost:8000/api/files')
            const data = await response.json()

            // Flatten the file tree
            const flatFiles = flattenFiles(data.files || [])
            setFiles(flatFiles)

            // Find HTML file (prefer index.html)
            const indexHtml = flatFiles.find(f => f.path === 'index.html')
            const anyHtml = flatFiles.find(f => f.path.toLowerCase().endsWith('.html'))
            const selectedFile = indexHtml || anyHtml

            if (selectedFile) {
                setHtmlFile(selectedFile.path)
                await loadHtmlContent(selectedFile.path)
            }
        } catch (error) {
            console.error('Failed to fetch files:', error)
        } finally {
            setLoading(false)
        }
    }

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

    const loadHtmlContent = async (filePath: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/file/${encodeURIComponent(filePath)}`)
            const data = await response.json()

            // Inject base tag to handle relative paths
            let content = data.content || ''

            // Replace relative CSS/JS paths with API calls
            content = content.replace(
                /(href|src)=["'](?!http|\/\/|#)([^"']+)["']/gi,
                (_match: string, attr: string, path: string) => {
                    const cleanPath = path.startsWith('./') ? path.slice(2) : path
                    return `${attr}="http://localhost:8000/api/preview/${encodeURIComponent(cleanPath)}"`
                }
            )

            setHtmlContent(content)
        } catch (error) {
            console.error('Failed to load HTML:', error)
        }
    }

    const handleRefresh = () => {
        if (htmlFile) {
            loadHtmlContent(htmlFile)
        } else {
            fetchFiles()
        }
    }

    const handleSelectFile = async (filePath: string) => {
        setHtmlFile(filePath)
        await loadHtmlContent(filePath)
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading preview...</p>
                </div>
            </div>
        )
    }

    if (!htmlFile) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-100">
                <div className="text-center">
                    <p className="text-xl mb-4">No HTML file found</p>
                    <button
                        onClick={() => window.close()}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        )
    }

    const htmlFiles = files.filter(f => f.path.toLowerCase().endsWith('.html'))

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-white font-semibold">Preview</h1>

                    {htmlFiles.length > 1 && (
                        <select
                            value={htmlFile}
                            onChange={(e) => handleSelectFile(e.target.value)}
                            className="bg-gray-700 text-white px-3 py-1.5 rounded border border-gray-600 text-sm"
                            title="Select HTML file to preview"
                        >
                            {htmlFiles.map(file => (
                                <option key={file.path} value={file.path}>
                                    {file.path}
                                </option>
                            ))}
                        </select>
                    )}

                    <span className="text-gray-400 text-sm">{htmlFile}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                        title="Refresh preview"
                    >
                        <RefreshCw size={18} />
                    </button>

                    <a
                        href={`http://localhost:8000/api/file/${encodeURIComponent(htmlFile)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink size={18} />
                    </a>

                    <button
                        onClick={() => window.close()}
                        className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                        title="Close preview"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-white">
                <iframe
                    srcDoc={htmlContent}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title="Preview"
                />
            </div>
        </div>
    )
}
