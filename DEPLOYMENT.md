# Deployment

This project has two deployable apps:

- `frontend`: React/Vite app, deploy on Vercel.
- `backend`: Express API, deploy on Render.

MongoDB Atlas is required for login, signup, reset password, and user-linked search history.

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow network access from Render. For a quick student/demo deployment, allow:

   ```text
   0.0.0.0/0
   ```

4. Copy the connection string and include a database name:

   ```text
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/smartspend
   ```

Use that value as `MONGO_URI` in Render.

## 2. Backend on Render

Create a new Render Blueprint from this GitHub repo. Render will read `render.yaml`.

Set these Render environment values:

```text
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/smartspend
OPENAI_API_KEY=optional-for-real-AI
FOURSQUARE_API_KEY=optional-for-real-places
OPENWEATHER_API_KEY=optional-for-real-weather
```

The blueprint already sets:

```text
NODE_ENV=production
DEMO_MODE=true
CORS_ORIGIN=https://smart-spend-trip-frontend.vercel.app,https://riyasingh2006-24.github.io
CORS_ORIGIN_PATTERNS=https://*.vercel.app
```

After deployment, test:

```text
https://smartspendtrip-1.onrender.com/api/health
```

If Render gives your service a different external URL, use that URL in the next
steps instead of the example `smartspendtrip-1.onrender.com` host.

Your frontend API base URL is:

```text
https://smartspendtrip-1.onrender.com/api
```

## 3. Frontend on Vercel

Import this GitHub repo into Vercel. The root `vercel.json` builds `frontend`.

Set this Vercel environment variable:

```text
VITE_API_BASE_URL=https://smartspendtrip-1.onrender.com/api
```

If you prefer to keep the frontend on same-origin `/api`, set this Vercel
environment variable for the proxy function instead:

```text
API_ORIGIN=https://smartspendtrip-1.onrender.com
```

Then deploy.

If your Vercel domain is not `https://smart-spend-trip-frontend.vercel.app`, update Render:

```text
FRONTEND_BASE_URL=https://YOUR-VERCEL-DOMAIN
CORS_ORIGIN=https://YOUR-VERCEL-DOMAIN,https://riyasingh2006-24.github.io
```

Then redeploy the Render backend.
