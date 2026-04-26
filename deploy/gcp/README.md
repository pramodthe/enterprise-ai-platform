# Deploy on Google Cloud (Cloud Run)

This app is two services: a **FastAPI** API and a **static React** UI (nginx). The UI calls the API using `VITE_API_BASE`, which is fixed at **image build** time. CORS on the API must allow your UI origin.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk) (`gcloud`) authenticated with a project.
- APIs: Artifact Registry, Cloud Build, Cloud Run.

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export AR_REPO=enterprise-ai

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create "$AR_REPO" --repository-format=docker --location="$REGION" 2>/dev/null || true
```

## 1. Deploy the API (first)

Build and push (from the **repository root**):

```bash
docker build -f backend/Dockerfile -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api:latest" .
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api:latest"
```

Or use Cloud Build for the **API image only** (recommended before you know the final API URL):

```bash
gcloud builds submit --config deploy/gcp/cloudbuild.api.yaml \
  --substitutions=_REGION=${REGION},_AR_REPO=${AR_REPO} \
  .
```

Create the Cloud Run service and set secrets as env (example uses Secret Manager; adjust to plain `--set-env-vars` for testing only):

```bash
gcloud run deploy enterprise-ai-api \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "CORS_ALLOW_ORIGINS=*" \
  --set-secrets "OPENAI_API_KEY=openai-api-key:latest"
```

Replace `--set-secrets` with `--set-env-vars=OPENAI_API_KEY=...` only if you accept storing the key in the service configuration.

Note the service URL, for example `https://enterprise-ai-api-xxxxx-uc.a.run.app`. Call it `API_URL` below (no trailing slash).

## 2. Lock down CORS (recommended)

Set `CORS_ALLOW_ORIGINS` to your UI URL once you know it (comma-separated for multiple origins):

```bash
gcloud run services update enterprise-ai-api --region "$REGION" \
  --set-env-vars "CORS_ALLOW_ORIGINS=https://YOUR-UI-SERVICE-xxxxx.run.app"
```

Until the UI exists, `*` is acceptable for internal tests only.

## 3. Build and deploy the UI

Rebuild the UI image with the real API origin so `VITE_API_BASE` is correct in the browser:

```bash
export API_URL="https://enterprise-ai-api-xxxxx-uc.a.run.app"

docker build -f new_frontend/Dockerfile \
  --build-arg "VITE_API_BASE=${API_URL}" \
  -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/ui:latest" .
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/ui:latest"

gcloud run deploy enterprise-ai-ui \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/ui:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

Then update the API CORS to the UI URL (step 2).

## Cloud Build

From the repo root, after `API_URL` is known, build **both** images:

```bash
gcloud builds submit --config deploy/gcp/cloudbuild.yaml \
  --substitutions=_REGION=${REGION},_AR_REPO=${AR_REPO},_VITE_API_BASE=${API_URL} \
  .
```

**API only:** `deploy/gcp/cloudbuild.api.yaml`  
**UI only (after you have `API_URL`):** `deploy/gcp/cloudbuild.ui.yaml` with `_VITE_API_BASE=${API_URL}`.

Deploy the new digests from the build output, or use `:latest` tags as in the examples above.

## Local Docker smoke test

```bash
docker build -f backend/Dockerfile -t enterprise-ai-api:local .
docker run --rm -p 8080:8080 -e PORT=8080 -e OPENAI_API_KEY="$OPENAI_API_KEY" enterprise-ai-api:local
curl -s http://127.0.0.1:8080/health
```

## Optional: custom domains

Map domains in Cloud Run console or `gcloud beta run domain-mappings create`, then set `CORS_ALLOW_ORIGINS` and rebuild the UI with `VITE_API_BASE` pointing at your API domain.
