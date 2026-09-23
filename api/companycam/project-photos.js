const API_BASE = 'https://app.companycam.com/public_api/v1';

async function companyCamGet(path, apiKey) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { response, data };
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
    }

    const apiKey = process.env.COMPANYCAM_API_KEY;
    if (!apiKey) return Response.json({ ok: false, error: 'COMPANYCAM_API_KEY is not configured' }, { status: 500 });

    const incoming = new URL(request.url);
    const projectId = incoming.searchParams.get('project_id');
    const limit = Math.min(25, Math.max(1, Number.parseInt(incoming.searchParams.get('limit') || '10', 10)));
    if (!/^\d+$/.test(projectId || '')) return Response.json({ ok: false, error: 'A numeric project_id is required' }, { status: 400 });

    try {
      const [photosResult, tagsResult] = await Promise.all([
        companyCamGet(`/projects/${projectId}/photos?limit=${limit}`, apiKey),
        companyCamGet(`/projects/${projectId}/photos/tags`, apiKey),
      ]);

      if (!photosResult.response.ok) {
        return Response.json({ ok: false, companycamStatus: photosResult.response.status, error: 'CompanyCam photo request failed', details: photosResult.data }, { status: photosResult.response.status });
      }
      if (!tagsResult.response.ok) {
        return Response.json({ ok: false, companycamStatus: tagsResult.response.status, error: 'CompanyCam photo-tag request failed', details: tagsResult.data }, { status: tagsResult.response.status });
      }

      const photos = Array.isArray(photosResult.data?.data) ? photosResult.data.data.map((photo) => ({
        id: photo.id,
        project_id: photo.project_id,
        captured_at: photo.captured_at,
        created_at: photo.created_at,
        description: photo.description?.plain_text_content ?? null,
        uris: photo.uris,
      })) : [];

      const tags = Array.isArray(tagsResult.data?.data) ? tagsResult.data.data.map((tag) => ({
        id: tag.id,
        display_value: tag.display_value,
        value: tag.value,
        tag_type: tag.tag_type,
      })) : [];

      return Response.json({
        ok: true,
        storagePolicy: 'inspection only; no photos are copied or stored',
        projectId,
        photos,
        availablePhotoTags: tags,
        photoPagination: photosResult.data?.meta ?? null,
      });
    } catch (error) {
      console.error('CompanyCam photo metadata inspection failed', error);
      return Response.json({ ok: false, error: 'Unable to reach CompanyCam' }, { status: 502 });
    }
  },
};
