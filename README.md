# Qwik Service Capstone — evaluator page

Standalone Click-to-Call page for the Qwik Service appointment assistant.

The page contains only the evaluator-facing surface:

- Sam voice assistant via Cognigy Click-to-Call;
- secure appointment-support experience;
- dynamic Cancellation xApp link received from the active call session.

## Local preview

Serve the folder over HTTP during development:

```bash
python3 -m http.server 10001
```

The browser-local Connection settings dialog can be used for a private test Endpoint URL. When a deployment contains the `COGNIGY_ENDPOINT_CONFIG_URL` secret, the page uses that embedded Endpoint automatically and hides the local settings control. The dialog is only a fallback for local or private builds without deployment-time configuration.

## Deployment

GitHub Pages is deployed by `.github/workflows/deploy-pages.yml`. The workflow reads the Cognigy Endpoint configuration URL from the repository secret:

```text
COGNIGY_ENDPOINT_CONFIG_URL
```

The value is injected into the generated Pages artifact at deployment time and is not committed to Git. It is necessarily visible to the browser that uses the Click-to-Call page; Cognigy API credentials remain in Cognigy Connections and are never stored here.

## Temporary evaluation release

Treat the Pages URL as a public evaluator link. `noindex` reduces search-engine discovery but is not access control. Disable the site and rotate/revoke replaceable Endpoint access when the evaluation window ends.
