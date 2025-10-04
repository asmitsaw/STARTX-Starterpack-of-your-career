import React from 'react'

const TranscriptPane = ({ items = [], interim = '' }) => {
	return (
		<div className="h-64 overflow-y-auto p-3 bg-slate-900 border border-slate-800 rounded">
			{items.length === 0 && (
				<p className="text-sm text-slate-400">Transcript will appear here...</p>
			)}
			<ul className="space-y-2">
				{items.map((m, idx) => (
					<li key={idx} className="text-sm">
						<span className={`font-medium ${m.speaker === 'ai' ? 'text-sky-400' : 'text-slate-100'}`}>
							{m.speaker === 'ai' ? 'Interviewer' : 'You'}:
						</span>
						<span className="ml-2 text-slate-300">{m.text}</span>
					</li>
				))}
				{interim && (
					<li className="text-sm">
						<span className="font-medium text-slate-100">You:</span>
						<span className="ml-2 text-slate-400">{interim}</span>
					</li>
				)}
			</ul>
		</div>
	)
}

export default TranscriptPane