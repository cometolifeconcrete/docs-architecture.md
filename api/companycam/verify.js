export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
    }

    const apiKey = process.env.COMPANYCAM_API_KEY;
    if (!apiKey) return Response.json({ ok: false, error: 'COMPANYCAM_API_KEY is not configured' }, { status: 500 });

    try {
      const response = await fetch('https://app.companycam.com/public_api/v1/access_tokens/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

      if (!response.ok) {
        return Response.json({ ok: false, companycamStatus: response.status, error: 'CompanyCam credential verification failed', details: data }, { status: response.status });
      }

      return Response.json({ ok: true, companycamStatus: response.status, message: 'CompanyCam API credential verified.', verification: data });
    } catch (error) {
      console.error('CompanyCam verification request failed', error);
      return Response.json({ ok: false, error: 'Unable to reach CompanyCam' }, { status: 502 });
    }
  },
};
