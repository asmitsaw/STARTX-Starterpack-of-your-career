import React, { useEffect, useRef, useState } from 'react'
import mountains from '../assets/mountains.svg'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function News() {
  const { openAuthModal } = useAuth()
  const envApiKey = import.meta?.env?.VITE_NEWSAPI_KEY
  const API_KEY = envApiKey && String(envApiKey).trim().length > 0
    ? envApiKey
    : '70c55fee67234229b2098563acf6b027'
  const initialNews = [
    {
      id: 1,
      title: 'Open-source LLMs gain enterprise adoption',
      source: 'TechWire',
      time: '2h',
      url: 'https://techwire.example.com/open-llm-adoption',
      imageUrl: 'https://picsum.photos/seed/llm-adoption/640/360',
      content:
        'Large language models licensed permissively are seeing rapid adoption across enterprises.\n\nTeams cite transparency, the ability to self-host, and lower cost as key drivers.\n\nAnalysts expect a hybrid future with open models fine-tuned to private data.',
    },
    {
      id: 2,
      title: 'WebAssembly hits new performance milestone',
      source: 'DevDaily',
      time: '4h',
      url: 'https://devdaily.example.com/wasm-milestone',
      imageUrl: 'https://picsum.photos/seed/wasm-performance/640/360',
      content:
        'New compiler optimizations push WebAssembly performance even closer to native speeds.\n\nThe update focuses on JIT improvements and better memory management.\n\nExpect faster startup times and lower resource usage for complex apps.',
    },
    {
      id: 3,
      title: 'Design systems trend towards tokens-first',
      source: 'UXPulse',
      time: '6h',
      url: 'https://uxpulse.example.com/tokens-first',
      imageUrl: 'https://picsum.photos/seed/design-tokens/640/360',
      content:
        'Design tokens continue to unify design and code.\n\nOrganizations report faster theming, stronger accessibility, and cleaner handoffs.\n\nTools are evolving to sync tokens across platforms seamlessly.',
    },
    {
      id: 4,
      title: 'Server Components reach critical mass',
      source: 'JS Times',
      time: '8h',
      url: 'https://jstimes.example.com/server-components',
      imageUrl: 'https://picsum.photos/seed/server-components/640/360',
      content:
        'React Server Components adoption is accelerating.\n\nEarly adopters report simpler data fetching and less client JavaScript.\n\nTooling is improving, but education remains a challenge.',
    },
    {
      id: 5,
      title: 'Edge AI pushes inference to devices',
      source: 'ComputeNow',
      time: '12h',
      url: 'https://computenow.example.com/edge-ai',
      imageUrl: 'https://picsum.photos/seed/edge-ai/640/360',
      content:
        'Edge accelerators enable private, low-latency inference on-device.\n\nVendors are racing to reduce power draw while boosting throughput.\n\nExpect new form factors and SDKs targeting mobile and embedded use cases.',
    },
    {
      id: 6,
      title: 'Browser ship smaller JS bundles in 2025',
      source: 'PerfMatters',
      time: '14h',
      url: 'https://perfmatters.example.com/smaller-bundles',
      imageUrl: 'https://picsum.photos/seed/smaller-js-bundles/640/360',
      content:
        'Modern bundlers and HTTP/3 are enabling smaller, faster sites.\n\nTree-shaking across packages reduces unused code.\n\nTeams report significant TTFB and LCP wins.',
    },
    {
      id: 7,
      title: 'GPU shortages ease as new fabs come online',
      source: 'SiliconWatch',
      time: '16h',
      url: 'https://siliconwatch.example.com/gpu-fabs',
      imageUrl: 'https://picsum.photos/seed/gpu-fabs/640/360',
      content:
        'New foundries are increasing capacity for AI workloads.\n\nPrices begin to normalize while efficiency improves.\n\nAnalysts expect broader access for startups.',
    },
    {
      id: 8,
      title: 'Python overtakes others in data tooling',
      source: 'DataSignals',
      time: '18h',
      url: 'https://datasignals.example.com/python-data',
      imageUrl: 'https://picsum.photos/seed/python-data/640/360',
      content:
        'Ecosystem momentum around notebooks and pipelines keeps growing.\n\nBetter packaging and reproducibility are key themes.\n\nVendors keep investing in time-series and vector databases.',
    },
  ]

  const [articles, setArticles] = useState([])
  const [activeArticle, setActiveArticle] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const progressTimerRef = useRef(null)
  const fetchTimerRef = useRef(null)
  const [filters, setFilters] = useState({
    q: '',
    careerField: 'technology',
  })

  function beginProgress() {
    setProgressPercent(10)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(() => {
      setProgressPercent((current) => {
        if (current >= 90) return current
        const next = current + Math.floor(Math.random() * 8 + 3) // +3..+10
        return Math.min(next, 90)
      })
    }, 200)
  }

  function completeProgress() {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgressPercent(100)
    // Let the bar reach 100%, then hide it smoothly
    setTimeout(() => setProgressPercent(0), 300)
  }

  function buildNewsApiUrl() {
    // Always use everything endpoint with career-focused queries
    const base = 'https://newsapi.org/v2/everything'
    const params = new URLSearchParams()
    params.set('apiKey', API_KEY)
    
    // Build query with career field focus
    let query = filters.q || ''
    if (filters.careerField && filters.careerField !== 'all') {
      // Add career field as a keyword to the search
      query = query ? `${query} ${filters.careerField} career` : `${filters.careerField} career jobs`
    } else if (!query) {
      // Default to general career content if no specific field selected
      query = 'career jobs professional development'
    }
    
    params.set('q', query)
    params.set('sortBy', 'publishedAt')
    params.set('language', 'en') // Keep English as default language
    params.set('pageSize', '20')
    return `${base}?${params.toString()}`
  }

  function timeAgo(input) {
    try {
      const date = new Date(input)
      const diffMs = Date.now() - date.getTime()
      const sec = Math.max(1, Math.floor(diffMs / 1000))
      const min = Math.floor(sec / 60)
      const hr = Math.floor(min / 60)
      const day = Math.floor(hr / 24)
      if (day > 0) return `${day}d`
      if (hr > 0) return `${hr}h`
      if (min > 0) return `${min}m`
      return `${sec}s`
    } catch {
      return 'just now'
    }
  }

  async function fetchLatestArticles() {
    setIsLoading(true)
    beginProgress()

    try {
      const url = buildNewsApiUrl()
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) throw new Error(data?.message || data?.code || 'Failed to fetch')

      const mapped = Array.isArray(data?.articles)
        ? data.articles.map((r, idx) => ({
            id: r.url || idx,
            title: r.title || 'Untitled',
            source: (r.source && r.source.name) || 'Unknown',
            time: r.publishedAt ? timeAgo(r.publishedAt) : 'just now',
            url: r.url || '',
            imageUrl: r.urlToImage || `https://picsum.photos/seed/news-${idx}/640/360`,
            content: r.description || r.content || '',
          }))
        : []

      setArticles(mapped.length > 0 ? mapped : initialNews)
    } catch (err) {
      console.error('Error fetching news:', err)
      // On failure, use initial news data
      setArticles(initialNews)
    } finally {
      setIsLoading(false)
      completeProgress()
    }
  }

  // Function to handle refresh button click
  function simulateFetchLatestArticles() {
    if (isLoading) return
    fetchLatestArticles()
  }

  useEffect(() => {
    // Initial load
    fetchLatestArticles()
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [filters.careerField, filters.q])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Top progress bar */}
      <div className="mb-4">
        <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-startx-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Career News</h1>
        <button className="btn-outline" onClick={simulateFetchLatestArticles} disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-startx-500" />
              Loading
            </span>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      {/* Career Filters */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <input
          className="input"
          placeholder="Search career keywords"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <div className="flex gap-2">
          <select
            className="input flex-1"
            value={filters.careerField}
            onChange={(e) => setFilters((f) => ({ ...f, careerField: e.target.value }))}
          >
            <option value="all">All Career Fields</option>
            <option value="technology">Technology</option>
            <option value="management">Management</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="engineering">Engineering</option>
            <option value="marketing">Marketing</option>
            <option value="design">Design</option>
            <option value="legal">Legal</option>
            <option value="hospitality">Hospitality</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
          <button
            className="btn"
            disabled={isLoading}
            onClick={simulateFetchLatestArticles}
            title="Apply filters"
          >
            Apply
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="inline-flex items-center gap-3 text-slate-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-startx-500" />
            <span className="text-sm">Fetching latest articles…</span>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="card py-12 text-center text-slate-600">
          No articles found for the selected filters. Try widening your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="card">
              {article.imageUrl && (
                <div className="mb-3 overflow-hidden rounded-lg">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = mountains
                    }}
                  />
                </div>
              )}
              <h3 className="font-semibold text-slate-900">{article.title}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {article.source} · {article.time} ago
              </p>
              <button className="btn-outline mt-4" onClick={() => setActiveArticle(article)}>Read</button>
            </article>
          ))}
        </div>
      )}
      {/* Reader modal */}
      <div>
        {activeArticle && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveArticle(null)} />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{activeArticle.title}</h2>
                    <p className="text-sm text-slate-600">{activeArticle.source} · {activeArticle.time} ago</p>
                  </div>
                  <button className="btn-outline" onClick={() => setActiveArticle(null)}>Close</button>
                </div>
                {activeArticle.imageUrl && (
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <img
                      src={activeArticle.imageUrl}
                      alt={activeArticle.title}
                      className="h-56 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = mountains
                      }}
                    />
                  </div>
                )}
                <div className="mt-4 whitespace-pre-line text-slate-800">{activeArticle.content}</div>
                {activeArticle.url && (
                  <a className="mt-4 inline-flex text-startx-700 underline" href={activeArticle.url} target="_blank" rel="noreferrer">
                    Read original source
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


