interface CodeEditorProps {
    content: string
    fileName?: string
    theme?: 'light' | 'dark'
}

function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        yml: 'yaml',
        yaml: 'yaml',
        xml: 'xml',
        sql: 'sql',
        sh: 'shell',
        bash: 'shell',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        go: 'go',
        rs: 'rust',
        php: 'php',
        rb: 'ruby',
    }
    return languageMap[ext || ''] || 'plaintext'
}

export default function CodeEditor({ content, fileName, theme = 'dark' }: CodeEditorProps) {
    // Lightweight, dependency-free code viewer
    return (
        <div className="h-full flex flex-col">
            {fileName && (
                <div className={`px-4 py-3 border-b ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
                    }`}>
                    <h2 className={`text-sm font-medium truncate ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                        {fileName}
                    </h2>
                </div>
            )}
            <div className={`flex-1 overflow-auto ${theme === 'light' ? 'bg-white' : 'bg-gray-950'}`}>
                {!fileName ? (
                    <div className={`h-full flex items-center justify-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                        <div className="text-center">
                            <p className="text-lg mb-2">No file selected</p>
                            <p className="text-sm">Select a file from the explorer to view its contents</p>
                        </div>
                    </div>
                ) : (
                    <pre className={`h-full w-full p-4 text-sm whitespace-pre-wrap break-words ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>
<code>{content}</code>
                    </pre>
                )}
            </div>
        </div>
    )
}
