import { Code, Eye, Sun, Moon } from 'lucide-react'

interface ViewModeSwitcherProps {
    viewMode: 'code' | 'preview'
    onViewModeChange: (mode: 'code' | 'preview') => void
    theme: 'light' | 'dark'
    onThemeChange: (theme: 'light' | 'dark') => void
    hasHtmlFile: boolean
}

export default function ViewModeSwitcher({
    viewMode,
    onViewModeChange,
    theme,
    onThemeChange,
    hasHtmlFile
}: ViewModeSwitcherProps) {
    return (
        <div className={`flex items-center gap-1 sm:gap-2 rounded-lg p-1 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
            {/* View Mode Toggle - Always visible */}
            <div className={`flex rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
                <button
                    onClick={() => onViewModeChange('code')}
                    disabled={!hasHtmlFile && viewMode === 'preview'}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'code'
                        ? 'bg-blue-600 text-white'
                        : theme === 'light'
                            ? 'text-gray-600 hover:text-gray-900'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <Code size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Code</span>
                </button>
                <button
                    onClick={() => onViewModeChange('preview')}
                    disabled={!hasHtmlFile}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'preview'
                        ? 'bg-blue-600 text-white'
                        : theme === 'light'
                            ? 'text-gray-600 hover:text-gray-900'
                            : 'text-gray-400 hover:text-gray-200'
                        } ${!hasHtmlFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!hasHtmlFile ? 'Generate a project with HTML to enable preview' : ''}
                >
                    <Eye size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Preview</span>
                </button>
            </div>

            {/* Theme Toggle - always visible */}
            <button
                onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                className={`p-1.5 transition-colors ${theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-gray-200'
                    }`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? <Moon size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Sun size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
        </div>
    )
}
