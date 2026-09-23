# CompanyCam Photo Classifier

## Goal

Reduce manual CompanyCam tagging by generating **suggested** website-curation tags from read-only CompanyCam photo previews and project context. The classifier must not write tags or other changes back to CompanyCam.

## Allowed taxonomy

### Photo role
- Before
- After
- Glam Shot

### Surface type
- Stamp
- Broom
- Aggregate

### Treatment/project category
- Revival

A photo may receive multiple suggested tags.

## Safety boundary

CompanyCam remains read-only. The classifier may:
- read project metadata;
- read photo metadata;
- read existing photo tags;
- inspect thumbnail/web-sized image references;
- create suggested classifications in the SealYourConcrete integration layer.

The classifier may NOT:
- add/remove CompanyCam tags;
- rename projects;
- edit customer/project information;
- upload photos;
- delete photos/projects;
- expose customer names, addresses, coordinates, phone numbers, or other private project information publicly.

## Classifier output

For each photo candidate, record:

```json
{
  "project_id": "...",
  "project_name": "...",
  "photo_id": "...",
  "captured_at": "...",
  "preview_url": "...",
  "existing_tags": [],
  "suggestions": [
    {
      "tag": "After",
      "confidence": 0.91,
      "reason": "Finished, uniformly sealed surface and late project sequence"
    }
  ],
  "review_status": "Unreviewed"
}
```

## Review states

`Unreviewed -> Candidate -> Approved for Web -> Published`

Suggested AI tags are never equivalent to human approval.

## Pilot

Start with approximately 10 representative projects / 100–200 photos. Evaluate performance separately for each tag. Do not scale automatically until the pilot has been reviewed.

### Evaluation priorities
1. Stamp / Broom / Aggregate — visual surface classification.
2. Before / After — visual condition plus project chronology/context.
3. Revival — use project context and visible treatment evidence; avoid guessing when ambiguous.
4. Glam Shot — marketing-quality suggestion only; human approval required.

## Storage

Do not copy original CompanyCam photos during classification. Use thumbnail/web-sized references for analysis. Only assets explicitly approved for the public website should later be optimized/copied to the Shopify/CDN asset layer.
