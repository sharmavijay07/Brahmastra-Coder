import { useState } from 'react'
import { Send } from 'lucide-react'

interface PromptInputProps {
    onGenerate: (prompt: string) => void
    disabled?: boolean
    theme?: 'light' | 'dark'
}

export default function PromptInput({ onGenerate, disabled, theme = 'dark' }: PromptInputProps) {
    const [prompt, setPrompt] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (prompt.trim() && !disabled) {
            onGenerate(prompt.trim())
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label
                    htmlFor="prompt"
                    className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                >
                    Project Description
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your project... (e.g., Create a todo app with HTML, CSS, and JavaScript)"
                    className={`w-full h-24 sm:h-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base ${theme === 'light'
                        ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        : 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                        }`}
                    disabled={disabled}
                />
            </div>
            <button
                type="submit"
                disabled={disabled || !prompt.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                {disabled ? 'Generating...' : 'Generate Project'}
            </button>
        </form>
    )
}
