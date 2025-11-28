import React, { useState } from 'react'
import CodeEditor from './CodeEditor'

const QuestionPanel = ({ question, onSubmit }) => {
    const [selected, setSelected] = useState(null)
    const [code, setCode] = useState('')
    const [text, setText] = useState('')
    const [showSolution, setShowSolution] = useState(false)
    const [showEditor, setShowEditor] = useState(false)
    const [allowTyping, setAllowTyping] = useState(false)

	console.log('QuestionPanel received question:', question)

	if (!question) {
		return (
			<div className="p-4 bg-slate-800 rounded-lg">
				<p className="text-sm text-slate-200">Waiting for next question...</p>
			</div>
		)
	}

    const submit = () => {
        const payload = question.type === 'mcq' ? { choice: selected } : question.type === 'coding' ? { code } : { text }
		onSubmit?.({ questionId: question.id, ...payload })
		// Reset form
		setSelected(null)
		setCode('')
		setText('')
		setShowSolution(false)
        setShowEditor(false)
        setAllowTyping(false)
	}

	const isCorrect = question.type === 'mcq' && selected === question.correct

	return (
		<div className="p-4 bg-slate-800 rounded-lg space-y-4 min-h-[400px]">
			<div className="flex justify-between items-start">
				<h3 className="font-medium text-white text-lg flex-1 mr-4">
					{question.question || question.prompt}
				</h3>
				{question.type === 'mcq' && (
					<span className="text-xs text-slate-200 bg-slate-600 px-2 py-1 rounded flex-shrink-0">MCQ</span>
				)}
				{question.type === 'coding' && (
					<span className="text-xs text-slate-200 bg-slate-600 px-2 py-1 rounded flex-shrink-0">CODING</span>
				)}
				{question.type === 'text' && (
					<span className="text-xs text-slate-200 bg-slate-600 px-2 py-1 rounded flex-shrink-0">TEXT</span>
				)}
			</div>

			{question.type === 'mcq' && (
				<div className="space-y-3">
					{question.options?.map((opt, idx) => (
						<label key={idx} className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${
							selected === idx 
								? (isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500')
								: 'bg-slate-700 hover:bg-slate-600 border-slate-600'
						}`}>
							<input 
								type="radio" 
								name="mcq" 
								checked={selected === idx} 
								onChange={() => setSelected(idx)}
								className="w-5 h-5 text-blue-600"
							/>
							<span className="text-white text-base">{opt}</span>
						</label>
					))}
					{selected !== null && question.explanation && (
						<div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
							<p className={`text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
								{isCorrect ? '✓ Correct!' : '✗ Incorrect.'} {question.explanation}
							</p>
						</div>
					)}
				</div>
			)}

            {question.type === 'coding' && (
                <div className="space-y-3">
                    {!showEditor ? (
                        <button
                            onClick={() => setShowEditor(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            Open Code Editor
                        </button>
                    ) : (
                        <CodeEditor value={code} onChange={setCode} language={question.language || 'javascript'} />
                    )}
					{question.solution && (
						<div className="space-y-2">
							<button 
								onClick={() => setShowSolution(!showSolution)}
								className="text-sm text-blue-400 hover:text-blue-300"
							>
								{showSolution ? 'Hide' : 'Show'} Solution
							</button>
							{showSolution && (
								<pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
									<code>{question.solution}</code>
								</pre>
							)}
						</div>
					)}
				</div>
			)}

            {question.type === 'text' && (
                <div className="space-y-3">
                    {!allowTyping && (
                        <div className="text-sm text-slate-300">
                            Answer verbally. Your microphone input is being transcribed in real-time.
                            <button onClick={() => setAllowTyping(true)} className="ml-2 text-blue-400 hover:text-blue-300">Type instead</button>
                        </div>
                    )}
                    {allowTyping && (
                        <>
                            <textarea 
                                className="w-full bg-slate-700 text-white border border-slate-500 rounded-lg p-4 text-base resize-none" 
                                rows={8} 
                                value={text} 
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type your detailed answer here..."
                            />
                            <p className="text-sm text-slate-300">{text.length} characters</p>
                        </>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
				{question.type === 'mcq' && selected !== null && (
					<p className="text-sm text-slate-200">
						Selected: {question.options[selected]}
					</p>
				)}
                {question.type !== 'text' && (
                    <button 
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                            (question.type === 'mcq' && selected === null) || (question.type === 'coding' && (!code || code.trim() === ''))
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        onClick={submit}
                        disabled={(question.type === 'mcq' && selected === null) || (question.type === 'coding' && (!code || code.trim() === ''))}
                    >
                        Submit Answer
                    </button>
                )}
			</div>
		</div>
	)
}

export default QuestionPanel