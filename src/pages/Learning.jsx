import React, { useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

const courses = [
  {
    id: 1,
    title: 'React for Beginners',
    provider: 'Meta',
    img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    link: 'https://www.coursera.org/specializations/meta-react',
  },
  {
    id: 2,
    title: 'Cloud Fundamentals',
    provider: 'Google Cloud',
    img: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
    link: 'https://www.cloudskillsboost.google/',
  },
  {
    id: 3,
    title: 'AI & Machine Learning Crash Course',
    provider: 'NVIDIA Deep Learning Institute',
    img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981d?q=80&w=1200&auto=format&fit=crop',
    link: 'https://www.nvidia.com/en-us/training/',
  },
  {
    id: 4,
    title: 'Backend with Node.js',
    provider: 'IBM Skills Network',
    img: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200&auto=format&fit=crop',
    link: 'https://www.coursera.org/professional-certificates/ibm-backend-development',
  },
]

const certifications = [
  { id: 'aws', title: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services', link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
  { id: 'gcp', title: 'Google Associate Cloud Engineer', org: 'Google Cloud', link: 'https://cloud.google.com/certification/cloud-engineer' },
  { id: 'az', title: 'Microsoft Azure Fundamentals (AZ-900)', org: 'Microsoft', link: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/' },
  { id: 'meta', title: 'Meta Front-End Developer', org: 'Meta', link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' },
]

export default function Learning() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const [tab, setTab] = useState(0) // 0: Courses, 1: Certifications

  const base = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'
  const logos = {
    microsoft: `${base}/microsoft/microsoft-plain.svg`,
    github: `${base}/github/github-original.svg`,
    adobe: `${base}/adobe/adobe-original.svg`,
    servicenow: `${base}/servicenow/servicenow-original.svg`,
    docker: `${base}/docker/docker-original.svg`,
    atlassian: `${base}/atlassian/atlassian-original.svg`,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Learning</h1>
        <span className="badge">Curated</span>
      </div>

      <div className="mb-6">
        <SegmentedTabs tabs={['Courses', 'Certifications']} value={tab} onChange={setTab} fitToLabel />
      </div>

      {tab === 0 && (
        <section>
          <h2 className="section-title">Recommended Courses</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
                <div className="aspect-video w-full overflow-hidden">
                  <img src={c.img} alt="Course cover" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-500">{c.provider}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{c.title}</h3>
                  <button 
                    onClick={() => window.open(c.link, '_blank')} 
                    className="mt-3 inline-block btn-outline"
                  >
                    Go to course
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 1 && (
        <section>
          <h2 className="section-title">Professional Certificates</h2>
          <p className="mt-2 text-slate-600">Featuring assessments developed with leading brands. Earn credentials and share them.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {[{
              id: 'microsoft', title: 'Microsoft', link: 'https://learn.microsoft.com/en-us/certifications/', logo: logos.microsoft,
            }, {
              id: 'github', title: 'GitHub', link: 'https://github.com/skills', logo: logos.github,
            }, {
              id: 'adobe', title: 'Adobe', link: 'https://learning.adobe.com/certification.html', logo: logos.adobe,
            }, {
              id: 'servicenow', title: 'ServiceNow', link: 'https://www.servicenow.com/services/training-and-certification.html', logo: logos.servicenow,
            }, {
              id: 'docker', title: 'Docker', link: 'https://www.docker.com/certification/', logo: logos.docker,
            }, {
              id: 'atlassian', title: 'Atlassian', link: 'https://university.atlassian.com/student/catalog', logo: logos.atlassian,
            }].map((cert) => (
              <button 
                key={cert.id} 
                onClick={() => window.open(cert.link, '_blank')} 
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md w-full text-left"
              >
                <img src={cert.logo} alt={`${cert.title} logo`} loading="lazy" className="h-8 w-8" />
                <span className="font-medium text-slate-900">{cert.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}


