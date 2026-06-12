# Deployment

The React frontend can run on GitHub Pages, but the Express backend needs a Node
host. GitHub Pages cannot run `backend/src/server.js`.

## Backend on Render

1. Open Render and create a new Blueprint from this GitHub repo.
2. Render will read `render.yaml` and create `smartspendtrip-api`.
3. After deployment, open:

   ```text
   https://smartspendtrip-api.onrender.com/api/health
   ```

4. Copy the backend base URL with `/api`:

   ```text
   https://smartspendtrip-api.onrender.com/api
   ```

## Frontend on GitHub Pages

Set this GitHub repository variable:

```text
VITE_API_BASE_URL=https://smartspendtrip-api.onrender.com/api
```

Then rerun the GitHub Pages workflow from the Actions tab.
