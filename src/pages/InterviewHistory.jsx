import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InterviewLayout from '../components/InterviewLayout';

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/interview/sessions')
        const rows = await res.json()
        const mapped = rows.map(r => ({
          id: r.id,
          candidateName: r.candidate_name || r.user_id || '—',
          position: r.role || '—',
          date: new Date(r.created_at).toISOString().slice(0,10),
          type: r.mode || '—',
          score: '—',
          status: 'Completed'
        }))
        setInterviews(mapped)
      } catch (e) {
        setInterviews([])
      }
    })()
  }, [])

  return (
    <InterviewLayout>
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Interview History</h1>
          <Link to="/new-interview" className="px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Interview
          </Link>
        </div>

        <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-800">
                {interviews.map((interview) => (
                  <tr key={interview.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">{interview.candidateName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">{interview.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">{interview.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${interview.type === 'Technical' ? 'bg-sky-900/50 text-sky-300' : 
                          interview.type === 'Behavioral' ? 'bg-emerald-900/50 text-emerald-300' : 
                          'bg-violet-900/50 text-violet-300'}`}>
                        {interview.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">{interview.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-900/50 text-emerald-300">
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-sky-400 hover:text-sky-300 mr-3">View</button>
                      <button className="text-slate-400 hover:text-slate-300">Export</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </InterviewLayout>
  );
};

export default InterviewHistory;