import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InterviewLayout from '../components/InterviewLayout';

const InterviewDashboard = () => {
  // Mock data for the dashboard
  const stats = {
    totalInterviews: 30,
    completedInterviews: 3,
    inProgress: 27,
    averageScore: 8.3,
    weeklyGrowth: '+12%',
  };

  const recentInterviews = [
    { id: 1, name: 'atharva', role: 'software engineer', type: 'Technical', date: 'Sep 15', status: 'in progress' },
    { id: 2, name: 'atharva', role: 'software engineer', type: 'Technical', date: 'Sep 15', status: 'in progress' },
    { id: 3, name: 'atharva', role: 'software engineer', type: 'Technical', date: 'Sep 15', status: 'in progress' },
    { id: 4, name: 'atharva', role: 'software engineer', type: 'Technical', date: 'Sep 15', status: 'in progress' },
  ];

  const interviewTypes = [
    { type: 'Technical', count: 29, percentage: '97%' },
    { type: 'Behavioral', count: 1, percentage: '3%' },
  ];

  return (
    <InterviewLayout>
      <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Interview Dashboard</h1>
        <p className="text-slate-600">AI-powered interview management and analytics</p>
        <Link 
          to="/new-interview" 
          className="btn-primary flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Start New Interview
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700">Total Interviews</h3>
            <div className="rounded-full bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-3-4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <h2 className="text-3xl font-bold">{stats.totalInterviews}</h2>
            <p className="ml-2 text-xs text-blue-500">+{stats.weeklyGrowth} this week</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700">Completed</h3>
            <div className="rounded-full bg-green-100 p-2">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <h2 className="text-3xl font-bold">{stats.completedInterviews}</h2>
            <p className="ml-2 text-xs text-green-500">{stats.completedInterviews}/{stats.totalInterviews} interviews</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700">In Progress</h3>
            <div className="rounded-full bg-orange-100 p-2">
              <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <h2 className="text-3xl font-bold">{stats.inProgress}</h2>
            <p className="ml-2 text-xs text-orange-500">Active sessions</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700">Avg Score</h3>
            <div className="rounded-full bg-purple-100 p-2">
              <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <h2 className="text-3xl font-bold">{stats.averageScore}/10</h2>
            <p className="ml-2 text-xs text-purple-500">Overall performance</p>
          </div>
        </div>
      </div>

      {/* Recent Interviews and Interview Types */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recent Interviews</h3>
            <Link to="/activity" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {recentInterviews.map((interview) => (
                  <tr key={interview.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {interview.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-900">{interview.name}</p>
                          <p className="text-xs text-slate-500">{interview.role} • {interview.type} • {interview.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {interview.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-4">
            <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            <h3 className="text-lg font-medium">Interview Types</h3>
          </div>
          <div className="space-y-4">
            {interviewTypes.map((type) => (
              <div key={type.type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full ${type.type === 'Technical' ? 'bg-blue-500' : 'bg-green-500'} mr-2`}></div>
                  <span className="text-sm font-medium">{type.type}</span>
                </div>
                <div className="text-sm text-slate-600">
                  {type.count} <span className="text-xs text-slate-400">({type.percentage})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Link to="/new-interview" className="flex items-center p-2 rounded-lg hover:bg-slate-50">
                <svg className="h-5 w-5 text-slate-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Schedule Interview</span>
              </Link>
              <Link to="/activity" className="flex items-center p-2 rounded-lg hover:bg-slate-50">
                <svg className="h-5 w-5 text-slate-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">View All Interviews</span>
              </Link>
              <Link to="/interview-analytics" className="flex items-center p-2 rounded-lg hover:bg-slate-50">
                <svg className="h-5 w-5 text-slate-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-sm">View Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </InterviewLayout>
  );
};

export default InterviewDashboard;