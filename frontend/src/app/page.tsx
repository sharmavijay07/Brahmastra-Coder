'use client'

import { useState, useEffect } from 'react'
import PromptInput from '@/components/PromptInput'
import FileExplorer from '@/components/FileExplorer'
import CodeEditor from '@/components/CodeEditor'
import InlinePreview from '@/components/InlinePreview'
import ActivityLog from '@/components/ActivityLog'
import StatusBar from '@/components/StatusBar'
import ViewModeSwitcher from '@/components/ViewModeSwitcher'
import CompletionNotification from '@/components/CompletionNotification'
import PreviewButton from '@/components/PreviewButton'
import { useProjectGeneration } from '@/hooks/useProjectGeneration'

// Get API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'code' | 'preview'>('code')
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeMobilePanel, setActiveMobilePanel] = useState<'prompt' | 'files' | 'editor'>('prompt')

    const {
        files,
        fileContent,
        logs,
        status,
        error,
        generateProject,
        fetchFileContent,
        isConnected
    } = useProjectGeneration()

    // Apply theme to body element
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.remove('dark')
            document.body.classList.add('light')
        } else {
            document.body.classList.remove('light')
            document.body.classList.add('dark')
        }
    }, [theme])

    // Check if project has HTML files
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

    const hasHtmlFile = flattenFiles(files).some(f =>
        f.path?.toLowerCase().endsWith('.html')
    )

    const handleFileSelect = async (filePath: string) => {
        setSelectedFile(filePath)
        await fetchFileContent(filePath)
    }

    const handlePreview = () => {
        setViewMode('preview')
    }

    const handleOpenFolder = async () => {
        try {
            await fetch(`${API_URL}/api/open-folder`, { method: 'POST' })
        } catch (error) {
            console.error('Failed to open folder:', error)
        }
    }

    // Auto-switch to preview when generation completes (if HTML exists)
    useEffect(() => {
        if (status === 'completed' && hasHtmlFile) {
            // Optional: auto-switch to preview
            // setViewMode('preview')
        }
    }, [status, hasHtmlFile])

    return (
        <div className={`h-screen flex flex-col ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-950 text-gray-100'}`}>
            {/* Completion Notification */}
            <CompletionNotification
                status={status}
                files={files}
                onPreview={handlePreview}
                onOpenFolder={handleOpenFolder}
            />

            {/* Header */}
            <header className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border-b px-4 md:px-6 py-3 md:py-4`}>
                <div className="flex items-center justify-between">
                    <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Brahmastra Coder
                    </h1>
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Preview and Open Folder Buttons */}
                        <PreviewButton status={status} files={files} />

                        <ViewModeSwitcher
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            theme={theme}
                            onThemeChange={setTheme}
                            hasHtmlFile={hasHtmlFile}
                        />
                        {/* Connection Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-xs md:text-sm hidden sm:inline ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Panel Selector */}
            <div className={`md:hidden flex border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'}`}>
                <button
                    onClick={() => {
                        setActiveMobilePanel('prompt')
                        console.log('Switched to prompt panel')
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activeMobilePanel === 'prompt'
                            ? theme === 'light'
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-b-2 border-blue-500 text-blue-400 bg-blue-950'
                            : theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800'
                        }`}
                >
                    Prompt
                </button>
                <button
                    onClick={() => {
                        setActiveMobilePanel('files')
                        console.log('Switched to files panel')
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activeMobilePanel === 'files'
                            ? theme === 'light'
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-b-2 border-blue-500 text-blue-400 bg-blue-950'
                            : theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800'
                        }`}
                >
                    Files ({files.length})
                </button>
                <button
                    onClick={() => {
                        setActiveMobilePanel('editor')
                        console.log('Switched to editor panel')
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activeMobilePanel === 'editor'
                            ? theme === 'light'
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-b-2 border-blue-500 text-blue-400 bg-blue-950'
                            : theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800'
                        }`}
                >
                    {viewMode === 'preview' ? 'Preview' : 'Code'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Prompt Input and Activity Log */}
                <div className={`${activeMobilePanel === 'prompt' ? 'flex' : 'hidden'
                    } md:flex w-full md:w-96 flex-col border-r ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'}`}>
                    <div className={`p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                        <PromptInput
                            onGenerate={generateProject}
                            disabled={status === 'generating'}
                            theme={theme}
                        />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ActivityLog logs={logs} theme={theme} />
                    </div>
                </div>

                {/* Middle Panel - File Explorer */}
                <div className={`${activeMobilePanel === 'files' ? 'flex' : 'hidden'
                    } md:flex w-full md:w-64 border-r ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'}`}>
                    <FileExplorer
                        files={files}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        theme={theme}
                    />
                </div>

                {/* Right Panel - Code Editor or Preview */}
                <div className={`${activeMobilePanel === 'editor' ? 'flex' : 'hidden'
                    } md:flex flex-1 flex-col ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-950'}`}>
                    {viewMode === 'code' ? (
                        <CodeEditor
                            content={fileContent}
                            fileName={selectedFile || undefined}
                            theme={theme}
                        />
                    ) : (
                        <InlinePreview
                            files={files}
                            theme={theme}
                        />
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <StatusBar status={status} error={error} theme={theme} />
        </div>
    )
}
