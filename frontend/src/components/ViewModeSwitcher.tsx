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
    if (!hasHtmlFile) return null

    return (
        <div className={`flex items-center gap-2 rounded-lg p-1 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
            {/* View Mode Toggle */}
            <div className={`flex rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
                <button
                    onClick={() => onViewModeChange('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'code'
                            ? 'bg-blue-600 text-white'
                            : theme === 'light'
                                ? 'text-gray-600 hover:text-gray-900'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <Code size={16} />
                    Code
                </button>
                <button
                    onClick={() => onViewModeChange('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'preview'
                            ? 'bg-blue-600 text-white'
                            : theme === 'light'
                                ? 'text-gray-600 hover:text-gray-900'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <Eye size={16} />
                    Preview
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
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        </div>
    )
}
