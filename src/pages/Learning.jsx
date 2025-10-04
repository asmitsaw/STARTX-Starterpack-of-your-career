import React, { useMemo, useState, useEffect, useRef } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'

// Use Picsum for reliable placeholder images with seed for consistency
const baseImg = (q, sig) => `https://picsum.photos/seed/${encodeURIComponent(q)}-${sig}/400/300`

// Helper function to extract YouTube video ID from URL
const getYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// StartX Courses with video lectures
const startXCourses = [
  {
    id: 1,
    title: 'Figma Bootcamp',
    provider: 'StartX',
    image: baseImg('figma,design,ui', 1),
    description: 'Master Figma from scratch with hands-on video tutorials. Learn UI/UX design fundamentals.',
    level: 'Beginner',
    duration: '3 lectures',
    hasLectures: true,
    lectures: [
      {
        id: 1,
        title: 'Introduction to Figma',
        videoUrl: 'https://www.youtube.com/watch?v=5q4Cguwu1OU',
        duration: '45 min'
      },
      {
        id: 2,
        title: 'Figma Advanced Techniques',
        videoUrl: 'https://www.youtube.com/watch?v=w2bJLrYBYiw',
        duration: '60 min'
      },
      {
        id: 3,
        title: 'Figma Best Practices',
        videoUrl: 'https://www.youtube.com/watch?v=YhkG-aX4_sw',
        duration: '50 min'
      }
    ]
  },
  {
    id: 7,
    title: 'AI Agents using n8n',
    provider: 'StartX',
    image: baseImg('ai,automation,n8n', 7),
    description: 'Build powerful AI agents and automation workflows using n8n. Learn to create intelligent systems.',
    level: 'Intermediate',
    duration: '3 lectures',
    hasLectures: true,
    lectures: [
      {
        id: 1,
        title: 'Introduction to n8n and AI Agents',
        videoUrl: 'https://www.youtube.com/watch?v=G2qVj-pP-DI',
        duration: '55 min'
      },
      {
        id: 2,
        title: 'Building AI Workflows',
        videoUrl: 'https://www.youtube.com/watch?v=kyz5FB0T3D4',
        duration: '48 min'
      },
      {
        id: 3,
        title: 'Advanced AI Agent Techniques',
        videoUrl: 'https://www.youtube.com/watch?v=D6vN_-_FwYY',
        duration: '52 min'
      }
    ]
  },
  {
    id: 8,
    title: 'MySQL Bootcamp',
    provider: 'StartX',
    image: baseImg('mysql,database,sql', 8),
    description: 'Complete MySQL database course. Master SQL queries, database design, and optimization techniques.',
    level: 'Beginner',
    duration: '3 lectures',
    hasLectures: true,
    lectures: [
      {
        id: 1,
        title: 'MySQL Fundamentals',
        videoUrl: 'https://www.youtube.com/watch?v=9EH0eymZy2Q',
        duration: '50 min'
      },
      {
        id: 2,
        title: 'Advanced MySQL Queries',
        videoUrl: 'https://www.youtube.com/watch?v=RtqgwRtWeQ8',
        duration: '58 min'
      },
      {
        id: 3,
        title: 'MySQL Database Design & Optimization',
        videoUrl: 'https://www.youtube.com/watch?v=DF-xdHG5gaE',
        duration: '62 min'
      }
    ]
  },
  {
    id: 9,
    title: 'Zero to Python Hero: Code Smart with AI',
    provider: 'StartX',
    image: baseImg('python,ai,coding', 9),
    description: 'Learn Python programming from scratch with AI assistance. Build smart applications and master coding fundamentals.',
    level: 'Beginner',
    duration: '2 lectures',
    hasLectures: true,
    lectures: [
      {
        id: 1,
        title: 'Python Basics with AI',
        videoUrl: 'https://www.youtube.com/watch?v=X4zliWZWGXI',
        duration: '65 min'
      },
      {
        id: 2,
        title: 'Advanced Python & AI Integration',
        videoUrl: 'https://www.youtube.com/watch?v=OnpzMqN4iP8',
        duration: '70 min'
      }
    ]
  },
]

// External courses from other providers
const externalCourses = [
  {
    id: 2,
    title: 'React for Beginners',
    provider: 'Meta',
    link: 'https://www.coursera.org/learn/react-basics',
    image: baseImg('react,frontend', 2),
    description: 'Learn the basics of React, a popular frontend framework.',
    level: 'Beginner',
    duration: '8 weeks',
    hasLectures: false
  },
  {
    id: 3,
    title: 'Cloud Fundamentals',
    provider: 'Google Cloud',
    link: 'https://cloud.google.com/training',
    image: baseImg('cloud,google', 3),
    description: 'Understand the core concepts of cloud computing with Google Cloud.',
    level: 'Intermediate',
    duration: '6 weeks',
    hasLectures: false
  },
  {
    id: 4,
    title: 'AI & ML Crash Course',
    provider: 'NVIDIA',
    link: 'https://www.nvidia.com/en-us/training/',
    image: baseImg('ai,machinelearning', 4),
    description: 'A fast-paced introduction to Artificial Intelligence and Machine Learning.',
    level: 'Advanced',
    duration: '10 weeks',
    hasLectures: false
  },
  {
    id: 5,
    title: 'CS50: Computer Science',
    provider: 'Harvard / edX',
    link: 'https://cs50.harvard.edu/x/',
    image: baseImg('computerscience', 5),
    description: 'Harvard\'s legendary intro to computer science course.',
    level: 'Beginner',
    duration: '12 weeks',
    hasLectures: false
  },
  {
    id: 6,
    title: 'Full Stack Web Development',
    provider: 'The Odin Project',
    link: 'https://www.theodinproject.com/',
    image: baseImg('web,development,programming', 6),
    description: 'Master modern web development from frontend to backend with hands-on projects.',
    level: 'Intermediate',
    duration: '16 weeks',
    hasLectures: false
  },
  {
    id: 9,
    title: 'Python for Data Science',
    provider: 'IBM',
    link: 'https://www.coursera.org/professional-certificates/ibm-data-science',
    image: baseImg('python,data,science', 9),
    description: 'Learn Python programming and data analysis techniques for real-world applications.',
    level: 'Beginner',
    duration: '9 weeks',
    hasLectures: false
  },
]

const professionalCertifications = [
  { id: 'aws', title: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services', link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
  { id: 'gcp', title: 'Google Associate Cloud Engineer', org: 'Google Cloud', link: 'https://cloud.google.com/certification/cloud-engineer' },
  { id: 'az', title: 'Microsoft Azure Fundamentals (AZ-900)', org: 'Microsoft', link: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/' },
  { id: 'meta', title: 'Meta Front-End Developer', org: 'Meta', link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
]

// Name Input Modal Component
function NameInputModal({ onSubmit, onClose, defaultName }) {
  const [name, setName] = useState(defaultName || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Congratulations! 🎉</h2>
          <p className="text-slate-300">You've completed all lectures!</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="studentName" className="block text-sm font-medium text-slate-300 mb-2">
              Enter your name for the certificate
            </label>
            <input
              type="text"
              id="studentName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
            >
              Generate Certificate
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Generate unique certificate code
const generateCertificateCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `STARTX-${timestamp}-${random}`
}

// Certificate Component
function Certificate({ courseName, userName, date, onClose, certificateCode }) {
  const certificateRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isAddingToProfile, setIsAddingToProfile] = useState(false)

  const captureCertificateImage = async () => {
    if (!certificateRef.current) return null

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: certificateRef.current.offsetWidth,
        height: certificateRef.current.offsetHeight
      })
      return canvas
    } catch (error) {
      console.error('Error capturing certificate:', error)
      return null
    }
  }

  const downloadCertificate = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const canvas = await captureCertificateImage()
      if (!canvas) {
        throw new Error('Failed to capture certificate')
      }

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${courseName.replace(/\s+/g, '_')}_Certificate_${userName.replace(/\s+/g, '_')}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setIsDownloading(false)
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      setIsDownloading(false)
      alert('Failed to download certificate. Please try again.')
    }
  }

  const addToProfile = async () => {
    if (isAddingToProfile) return

    setIsAddingToProfile(true)
    try {
      // Extract skills from course name
      const skillsMap = {
        'Figma': ['Figma', 'UI/UX Design', 'Prototyping', 'Design Systems'],
        'AI Agents': ['AI', 'Automation', 'n8n', 'Workflow Design'],
        'MySQL': ['MySQL', 'Database Design', 'SQL', 'Data Management'],
        'Python': ['Python', 'AI', 'Programming', 'Machine Learning'],
        'React': ['React', 'JavaScript', 'Frontend Development'],
        'Node': ['Node.js', 'Backend Development', 'JavaScript'],
      }

      // Find matching skills
      let skills = []
      for (const [key, value] of Object.entries(skillsMap)) {
        if (courseName.includes(key)) {
          skills = value
          break
        }
      }

      // If no match, extract from course name
      if (skills.length === 0) {
        skills = [courseName.split(' ')[0]]
      }

      // Create highlight text
      const highlightText = `🎓 Completed "${courseName}" certification from StartX\n📜 Certificate ID: ${certificateCode}\n📅 Issued: ${date}\n\n✨ Successfully mastered ${skills.slice(0, 3).join(', ')} and earned industry-recognized certification.`

      // Update profile with skills and highlight
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5174'
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          skills: skills,
          highlights: [highlightText],
          addCertification: {
            name: courseName,
            issuer: 'StartX',
            date: date,
            certificateId: certificateCode
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      setIsAddingToProfile(false)
      alert(`✅ Certificate added to your profile!\n\n📚 Skills added: ${skills.join(', ')}\n🌟 Highlight added with certificate details`)
    } catch (error) {
      console.error('Error adding to profile:', error)
      setIsAddingToProfile(false)
      alert('Failed to add certificate to profile. Please try again.')
    }
  }

  const shareToFeed = async () => {
    if (isSharing) return

    setIsSharing(true)
    try {
      const canvas = await captureCertificateImage()
      if (!canvas) {
        throw new Error('Failed to capture certificate')
      }

      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0)
      })

      if (!blob) {
        throw new Error('Failed to create image blob')
      }

      // Create FormData with certificate image
      const formData = new FormData()
      formData.append('file', blob, 'certificate.png')

      // Upload image first
      console.log('Uploading certificate image...')
      console.log('FormData contents:', formData.get('file'))
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      console.log('Upload response status:', uploadResponse.status)
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers))

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text()
        console.error('Upload error response:', errorData)
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorData}`)
      }

      const uploadData = await uploadResponse.json()
      console.log('Upload response data:', uploadData)
      
      const imageUrl = uploadData.url || uploadData.path || uploadData.filePath

      if (!imageUrl) {
        console.error('Upload data:', uploadData)
        throw new Error('No image URL returned from upload')
      }

      // Create post with certificate
      const postText = `🎉 Excited to share that I've successfully completed "${courseName}"! 🎓\n\n✨ This journey has been incredible, and I'm proud to have earned this certificate from StartX.\n\n🚀 Ready to apply these new skills and continue learning!\n\n#StartX #Certificate #Learning #Achievement #${courseName.replace(/\s+/g, '')}`

      console.log('Creating post with image:', imageUrl)
      
      // Create FormData for post with media (matching Home.jsx format)
      const postFormData = new FormData()
      postFormData.append('content', postText)
      postFormData.append('media_type', 'image')
      postFormData.append('media_metadata', JSON.stringify({
        url: imageUrl,
        small: imageUrl,
        medium: imageUrl,
        large: imageUrl
      }))

      // Generate client ID like Home.jsx does
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-client-id': clientId },
        body: postFormData
      })

      if (!postResponse.ok) {
        const errorData = await postResponse.text()
        console.error('Post error:', errorData)
        throw new Error(`Post creation failed: ${postResponse.status}`)
      }

      const postData = await postResponse.json()
      console.log('Post created:', postData)

      setIsSharing(false)
      alert('🎉 Certificate shared successfully to your feed!')
      onClose()
    } catch (error) {
      console.error('Error sharing certificate:', error)
      setIsSharing(false)
      alert(`Failed to share certificate: ${error.message}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-6xl my-8"
      >
        {/* Certificate - Landscape Format */}
        <div ref={certificateRef} className="bg-gradient-to-br from-pink-200 via-pink-300 to-pink-200 p-6 sm:p-8 rounded-2xl shadow-2xl aspect-[16/10]">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 p-3 sm:p-5 rounded-xl shadow-inner h-full">
            <div className="border-[5px] border-pink-400 rounded-lg p-3 sm:p-4 shadow-lg h-full">
              <div className="border-[2px] border-pink-300 rounded-md p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative h-full flex flex-col justify-between" style={{ paddingBottom: '2rem' }}>
                
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-pink-400/30 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-pink-400/30 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-pink-400/30 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-pink-400/30 rounded-br-lg"></div>
                
                {/* Header */}
                <div className="text-center relative z-10">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 tracking-tight">
                    <span className="text-blue-500 italic font-serif drop-shadow-lg">STARTX</span>
                    <span className="text-white ml-2 drop-shadow-lg">CERTIFICATE</span>
                  </h1>
                  
                  {/* Red ribbon banner */}
                  <div className="flex justify-center">
                    <div className="relative inline-block">
                      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-10 sm:px-14 py-2 sm:py-3 text-lg sm:text-xl font-bold shadow-xl">
                        Of Completion
                      </div>
                      {/* Left arrow */}
                      <div className="absolute left-0 top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[18px] border-l-gray-900 -translate-x-full"></div>
                      {/* Right arrow */}
                      <div className="absolute right-0 top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-r-[18px] border-r-gray-900 translate-x-full"></div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="text-center space-y-4 relative z-10 flex-1 flex flex-col justify-center">
                  <p className="text-gray-300 text-base sm:text-lg font-light tracking-wide">This certificate is presented to</p>
                  
                  <div className="py-3">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl leading-tight" style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}>
                      {userName || 'Student'}
                    </h2>
                    <div className="mt-3 h-1 w-48 sm:w-72 mx-auto bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
                  </div>

                  <div className="space-y-2 text-base sm:text-lg">
                    <p className="text-gray-300">
                      For successfully completing <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">{courseName}</span>
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base">on {date}</p>
                  </div>
                  
                  {/* Certificate Code */}
                  <div className="mt-4">
                    <p className="text-xs sm:text-sm text-gray-500 font-mono tracking-wider">
                      Certificate ID: <span className="text-pink-400 font-semibold">{certificateCode}</span>
                    </p>
                  </div>
                </div>

                {/* Signatures and Medal */}
                <div className="flex items-center justify-between relative z-10 pb-2">
                  {/* Left Signature */}
                  <div className="text-center flex-1">
                    <div className="mb-1">
                      <svg className="w-20 sm:w-28 h-6 sm:h-10 mx-auto" viewBox="0 0 200 50" fill="none">
                        <path d="M10 30 Q 30 15, 50 30 T 90 25 Q 110 35, 130 20 T 170 30" stroke="#D1D5DB" strokeWidth="2.5" fill="none"/>
                      </svg>
                    </div>
                    <div className="border-t-2 border-gray-500 pt-1.5 mx-auto w-32 sm:w-36">
                      <p className="font-bold text-white text-sm sm:text-base">Asmit Saw</p>
                      <p className="text-xs text-gray-400">Founder</p>
                    </div>
                  </div>

                  {/* Center Medal */}
                  <div className="flex-shrink-0 mx-3 sm:mx-6">
                    <div className="relative">
                      {/* Medal */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl ring-4 ring-red-600">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500 flex items-center justify-center shadow-inner">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"></div>
                        </div>
                      </div>
                      {/* Ribbon - Shorter */}
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        <div className="w-4 h-6 bg-gradient-to-b from-red-500 to-red-700 rounded-b shadow-lg"></div>
                        <div className="w-4 h-6 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-b shadow-lg"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Signature */}
                  <div className="text-center flex-1">
                    <div className="mb-1">
                      <svg className="w-20 sm:w-28 h-6 sm:h-10 mx-auto" viewBox="0 0 200 50" fill="none">
                        <path d="M20 25 Q 40 10, 60 28 T 100 30 Q 120 38, 140 18 T 180 28" stroke="#D1D5DB" strokeWidth="2.5" fill="none"/>
                      </svg>
                    </div>
                    <div className="border-t-2 border-gray-500 pt-1.5 mx-auto w-32 sm:w-36">
                      <p className="font-bold text-white text-sm sm:text-base">Yuvraj thakur</p>
                      <p className="text-xs text-gray-400">Mentor</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <button
            onClick={addToProfile}
            disabled={isAddingToProfile}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl hover:from-purple-700 hover:to-indigo-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center gap-2">
              {isAddingToProfile ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Add to Profile
                </>
              )}
            </span>
          </button>
          
          <button
            onClick={shareToFeed}
            disabled={isSharing}
            className="px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center gap-2">
              {isSharing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sharing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share to Feed
                </>
              )}
            </span>
          </button>
          
          <button
            onClick={downloadCertificate}
            disabled={isDownloading}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center justify-center gap-2">
              {isDownloading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </span>
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Course Viewer Component
function CourseViewer({ course, onClose, onCourseComplete }) {
  const { user } = useAuth()
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0)
  const [completedLectures, setCompletedLectures] = useState(new Set())
  const [showNameInput, setShowNameInput] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [certificateCode, setCertificateCode] = useState('')
  
  const currentLecture = course.lectures[currentLectureIndex]
  const videoId = getYouTubeId(currentLecture.videoUrl)
  const totalLectures = course.lectures.length
  const progress = (completedLectures.size / totalLectures) * 100

  const markAsComplete = () => {
    const newCompleted = new Set(completedLectures)
    newCompleted.add(currentLectureIndex)
    setCompletedLectures(newCompleted)
    
    // Check if all lectures are completed
    if (newCompleted.size === totalLectures) {
      setTimeout(() => setShowNameInput(true), 500)
    }
  }

  const handleNameSubmit = async (name) => {
    setStudentName(name)
    setShowNameInput(false)
    
    // Generate unique certificate code
    const certCode = generateCertificateCode()
    setCertificateCode(certCode)
    
    // Prepare completion data
    const completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const completionData = {
      courseId: course.id,
      courseName: course.title,
      studentName: name,
      completionDate: completionDate,
      certificateCode: certCode,
      timestamp: Date.now(),
      userId: user?.id || 'guest'
    }
    
    // Save to localStorage
    const saved = localStorage.getItem('completedCourses')
    const completed = saved ? JSON.parse(saved) : []
    
    // Check if course already completed
    if (!completed.find(c => c.courseId === course.id)) {
      completed.push(completionData)
      localStorage.setItem('completedCourses', JSON.stringify(completed))
      
      // Save to database
      try {
        await fetch('/api/certificates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completionData)
        })
      } catch (error) {
        console.error('Error saving certificate to database:', error)
      }
      
      if (onCourseComplete) onCourseComplete(completionData)
    }
    
    setShowCertificate(true)
  }

  const goToNextLecture = () => {
    if (currentLectureIndex < totalLectures - 1) {
      setCurrentLectureIndex(currentLectureIndex + 1)
    }
  }

  const goToPreviousLecture = () => {
    if (currentLectureIndex > 0) {
      setCurrentLectureIndex(currentLectureIndex - 1)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-8 z-50 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{course.title}</h2>
            <p className="text-slate-400 text-sm mt-1">
              Lecture {currentLectureIndex + 1} of {totalLectures}: {currentLecture.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Course Progress</span>
            <span className="text-sm font-semibold text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 flex items-center justify-center">
              {videoId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title={currentLecture.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-white">Invalid video URL</div>
              )}
            </div>

            {/* Video Controls */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
              <button
                onClick={goToPreviousLecture}
                disabled={currentLectureIndex === 0}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>

              <button
                onClick={markAsComplete}
                disabled={completedLectures.has(currentLectureIndex)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {completedLectures.has(currentLectureIndex) ? '✓ Completed' : 'Mark as Complete'}
              </button>

              <button
                onClick={goToNextLecture}
                disabled={currentLectureIndex === totalLectures - 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Lecture List Sidebar */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">Course Content</h3>
              <p className="text-sm text-slate-400 mt-1">
                {completedLectures.size} of {totalLectures} lectures completed
              </p>
            </div>
            <div className="p-2">
              {course.lectures.map((lecture, index) => (
                <button
                  key={lecture.id}
                  onClick={() => setCurrentLectureIndex(index)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition ${
                    currentLectureIndex === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      completedLectures.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-600 text-slate-400'
                    }`}>
                      {completedLectures.has(index) ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lecture.title}</p>
                      <p className="text-xs opacity-75 mt-1">{lecture.duration}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNameInput && (
          <NameInputModal
            defaultName={user?.fullName || user?.firstName || ''}
            onSubmit={handleNameSubmit}
            onClose={() => setShowNameInput(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCertificate && (
          <Certificate
            courseName={course.title}
            userName={studentName}
            date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            certificateCode={certificateCode}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function Learning() {
  const { isAuthenticated, openAuthModal, user } = useAuth()
  const [tab, setTab] = useState(0) // 0: Courses, 1: Certifications, 2: My Certificates
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [completedCourses, setCompletedCourses] = useState([])
  const [viewCertificate, setViewCertificate] = useState(null)
  const initials = useMemo(() => 'U', [])

  // Load completed courses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completedCourses')
    if (saved) {
      setCompletedCourses(JSON.parse(saved))
    }
  }, [])

  const base = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'
  const logos = {
    microsoft: `${base}/microsoft/microsoft-plain.svg`,
    github: `${base}/github/github-original.svg`,
    adobe: `${base}/adobe/adobe-original.svg`,
    servicenow: `${base}/servicenow/servicenow-original.svg`,
    docker: `${base}/docker/docker-original.svg`,
    atlassian: `${base}/atlassian/atlassian-original.svg`,
  }

  const heroBg = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80";
  const certBg = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-4 sm:px-6">
        <div className="absolute inset-0">
          <img src={heroBg} alt="tech" className="h-full w-full object-cover opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/20 bg-blue-400/10 text-blue-200 text-sm">Curated Learning Paths</div>
          <h1 className="mt-4 text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Learning Hub</h1>
          <p className="mt-3 text-lg text-slate-300">Grow Your Skills with World-Class Courses</p>
          <p className="mt-1 text-slate-400">Handpicked courses from industry leaders to accelerate your learning journey</p>
        </motion.div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header with My Certificates button */}
        <div className="mb-6 flex items-center justify-between">
          <SegmentedTabs tabs={['Courses', 'Certifications']} value={tab} onChange={setTab} fitToLabel />
          
          <button
            onClick={() => setTab(2)}
            className="relative px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition font-semibold shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            My Certificates
            {completedCourses.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {completedCourses.length}
              </span>
            )}
          </button>
        </div>

      {tab === 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white">StartX Courses</h2>
          <p className="text-slate-400 mt-1 mb-6">Complete video courses with certificates</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {startXCourses.map((c, idx) => (
              <motion.article key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl border border-slate-100 h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={c.image} alt="Course cover" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-slate-900/70 text-white backdrop-blur">{c.level}</div>
                  <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-white/90 text-slate-900">{c.duration}</div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-semibold text-blue-600 uppercase">{c.provider}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-slate-600 text-sm flex-1">{c.description}</p>
                  {c.hasLectures ? (
                    completedCourses.find(comp => comp.courseId === c.id) ? (
                      <button 
                        onClick={() => setViewCertificate(completedCourses.find(comp => comp.courseId === c.id))} 
                        className="mt-4 w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 shadow hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed - View Certificate
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSelectedCourse(c)} 
                        className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 shadow hover:from-blue-600 hover:to-purple-700 transition"
                      >
                        Start Learning →
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => window.open(c.link, '_blank')} 
                      className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 shadow hover:from-blue-600 hover:to-purple-700 transition"
                    >
                      Go to Course ↗
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {tab === 1 && (
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-700/40 via-purple-700/30 to-blue-700/40 p-8 md:p-10">
            <img src={certBg} alt="cert-bg" className="absolute inset-0 h-full w-full object-cover opacity-[0.15]" />
            <div className="relative">
              <p className="text-sm text-indigo-200/90 font-medium">Expand your knowledge</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">External Courses & Certifications</h2>
              <p className="mt-2 text-slate-200/80 max-w-2xl">Explore courses from industry leaders and earn professional certifications.</p>
            </div>
          </div>
          
          {/* External Courses Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white">Recommended Courses</h3>
            <p className="mt-1 text-slate-400">Top courses from leading platforms</p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {externalCourses.map((c, idx) => (
              <motion.article key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} className="overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl border border-slate-100 h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={c.image} alt="Course cover" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-slate-900/70 text-white backdrop-blur">{c.level}</div>
                  <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-white/90 text-slate-900">{c.duration}</div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-semibold text-blue-600 uppercase">{c.provider}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-slate-600 text-sm flex-1">{c.description}</p>
                  <button 
                    onClick={() => window.open(c.link, '_blank')} 
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 shadow hover:from-blue-600 hover:to-purple-700 transition"
                  >
                    Go to Course ↗
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Professional Certifications Section */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-white">Professional Certifications</h3>
            <p className="mt-1 text-slate-400">Industry-recognized credentials to boost your career</p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[{
              id: 'microsoft', name: 'Microsoft', title: 'Azure Fundamentals Certification', link: 'https://learn.microsoft.com/en-us/certifications/', logo: logos.microsoft, description: 'Start your cloud journey with Microsoft Azure certifications.',
            }, {
              id: 'github', name: 'GitHub', title: 'GitHub Foundations', link: 'https://github.com/skills', logo: logos.github, description: 'Prove your collaboration and code management skills on GitHub.',
            }, {
              id: 'adobe', name: 'Adobe', title: 'Adobe Creative Certification', link: 'https://learning.adobe.com/certification.html', logo: logos.adobe, description: 'Get certified in Photoshop, Illustrator, and Adobe Suite tools.',
            }, {
              id: 'docker', name: 'Docker', title: 'Docker Certified Associate', link: 'https://www.docker.com/certification/', logo: logos.docker, description: 'Demonstrate your containerization expertise with Docker.',
            }, {
              id: 'servicenow', name: 'ServiceNow', title: 'ServiceNow Certified System Administrator', link: 'https://www.servicenow.com/services/training-and-certification.html', logo: logos.servicenow, description: 'Validate your skills in ServiceNow system administration.',
            }, {
              id: 'atlassian', name: 'Atlassian', title: 'Jira Project Admin Certification', link: 'https://university.atlassian.com/student/catalog', logo: logos.atlassian, description: 'Gain recognition for your Jira and Confluence skills.',
            }].map((cert, index) => (
              <motion.article
                key={cert.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl bg-gray-900 border border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-slate-700 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={cert.logo} alt={`${cert.name} logo`} className="h-6 w-6 object-contain" />
                  </div>
                  <div className="text-slate-300 text-sm font-medium">{cert.name}</div>
                </div>
                <h4 className="mt-3 text-lg font-semibold text-white">{cert.title}</h4>
                <p className="mt-1 text-slate-400 text-sm">{cert.description}</p>
                <button onClick={() => window.open(cert.link, '_blank')} className="mt-4 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:from-blue-600 hover:to-purple-700 w-full">Get Certified ↗</button>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {tab === 2 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">My Certificates</h2>
          {completedCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Certificates Yet</h3>
              <p className="text-slate-400">Complete a course to earn your first certificate!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.map((cert, idx) => (
                <motion.div
                  key={cert.courseId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition cursor-pointer"
                  onClick={() => setViewCertificate(cert)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">{cert.courseName}</h3>
                      <p className="text-sm text-slate-400 mb-2">{cert.studentName}</p>
                      <p className="text-xs text-slate-500">Completed on {cert.completionDate}</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
                    View Certificate
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}
      </div>

      {/* Course Viewer Modal */}
      <AnimatePresence>
        {selectedCourse && selectedCourse.hasLectures && (
          <CourseViewer 
            course={selectedCourse} 
            onClose={() => setSelectedCourse(null)}
            onCourseComplete={(data) => {
              setCompletedCourses(prev => [...prev, data])
            }}
          />
        )}
      </AnimatePresence>

      {/* View Certificate Modal */}
      <AnimatePresence>
        {viewCertificate && (
          <Certificate
            courseName={viewCertificate.courseName}
            userName={viewCertificate.studentName}
            date={viewCertificate.completionDate}
            certificateCode={viewCertificate.certificateCode}
            onClose={() => setViewCertificate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


