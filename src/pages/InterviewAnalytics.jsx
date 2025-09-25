import React from 'react';
import { Link } from 'react-router-dom';
import InterviewLayout from '../components/InterviewLayout';

const InterviewAnalytics = () => {
  // Mock data for analytics
  const stats = {
    averageScore: 8.3,
    totalInterviews: 3,
    hireRate: '100.0%',
    topInterviewType: 'technical',
  };

  const scoreDistribution = [
    { range: '0-2', count: 0 },
    { range: '3-4', count: 0 },
    { range: '5-6', count: 0 },
    { range: '7-8', count: 1 },
    { range: '9-10', count: 1 },
  ];

  const weeklyTrends = [
    { date: 'Jul 27', total: 0, completed: 0 },
    { date: 'Aug 3', total: 0, completed: 0 },
    { date: 'Aug 10', total: 0, completed: 0 },
    { date: 'Aug 17', total: 0, completed: 0 },
    { date: 'Aug 24', total: 0, completed: 0 },
    { date: 'Aug 31', total: 0, completed: 0 },
    { date: 'Sep 7', total: 0, completed: 0 },
    { date: 'Sep 14', total: 30, completed: 3 },
  ];

  // Helper function to calculate bar width percentage
  const getBarWidth = (count, maxCount) => {
    if (maxCount === 0) return '0%';
    return `${(count / maxCount) * 100}%`;
  };

  // Find max count for score distribution
  const maxScoreCount = Math.max(...scoreDistribution.map(item => item.count), 1);

  // Find max count for weekly trends
  const maxTrendCount = Math.max(...weeklyTrends.map(item => item.total), 1);

  return (
    <InterviewLayout>
      <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Interview Analytics</h1>
        <p className="text-slate-600">Comprehensive insights into interview performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Average Score</h3>
            <div className="rounded-full bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold">{stats.averageScore}/10</h2>
          <p className="text-xs text-slate-500">Across all interviews</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Total Interviews</h3>
            <div className="rounded-full bg-green-100 p-2">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000 16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-3-4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold">{stats.totalInterviews}</h2>
          <p className="text-xs text-slate-500">Completed interviews</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Hire Rate</h3>
            <div className="rounded-full bg-purple-100 p-2">
              <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold">{stats.hireRate}</h2>
          <p className="text-xs text-slate-500">Positive recommendations</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Top Interview Type</h3>
            <div className="rounded-full bg-orange-100 p-2">
              <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-orange-500">{stats.topInterviewType}</h2>
          <p className="text-xs text-slate-500">Most common type</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-lg font-medium">Score Distribution</h3>
          </div>
          <div className="space-y-4">
            {scoreDistribution.map((item) => (
              <div key={item.range} className="flex items-center">
                <div className="w-12 text-sm text-slate-600">{item.range}</div>
                <div className="flex-1 mx-2">
                  <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full" 
                      style={{ width: getBarWidth(item.count, maxScoreCount) }}
                    ></div>
                  </div>
                </div>
                <div className="w-6 text-right text-sm text-slate-600">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Interview Trends */}
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium">Weekly Interview Trends</h3>
          </div>
          <div className="space-y-4">
            {weeklyTrends.map((item) => (
              <div key={item.date} className="flex items-center">
                <div className="w-16 text-sm text-slate-600">{item.date}</div>
                <div className="flex-1 mx-2">
                  <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: getBarWidth(item.completed, maxTrendCount) }}
                      ></div>
                      <div 
                        className="h-full bg-blue-400" 
                        style={{ width: getBarWidth(item.total - item.completed, maxTrendCount) }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-12 text-right text-sm text-slate-600">
                  {item.total > 0 ? `${item.completed}/${item.total}` : '0/0'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end">
            <div className="flex items-center mr-4">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs text-slate-600">Total</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-blue-400 rounded-full mr-1"></div>
              <span className="text-xs text-slate-600">Completed</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </InterviewLayout>
  );
};

export default InterviewAnalytics;