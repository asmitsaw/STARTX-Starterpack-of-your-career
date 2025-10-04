import React, { useEffect, useRef } from 'react'

// Lightweight code editor with syntax highlighting
const CodeEditor = ({ value, onChange, language = 'javascript', rows = 12 }) => {
	const ref = useRef(null)
	
	useEffect(() => {
		if (ref.current) ref.current.value = value || ''
	}, [value])

	const getPlaceholder = () => {
		switch (language) {
			case 'javascript':
				return '// Write your JavaScript code here\nfunction example() {\n  return "Hello World";\n}'
			case 'python':
				return '# Write your Python code here\ndef example():\n    return "Hello World"'
			case 'java':
				return '// Write your Java code here\npublic class Example {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}'
			default:
				return '// Write your code here'
		}
	}

	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				<span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
					{language.toUpperCase()}
				</span>
				<div className="text-xs text-slate-500">
					Lines: {value ? value.split('\n').length : 1}
				</div>
			</div>
			<textarea
				ref={ref}
				className="w-full font-mono text-sm bg-slate-900 text-slate-100 border border-slate-600 rounded p-4 resize-none focus:border-blue-500 focus:outline-none"
				rows={rows}
				onChange={(e) => onChange?.(e.target.value)}
				spellCheck={false}
				placeholder={getPlaceholder()}
				style={{ 
					fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
					lineHeight: '1.5'
				}}
			/>
		</div>
	)
}

export default CodeEditor
