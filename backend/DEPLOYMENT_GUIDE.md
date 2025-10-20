# Deployment Guide

This guide covers deploying both the backend (Python/FastAPI) and frontend (Next.js) to production.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Alternative Platforms](#alternative-platforms)

---

## Environment Setup

### Backend Environment Variables
Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend Environment Variables
The frontend uses environment variables for the API URL:

**Local Development** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

**Production** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_WS_URL=https://your-backend-url.com
```

---

## Backend Deployment (Render)

### Prerequisites
- Render account (https://render.com)
- GitHub/GitLab repository with your code
- Groq API key

### Step 1: Prepare Backend for Deployment

1. **Check `pyproject.toml`** - All dependencies should be listed (already done):
   ```toml
   dependencies = [
       "groq>=0.31.0",
       "langchain>=0.3.27",
       # ... other dependencies
       "fastapi>=0.115.0",
       "uvicorn[standard]>=0.32.0",
       "python-socketio>=5.11.0",
       "python-multipart>=0.0.12",
       "aiofiles>=23.2.1",
   ]
   ```

2. **Generate UV lock file** (if not already done):
   ```bash
   uv lock
   ```

### Step 2: Deploy to Render

1. **Create New Web Service**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository

2. **Configure Service**:
   - **Name**: `brahmastra-coder-api`
   - **Runtime**: Python 3
   - **Build Command**: `uv sync`
   - **Start Command**: `uv run uvicorn api.server:socket_app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free or Starter (depending on needs)

3. **Environment Variables**:
   Add these in the Render dashboard:
   - `GROQ_API_KEY`: Your Groq API key
   - `PYTHON_VERSION`: `3.11` (or higher)
   - `PORT`: (Auto-set by Render, typically 10000)

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL: `https://your-app-name.onrender.com`

### Step 3: Test Backend

Test your deployed backend:
```bash
curl https://your-app-name.onrender.com/api/health
```

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub/GitLab repository

### Step 1: Prepare Frontend for Deployment

1. **Update `.env.production`**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_WS_URL=https://your-backend-url.onrender.com
   ```

2. **Update Backend CORS** (if needed):
   Edit `api/server.py` to allow your frontend domain:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000",
           "https://your-frontend-domain.vercel.app"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. **Import Project**:
   - Go to https://vercel.com/new
   - Import your repository
   - Select the `frontend` directory as root

2. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

3. **Environment Variables**:
   Add in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com`
   - `NEXT_PUBLIC_WS_URL`: `https://your-backend-url.onrender.com`

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at: `https://your-app.vercel.app`

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   vercel env add NEXT_PUBLIC_WS_URL production
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Alternative Platforms

### Backend Alternatives

#### **Railway** (Similar to Render)
- **Build Command**: `uv sync`
- **Start Command**: `uv run uvicorn api.server:socket_app --host 0.0.0.0 --port $PORT`
- **Pros**: Faster deployments, better DX
- **Cons**: Limited free tier

#### **Fly.io**
Create `fly.toml`:
```toml
app = "brahmastra-coder"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

Deploy:
```bash
fly launch
fly secrets set GROQ_API_KEY=your_key
fly deploy
```

### Frontend Alternatives

#### **Netlify**
Create `netlify.toml` in `frontend/`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy:
```bash
cd frontend
netlify deploy --prod
```

#### **Cloudflare Pages**
- Connect GitHub repository
- Set build command: `npm run build`
- Set build output: `.next`
- Add environment variables in dashboard

---

## Post-Deployment Checklist

### Backend
- [ ] API health endpoint responds: `/api/health`
- [ ] WebSocket connection works
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly
- [ ] Logs are accessible and clean

### Frontend
- [ ] App loads without errors
- [ ] Can connect to backend API
- [ ] WebSocket connection establishes
- [ ] Light/Dark mode works
- [ ] Code/Preview mode toggle works
- [ ] Generated projects display correctly

---

## Troubleshooting

### Backend Issues

**Error: "Module not found"**
- Ensure `uv lock` was run before deployment
- Check all dependencies are in `pyproject.toml`

**Error: "Connection refused"**
- Check if backend is actually running
- Verify `PORT` environment variable is set

**Error: "CORS policy"**
- Update CORS settings in `api/server.py`
- Add frontend domain to `allow_origins`

### Frontend Issues

**Error: "Failed to connect to backend"**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is accessible from browser
- Check browser console for CORS errors

**Theme not working**
- Clear browser cache
- Check if theme state is persisting

**Preview not loading**
- Check if HTML files exist in generated project
- Verify `/api/preview` endpoint works on backend

---

## Monitoring

### Backend Monitoring (Render)
- View logs: Render Dashboard → Logs tab
- Monitor metrics: CPU, Memory usage
- Set up alerts for downtime

### Frontend Monitoring (Vercel)
- View deployment logs: Vercel Dashboard
- Analytics: Enable Vercel Analytics
- Real-time errors: Enable Vercel Speed Insights

---

## Scaling Considerations

### Backend
- **Horizontal Scaling**: Add more instances on Render
- **Caching**: Implement Redis for session management
- **Queue**: Use Celery for long-running tasks

### Frontend
- **Edge Caching**: Leverage Vercel Edge Network
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Ensure dynamic imports are used

---

## Cost Estimates

### Free Tier (Development)
- **Backend**: Render Free Tier
  - Limitations: Spins down after inactivity
  - Cost: $0/month
  
- **Frontend**: Vercel Hobby
  - Limitations: Personal projects only
  - Cost: $0/month

### Production (Low Traffic)
- **Backend**: Render Starter ($7/month)
  - Always on, better performance
  
- **Frontend**: Vercel Pro ($20/month)
  - Team collaboration, better support

### Production (High Traffic)
- **Backend**: Render Standard ($25+/month)
  - Multiple instances, auto-scaling
  
- **Frontend**: Vercel Enterprise (Custom pricing)
  - Advanced features, SLA

---

## Security Best Practices

1. **Never commit** `.env` files
2. **Use environment variables** for all secrets
3. **Enable HTTPS** only (handled by platforms)
4. **Implement rate limiting** on backend
5. **Add authentication** if exposing to public
6. **Regular dependency updates**: Run `uv lock --upgrade`

---

## Support

For issues:
- Backend: Check Render logs
- Frontend: Check Vercel deployment logs
- API Issues: Test with `curl` or Postman
- WebSocket Issues: Use browser DevTools → Network → WS tab

---

**Happy Deploying! 🚀**
