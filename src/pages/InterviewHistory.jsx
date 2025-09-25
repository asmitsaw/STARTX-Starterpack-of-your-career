import React from 'react';
import { Link } from 'react-router-dom';
import InterviewLayout from '../components/InterviewLayout';

const InterviewHistory = () => {
  // Mock interview history data
  const interviews = [
    {
      id: 1,
      candidateName: 'John Doe',
      position: 'Frontend Developer',
      date: '2023-05-15',
      type: 'Technical',
      score: 85,
      status: 'Completed'
    },
    {
      id: 2,
      candidateName: 'Jane Smith',
      position: 'Backend Engineer',
      date: '2023-05-14',
      type: 'System Design',
      score: 92,
      status: 'Completed'
    },
    {
      id: 3,
      candidateName: 'Alex Johnson',
      position: 'Full Stack Developer',
      date: '2023-05-12',
      type: 'Behavioral',
      score: 78,
      status: 'Completed'
    },
    {
      id: 4,
      candidateName: 'Sarah Williams',
      position: 'DevOps Engineer',
      date: '2023-05-10',
      type: 'Technical',
      score: 88,
      status: 'Completed'
    },
    {
      id: 5,
      candidateName: 'Michael Brown',
      position: 'Product Manager',
      date: '2023-05-08',
      type: 'Behavioral',
      score: 90,
      status: 'Completed'
    }
  ];

  return (
    <InterviewLayout>
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Interview History</h1>
          <Link to="/new-interview" className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Interview
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{interview.candidateName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{interview.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{interview.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${interview.type === 'Technical' ? 'bg-blue-100 text-blue-800' : 
                          interview.type === 'Behavioral' ? 'bg-green-100 text-green-800' : 
                          'bg-purple-100 text-purple-800'}`}>
                        {interview.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{interview.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-gray-600 hover:text-gray-900">Export</button>
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