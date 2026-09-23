const PROJECTS_URL = 'https://app.companycam.com/public_api/v1/projects';

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
    }

    const apiKey = process.env.COMPANYCAM_API_KEY;
    if (!apiKey) return Response.json({ ok: false, error: 'COMPANYCAM_API_KEY is not configured' }, { status: 500 });

    const incoming = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number.parseInt(incoming.searchParams.get('limit') || incoming.searchParams.get('per_page') || '5', 10)));
    const after = incoming.searchParams.get('after');
    const url = new URL(PROJECTS_URL);
    url.searchParams.set('limit', String(limit));
    if (after) url.searchParams.set('after', after);

    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

      if (!response.ok) {
        return Response.json({ ok: false, companycamStatus: response.status, error: 'CompanyCam project request failed', details: data }, { status: response.status });
      }

      return Response.json({ ok: true, storagePolicy: 'metadata-only; CompanyCam remains source of truth', requestedLimit: limit, result: data });
    } catch (error) {
      console.error('CompanyCam project request failed', error);
      return Response.json({ ok: false, error: 'Unable to reach CompanyCam' }, { status: 502 });
    }
  },
};
