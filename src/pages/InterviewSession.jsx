import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InterviewTwoPane from '../components/InterviewTwoPane';
import InterviewLayout from '../components/InterviewLayout';

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [interviewParams, setInterviewParams] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  // overlay only; inner component handles mic/cam/editor/transcript
  
  useEffect(() => {
    // Get interview parameters from location state
    if (location.state?.interviewParams) {
      setInterviewParams(location.state.interviewParams);
    } else {
      // If no parameters are provided, redirect back to the mock interview page
      navigate('/mock');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!isFullscreen) return;
    // No key bindings here; inner component manages its own controls
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('session-active');
    } else {
      document.body.classList.remove('session-active');
    }
  }, [isFullscreen]);

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

  if (isFullscreen && interviewParams) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-lg text-slate-100">
        <div className="h-screen w-screen p-2 sm:p-4">
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
            company={interviewParams.company}
          />
        </div>
      </div>
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

      <div className="grid gap-0 lg:grid-cols-1">
        <div className="lg:col-span-1">
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
          {/* Fullscreen session auto-opens; manual trigger removed per spec */}
        </div>
      </div>
      </div>
    </InterviewLayout>
  );
};

export default InterviewSession;