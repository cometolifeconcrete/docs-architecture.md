const BASE_URL = 'https://app.companycam.com/public_api/v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.COMPANYCAM_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'COMPANYCAM_API_KEY is not configured' });

  // Deliberately metadata-only: this endpoint does not copy/store image files.
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const perPage = Math.min(50, Math.max(1, Number.parseInt(req.query.per_page || '25', 10)));
  const url = new URL(`${BASE_URL}/projects`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

    if (!response.ok) {
      return res.status(response.status).json({ ok: false, companycamStatus: response.status, error: 'CompanyCam project request failed', details: data });
    }

    return res.status(200).json({
      ok: true,
      storagePolicy: 'metadata-only; CompanyCam remains source of truth',
      page,
      perPage,
      projects: data,
    });
  } catch (error) {
    console.error('CompanyCam project request failed', error);
    return res.status(502).json({ ok: false, error: 'Unable to reach CompanyCam' });
  }
}
