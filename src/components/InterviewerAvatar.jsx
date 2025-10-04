import React from 'react'

const InterviewerAvatar = ({ speaking = false, level = 0 }) => {
	return (
		<div className="flex items-center gap-3">
    	<div className={`h-12 w-12 rounded-full bg-sky-600 flex items-center justify-center text-white font-semibold ${speaking ? 'ring-4 ring-sky-500 animate-pulse' : ''}`}>
				AI
			</div>
			<div className="flex-1">
				<p className="text-sm font-medium text-slate-100">Interviewer</p>
				<p className="text-xs text-slate-400">Voice assistant</p>
			</div>
			{/* Audio level indicator */}
			<div className="w-16 h-4 bg-slate-700 rounded-full overflow-hidden">
				<div 
					className="h-full bg-sky-500 transition-all duration-100"
					style={{ width: `${Math.max(8, level * 100)}%` }}
				/>
			</div>
		</div>
	)
}

export default InterviewerAvatar