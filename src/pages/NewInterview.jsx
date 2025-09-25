import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewLayout from '../components/InterviewLayout';

const NewInterview = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    position: '',
    duration: '30 minutes',
    interviewType: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, we would save this data to a database
    // For now, we'll just navigate to the interview session
    navigate('/interview-session', {
      state: {
        interviewParams: {
          role: formData.position,
          experience: 'Mid', // Default to Mid-level
          mode: formData.interviewType,
          candidateName: formData.candidateName
        }
      }
    });
  };

  return (
    <InterviewLayout>
      <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="mb-4 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Setup New Interview</h1>
        <p className="text-slate-600 mt-2">Configure the interview details and AI will handle the rest</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          {/* Candidate Information */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium">Candidate Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="candidateName" className="block text-sm font-medium text-slate-700 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  id="candidateName"
                  name="candidateName"
                  value={formData.candidateName}
                  onChange={handleChange}
                  placeholder="Enter candidate's full name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="candidate@email.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                />
              </div>
            </div>
          </div>

          {/* Interview Configuration */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium">Interview Configuration</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                >
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interview Type */}
          <div className="mb-6">
            <label htmlFor="interviewType" className="block text-sm font-medium text-slate-700 mb-1">Interview Type *</label>
            <select
              id="interviewType"
              name="interviewType"
              value={formData.interviewType}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
              required
            >
              <option value="">Select interview type</option>
              <option value="Technical">Technical</option>
              <option value="Behavioral">Behavioral</option>
              <option value="System Design">System Design</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any specific areas to focus on or additional context..."
              rows="4"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={!formData.candidateName || !formData.position || !formData.interviewType}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Interview
            </button>
          </div>
        </form>
      </div>
      </div>
    </InterviewLayout>
  );
};

export default NewInterview;