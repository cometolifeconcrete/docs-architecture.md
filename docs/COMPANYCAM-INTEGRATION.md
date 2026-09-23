# CompanyCam Integration — SealYourConcrete.com

## Purpose

Use CompanyCam as a **read-only source of project photos and metadata** for the SealYourConcrete.com asset workflow. Approved before/after project photos can later be surfaced on the website/Shopify experience without exposing CompanyCam credentials to the browser.

## Registered CompanyCam application

- Name: `SealYourConcrete Photo Library`
- Access: read-only
- Client type: confidential
- OAuth callback: `https://sealyourconcrete.com/api/companycam/callback`

## Architecture

```text
CompanyCam
  -> OAuth 2.0 / Bearer access token
  -> server-side SealYourConcrete integration
  -> project/photo/tag metadata index
  -> approved website/Shopify assets
```

The CompanyCam OpenAPI specification defines `https://app.companycam.com` as the API server and describes the public API as OAuth2-authenticated. API requests use Bearer access tokens. A token can be checked with `POST /public_api/v1/access_tokens/verify`.

## Security requirements

1. CompanyCam client credentials and access tokens are server-side secrets only.
2. Never expose credentials in Shopify theme code, browser JavaScript, public environment variables, GitHub, or chat.
3. Request and retain only read-only/least-privilege access.
4. Do not add create/update/delete CompanyCam operations without explicit owner approval.
5. Validate outbound CompanyCam webhook signatures against the raw HTTP request body before processing webhook events.
6. Make webhook/event processing idempotent.

## Webhook verification

The supplied CompanyCam API specification states that webhook deliveries include `X-CompanyCam-Signature` containing:

`Base64(HMAC-SHA1(webhook.token, raw_body))`

Verification must use the raw request body rather than a re-serialized JSON payload.

## Intended data flow

Phase 1 is intentionally read-only:

1. Authorize SealYourConcrete with CompanyCam using the registered confidential OAuth application.
2. Store the resulting credentials/tokens only in the server-side deployment environment.
3. Read CompanyCam projects.
4. Read project photos and associated tags/metadata supported by the API.
5. Maintain a server-side index/reference layer for assets needed by SealYourConcrete.
6. Allow only explicitly approved before/after assets to be surfaced by the public site/Shopify layer.

CompanyCam remains the source of the field/project media. Shopify remains the commerce system; the CompanyCam integration should not make Shopify responsible for storing CompanyCam API secrets.

## Required server routes

The application implementation should provide these server-side routes (exact framework mapping can vary):

- `/api/companycam/connect` — begin OAuth authorization.
- `/api/companycam/callback` — receive the registered OAuth callback and securely persist the resulting authorization.
- `/api/companycam/verify` — server-side integration health check using CompanyCam's access-token verification endpoint.
- `/api/companycam/webhook` — receive and validate CompanyCam webhooks if/when webhook synchronization is enabled.

## Implementation gate

Before production activation, the deployment environment must have the CompanyCam OAuth client credentials configured securely. Do not commit them to this repository.

The current repository initially contains documentation only, so the actual callback/API routes must be implemented when the SealYourConcrete application scaffold is added.

## Acceptance criteria

- CompanyCam authorization succeeds through the registered callback URL.
- A server-side token verification call succeeds.
- CompanyCam projects can be read without any write permission.
- Project photo metadata can be retrieved for the website asset workflow.
- No CompanyCam credential or token is present in frontend code or repository history.
- No CompanyCam mutation is performed by the integration.
