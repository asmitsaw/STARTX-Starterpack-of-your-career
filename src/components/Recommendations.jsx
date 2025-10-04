import React, { useEffect, useState } from 'react'

const Recommendations = ({ sessionId = 'boot' }) => {
	const [items, setItems] = useState({ courses: [], articles: [] })

	useEffect(() => {
		fetch(`/api/interview/session/${sessionId}/recommendations`).then(r => r.json()).then(setItems).catch(() => setItems({ courses: [], articles: [] }))
	}, [sessionId])

	return (
		<div className="p-4 bg-white border border-gray-200 rounded space-y-3">
			<h3 className="font-medium text-slate-900">Recommendations</h3>
			<div>
				<p className="text-sm font-semibold text-slate-700 mb-1">Courses</p>
				<ul className="space-y-1">
					{items.courses.map(c => (
						<li key={c.id} className="text-sm flex items-center justify-between">
							<span>{c.title}</span>
							<a className="text-blue-600 hover:underline" href={`/course?select=${c.id}`}>View</a>
						</li>
					))}
				</ul>
			</div>
			<div>
				<p className="text-sm font-semibold text-slate-700 mb-1">Articles</p>
				<ul className="space-y-1">
					{items.articles.map((a, idx) => (
						<li key={idx} className="text-sm">
							<a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default Recommendations
