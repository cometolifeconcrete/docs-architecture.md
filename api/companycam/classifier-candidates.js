const API_BASE = 'https://app.companycam.com/public_api/v1';

async function ccGet(path, apiKey) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) throw new Error(`CompanyCam ${response.status}: ${path}`);
  return data;
}

function safeProjectName(project) {
  // Project name is useful internally for review; deliberately omit address/customer/location fields.
  return project?.name || project?.title || null;
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
    const limit = Math.min(25, Math.max(1, Number.parseInt(incoming.searchParams.get('limit') || '20', 10)));
    if (!/^\d+$/.test(projectId || '')) return Response.json({ ok: false, error: 'A numeric project_id is required' }, { status: 400 });

    try {
      const [projectPayload, photoPayload, tagPayload] = await Promise.all([
        ccGet(`/projects/${projectId}`, apiKey),
        ccGet(`/projects/${projectId}/photos?limit=${limit}`, apiKey),
        ccGet(`/projects/${projectId}/photos/tags`, apiKey),
      ]);

      const project = projectPayload?.data || projectPayload;
      const availableTags = Array.isArray(tagPayload?.data) ? tagPayload.data.map((t) => ({ id: t.id, name: t.display_value || t.value })) : [];
      const photos = Array.isArray(photoPayload?.data) ? photoPayload.data : [];

      const candidates = photos.map((photo, index) => ({
        project_id: String(projectId),
        project_name: safeProjectName(project),
        photo_id: String(photo.id),
        captured_at: photo.captured_at || photo.created_at || null,
        sequence_index: index,
        preview_url: photo.uris?.web || photo.uris?.thumbnail || null,
        existing_tags: [],
        suggestions: [],
        review_status: 'Unreviewed',
      }));

      return Response.json({
        ok: true,
        mode: 'read-only classifier candidate feed',
        allowedSuggestedTags: ['Stamp', 'Before', 'After', 'Broom', 'Aggregate', 'Glam Shot', 'Revival'],
        privacy: 'customer/address/location fields intentionally omitted',
        project: { id: String(projectId), name: safeProjectName(project) },
        availableProjectPhotoTags: availableTags,
        candidates,
        pagination: photoPayload?.meta || null,
      });
    } catch (error) {
      console.error('Classifier candidate feed failed', error);
      return Response.json({ ok: false, error: 'Unable to build classifier candidate feed' }, { status: 502 });
    }
  },
};
