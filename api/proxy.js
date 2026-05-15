// api/proxy.js — Vercel Serverless Function
// Menerima request dari frontend → forward ke Magnific API
// Tidak ada CORS karena request terjadi server-to-server

export default async function handler(req, res) {
  // Allow all origins (frontend bisa akses dari mana saja)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-magnific-api-key');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ambil path Magnific API dari query parameter
    // Contoh: /api/proxy?path=/image-to-video/kling-v2-6
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Ambil API key dari header yang dikirim frontend
    const apiKey = req.headers['x-magnific-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    const targetUrl = `https://api.magnific.com/v1/ai${path}`;

    // Forward request ke Magnific API
    const magnificRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-magnific-api-key': apiKey,
      },
      // Teruskan body untuk POST request
      ...(req.method === 'POST' && {
        body: JSON.stringify(req.body),
      }),
    });

    const data = await magnificRes.json();

    // Teruskan status code asli dari Magnific
    return res.status(magnificRes.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy server error',
      message: error.message,
    });
  }
}
