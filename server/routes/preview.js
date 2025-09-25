import express from 'express'

const router = express.Router()

const fetchHtml = async (url) => {
  const res = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  return text
}

const extractMeta = (html) => {
  const get = (propNames) => {
    for (const name of propNames) {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
      const m = html.match(re)
      if (m) return m[1]
    }
    return null
  }
  const title = get(['og:title', 'twitter:title']) || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null)
  const description = get(['og:description', 'twitter:description'])
  const image = get(['og:image', 'twitter:image'])
  return { title, description, image }
}

router.get('/', async (req, res, next) => {
  try {
    const url = req.query.url
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'invalid_url' })
    const html = await fetchHtml(url)
    const meta = extractMeta(html)
    res.json({ url, ...meta })
  } catch (e) {
    // best-effort: return minimal info
    res.json({ url: req.query.url })
  }
})

export default router


