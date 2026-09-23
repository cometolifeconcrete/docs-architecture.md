# CompanyCam Integration — SealYourConcrete.com

## Purpose

Use CompanyCam as the **read-only source of truth** for project photos and metadata. Do not bulk-copy the CompanyCam library into Shopify or Vercel.

## Architecture

```text
CompanyCam originals
  -> read-only server API
  -> lightweight project/photo metadata index
  -> review: Unreviewed / Candidate / Approved for Web / Published
  -> copy + optimize only approved marketing assets
  -> Shopify/CDN
```

## Storage policy

- CompanyCam keeps the original field/project media.
- The SealYourConcrete integration indexes references and metadata, not the full image library.
- No bulk photo import is permitted by default.
- Only explicitly approved marketing assets are copied into the public website asset layer.
- Shopify remains the storefront and commerce system.
- Vercel is used only for server-side integration functions.

## Authentication

The private SealYourConcrete integration uses the server-side `COMPANYCAM_API_KEY` environment variable. The key must never be exposed to Shopify theme code, browser JavaScript, GitHub, or chat.

Legacy OAuth client variables may remain temporarily during setup but are not required by the current private application-key workflow.

## Current server routes

- `/api/companycam/verify` — checks that the server-side CompanyCam credential is accepted.
- `/api/companycam/projects` — reads a paginated project index. It returns metadata only and does not copy/store image files.

## Planned indexing workflow

1. Read projects from CompanyCam.
2. Read photo metadata/references only for projects selected for review.
3. Classify useful photos in our own index as `Unreviewed`, `Candidate`, `Approved for Web`, or `Published`.
4. Pair/group approved before-and-after assets by project.
5. Optimize and copy only approved public assets to the website/CDN layer.
6. Keep CompanyCam as the source for originals.

## Security requirements

1. Read-only/least-privilege CompanyCam access only.
2. No create/update/delete CompanyCam operations without explicit owner approval.
3. No CompanyCam secret in repository history or frontend code.
4. Public website traffic must not call CompanyCam directly with credentials.
5. If webhooks are later enabled, validate CompanyCam signatures against the raw request body and make processing idempotent.

## Acceptance criteria

- Server-side CompanyCam credential verifies successfully.
- Projects can be read without write permission.
- Photo metadata can be indexed without bulk copying originals.
- Only explicitly approved assets are copied into the public website asset library.
- No CompanyCam mutation is performed by the integration.
