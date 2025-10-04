import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InterviewTwoPane from '../components/InterviewTwoPane';
import InterviewLayout from '../components/InterviewLayout';

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [interviewParams, setInterviewParams] = useState(null);
  
  useEffect(() => {
    // Get interview parameters from location state
    if (location.state?.interviewParams) {
      setInterviewParams(location.state.interviewParams);
    } else {
      // If no parameters are provided, redirect back to the mock interview page
      navigate('/mock');
    }
  }, [location, navigate]);

  const handleInterviewComplete = (interviewHistory) => {
    // In a real app, we would save the interview results to a database
    // For now, we'll just navigate back to the interview dashboard
    navigate('/interview-dashboard', { 
      state: { 
        interviewCompleted: true,
        interviewHistory 
      } 
    });
  };

  if (!interviewParams) {
    return (
      <InterviewLayout>
        <div className="px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-startx-200 mb-4"></div>
              <div className="h-4 w-48 bg-startx-100 rounded mb-2"></div>
              <div className="h-3 w-36 bg-startx-50 rounded"></div>
            </div>
          </div>
        </div>
      </InterviewLayout>
    );
  }

  return (
    <InterviewLayout>
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">
            {interviewParams.mode} Interview: {interviewParams.role}
          </h1>
          <button 
            onClick={() => navigate('/interview-dashboard')} 
            className="px-3 py-2 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Exit Interview
          </button>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InterviewTwoPane 
            role={interviewParams.role} 
            mode={interviewParams.mode} 
            experience={interviewParams.experience}
            candidateName={interviewParams.candidateName}
            questionCount={interviewParams.questionCount}
            timeDuration={interviewParams.timeDuration}
            level={interviewParams.level}
            email={interviewParams.email}
            notes={interviewParams.notes}
          />
        </div>
        
        <div className="p-4 bg-slate-900 border border-slate-800 rounded">
          <h3 className="text-lg font-medium mb-3 text-slate-100">Interview Tips</h3>
          
          {interviewParams.mode === 'Technical' && (
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2"><span>💡</span> Explain your thought process clearly</li>
              <li className="flex items-start gap-2"><span>💡</span> Consider time and space complexity</li>
              <li className="flex items-start gap-2"><span>💡</span> Discuss alternative approaches</li>
              <li className="flex items-start gap-2"><span>💡</span> Ask clarifying questions when needed</li>
              <li className="flex items-start gap-2"><span>💡</span> Test your solution with examples</li>
            </ul>
          )}
          
          {interviewParams.mode === 'Behavioral' && (
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2"><span>💡</span> Use the STAR method (Situation, Task, Action, Result)</li>
              <li className="flex items-start gap-2"><span>💡</span> Be specific with examples</li>
              <li className="flex items-start gap-2"><span>💡</span> Quantify your achievements when possible</li>
              <li className="flex items-start gap-2"><span>💡</span> Show self-awareness and growth mindset</li>
              <li className="flex items-start gap-2"><span>💡</span> Connect your experiences to the role</li>
            </ul>
          )}
          
          {interviewParams.mode === 'System Design' && (
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2"><span>💡</span> Clarify requirements and constraints</li>
              <li className="flex items-start gap-2"><span>💡</span> Start with a high-level design</li>
              <li className="flex items-start gap-2"><span>💡</span> Discuss trade-offs in your approach</li>
              <li className="flex items-start gap-2"><span>💡</span> Consider scalability and reliability</li>
              <li className="flex items-start gap-2"><span>💡</span> Address potential bottlenecks</li>
            </ul>
          )}
        </div>
      </div>
      </div>
    </InterviewLayout>
  );
};

export default InterviewSession;