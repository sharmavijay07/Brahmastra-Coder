import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'

interface FileInfo {
    path: string
    type: 'file' | 'directory'
    children?: FileInfo[]
}

interface FileExplorerProps {
    files: FileInfo[]
    onFileSelect: (path: string) => void
    selectedFile: string | null
    theme?: 'light' | 'dark'
}

interface FileTreeItemProps {
    item: FileInfo
    level: number
    onFileSelect: (path: string) => void
    selectedFile: string | null
    theme?: 'light' | 'dark'
}

function FileTreeItem({ item, level, onFileSelect, selectedFile, theme = 'dark' }: FileTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const isSelected = selectedFile === item.path
    const hasChildren = item.children && item.children.length > 0

    const handleClick = () => {
        if (item.type === 'directory') {
            setIsExpanded(!isExpanded)
        } else {
            onFileSelect(item.path)
        }
    }

    const fileName = item.path.split('/').pop() || item.path

    return (
        <div>
            <div
                onClick={handleClick}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
                    isSelected 
                        ? 'bg-blue-600 text-white' 
                        : theme === 'light'
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-300 hover:bg-gray-800'
                }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {item.type === 'directory' ? (
                    <>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {isExpanded ? (
                            <FolderOpen size={16} className={isSelected ? 'text-white' : 'text-blue-500'} />
                        ) : (
                            <Folder size={16} className={isSelected ? 'text-white' : 'text-blue-500'} />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-4" />
                        <File size={16} className={isSelected ? 'text-white' : theme === 'light' ? 'text-gray-500' : 'text-gray-400'} />
                    </>
                )}
                <span className="text-sm truncate">{fileName}</span>
            </div>
            {item.type === 'directory' && isExpanded && hasChildren && (
                <div>
                    {item.children!.map((child, idx) => (
                        <FileTreeItem
                            key={child.path + idx}
                            item={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                            theme={theme}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function FileExplorer({ files, onFileSelect, selectedFile, theme = 'dark' }: FileExplorerProps) {
    return (
        <div className="h-full flex flex-col">
            <div className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                    Files
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className={`px-4 py-8 text-center text-sm ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                        No files yet. Generate a project to see files here.
                    </div>
                ) : (
                    files.map((file, idx) => (
                        <FileTreeItem
                            key={file.path + idx}
                            item={file}
                            level={0}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                            theme={theme}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
