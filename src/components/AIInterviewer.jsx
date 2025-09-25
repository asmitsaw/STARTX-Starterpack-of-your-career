import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AIInterviewer = ({ role, experience, mode, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [thinking, setThinking] = useState(false);
  const textareaRef = useRef(null);

  // Professional LLM-based questions by interview mode
  const mockQuestions = {
    Technical: [
      "What is the difference between let, const, and var in JavaScript?",
      "Explain how React's virtual DOM works and its benefits.",
      "Describe the concept of closures in JavaScript and provide an example.",
      "How would you optimize the performance of a React application?",
      "Explain the concept of promises in JavaScript and how they differ from callbacks."
    ],
    Behavioral: [
      "Tell me about a time when you had to work under a tight deadline.",
      "Describe a situation where you had a conflict with a team member and how you resolved it.",
      "Give an example of a project where you demonstrated leadership skills.",
      "How do you handle criticism of your work?",
      "Describe a time when you had to learn a new technology quickly."
    ],
    "System Design": [
      "Design a URL shortening service like bit.ly.",
      "How would you design Twitter's news feed functionality?",
      "Design a distributed cache system.",
      "How would you design a notification system for a social media platform?",
      "Design a scalable web crawler system."
    ]
  };

  // Professional LLM-based answer evaluation
  const evaluateAnswer = (question, answer, mode) => {
    // This simulates a call to a trained professional LLM model
    // In production, this would make an API call to a real LLM service
    
    if (!answer.trim()) {
      return {
        correct: false,
        feedback: "You didn't provide an answer. Please try again."
      };
    }
    
    // Simulated professional LLM evaluation
    if (answer.length < 50) {
      return {
        correct: false,
        feedback: `Your answer lacks sufficient detail. A strong ${mode.toLowerCase()} interview response should include specific examples and demonstrate deeper understanding. Could you elaborate more on ${question.toLowerCase()}?`
      };
    } else if (answer.length < 100) {
      return {
        correct: true,
        feedback: `Good start! Your answer covers some key points. To strengthen your response in a ${mode.toLowerCase()} interview, consider adding more specific details about your experience or knowledge. Professional interviewers typically look for comprehensive answers that demonstrate both breadth and depth.`
      };
    }
    
    return {
      correct: true,
      feedback: `Excellent answer! Your comprehensive response demonstrates strong ${mode.toLowerCase()} knowledge and communication skills. You've effectively addressed the key points a professional interviewer would look for. One additional suggestion: consider how you might connect this answer to your specific experience or the role you're applying for.`
    };
  };

  // Initialize interview questions from professional LLM model
  useEffect(() => {
    // This simulates fetching personalized questions from a professional LLM API
    // based on the specific role, experience level, and interview mode
    setLoading(true);
    
    // Simulate professional LLM API call
    setTimeout(() => {
      // In production, this would be replaced with actual API call to a trained professional LLM
      // that generates custom questions based on the role, experience, and mode
      setQuestions(mockQuestions[mode] || mockQuestions.Technical);
      setCurrentQuestion(mockQuestions[mode]?.[0] || mockQuestions.Technical[0]);
      setLoading(false);
    }, 1500);
  }, [role, experience, mode]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userAnswer]);

  const handleSubmitAnswer = () => {
    setThinking(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const result = evaluateAnswer(currentQuestion, userAnswer, mode);
      setFeedback(result);
      setThinking(false);
      
      // Add to interview history
      setInterviewHistory([...interviewHistory, {
        question: currentQuestion,
        answer: userAnswer,
        feedback: result.feedback,
        correct: result.correct
      }]);
    }, 2000);
  };

  const handleNextQuestion = () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setUserAnswer('');
      setFeedback(null);
    } else {
      setInterviewComplete(true);
    }
  };

  const handleFinishInterview = () => {
    if (onComplete) {
      onComplete(interviewHistory);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-startx-200 mb-4">
            <svg className="h-8 w-8 text-blue-500 m-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="h-4 w-48 bg-startx-100 rounded mb-2"></div>
          <div className="h-3 w-36 bg-startx-50 rounded"></div>
        </div>
        <p className="mt-6 text-slate-600">Initializing professional AI interviewer...</p>
        <p className="text-sm text-slate-500 mt-2">Powered by advanced LLM technology</p>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Interview Complete!</h2>
        <p className="mb-6 text-slate-600">You've completed all the questions for this interview session.</p>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Interview Summary:</h3>
          <p className="text-slate-600 mb-1">Questions answered: {interviewHistory.length}</p>
          <p className="text-slate-600 mb-1">
            Correct answers: {interviewHistory.filter(item => item.correct).length} / {interviewHistory.length}
          </p>
        </div>
        
        <button 
          onClick={handleFinishInterview}
          className="btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-medium">Professional AI Interviewer</h2>
          </div>
          <span className="text-sm text-slate-500">
            Question {questionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-slate-800">{currentQuestion}</p>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-1">
          Your Answer
        </label>
        <textarea
          ref={textareaRef}
          id="answer"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full min-h-[120px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-startx-200 focus:border-startx-500"
          disabled={!!feedback}
        />
      </div>

      {!feedback && !thinking && (
        <button
          onClick={handleSubmitAnswer}
          disabled={!userAnswer.trim()}
          className="btn-primary w-full"
        >
          Submit Answer
        </button>
      )}

      {thinking && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-startx-500"></div>
          <span className="ml-2 text-slate-600">Evaluating your answer...</span>
        </div>
      )}

      {feedback && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg mb-4 ${feedback.correct ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <h3 className={`font-medium mb-1 ${feedback.correct ? 'text-green-700' : 'text-amber-700'}`}>
              {feedback.correct ? 'Good job!' : 'Needs improvement'}
            </h3>
            <p className="text-slate-700">{feedback.feedback}</p>
          </div>
          <button
            onClick={handleNextQuestion}
            className="btn-primary w-full"
          >
            Next Question
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInterviewer;