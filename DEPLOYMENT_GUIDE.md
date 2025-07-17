# 🚀 BookRecs Deployment Guide

This guide will help you deploy your BookRecs application to production using modern hosting providers.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **MongoDB Atlas Account** - For database hosting
3. **Railway Account** - For backend hosting
4. **Vercel Account** - For frontend hosting

## 🗄️ Step 1: Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/bookrecs`

## 🔧 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with your GitHub account

### 2.2 Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Choose the `backend` folder as the root directory
4. Railway will automatically detect it's a Node.js app

### 2.3 Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookrecs
JWT_SECRET=your_super_secure_jwt_secret_key_here
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2.4 Get Backend URL
After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with your GitHub account

### 3.2 Deploy Frontend
1. Click "New Project"
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Vercel will auto-detect it's a Vite React app

### 3.3 Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api
VITE_APP_NAME=BookRecs
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
```

### 3.4 Update Backend CORS
Update your Railway backend environment variables to include your Vercel URL:
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🧪 Step 4: Test Your Deployment

### 4.1 Backend Health Check
Visit: `https://your-backend-domain.railway.app/health`
Should return: `{"status":"OK","timestamp":"...","environment":"production"}`

### 4.2 Frontend Test
1. Visit your Vercel URL
2. Try registering a new user
3. Test login functionality
4. Create a book recommendation
5. Test all major features

### 4.3 API Connection Test
Open browser dev tools and check:
- No CORS errors
- API calls are successful
- Authentication works properly

## 🔄 Step 5: Set Up Automatic Deployments

### Backend (Railway)
- Railway automatically redeploys when you push to your main branch
- Monitor deployments in Railway dashboard

### Frontend (Vercel)
- Vercel automatically redeploys when you push to your main branch
- Monitor deployments in Vercel dashboard

## 🛠️ Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `FRONTEND_URL` is set correctly in Railway
- Check that your backend CORS configuration includes your Vercel domain

**Database Connection Issues:**
- Verify MongoDB Atlas connection string
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

**Build Failures:**
- Check build logs in Railway/Vercel dashboards
- Ensure all dependencies are listed in package.json
- Verify environment variables are set correctly

**API Not Working:**
- Check Railway logs for backend errors
- Verify API endpoints are accessible
- Test backend health endpoint

### Useful Commands

**Test Backend Locally:**
```bash
cd backend
npm install
npm start
```

**Test Frontend Locally:**
```bash
cd frontend
npm install
npm run dev
```

**Check Backend Logs:**
- Go to Railway dashboard → Your project → Deployments → View logs

**Check Frontend Logs:**
- Go to Vercel dashboard → Your project → Functions → View logs

## 📊 Monitoring & Maintenance

### Performance Monitoring
- Use Vercel Analytics for frontend performance
- Monitor Railway metrics for backend performance
- Set up MongoDB Atlas monitoring

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Regular database backups

### Scaling
- Railway: Upgrade plan for more resources
- Vercel: Automatic scaling included
- MongoDB Atlas: Upgrade cluster for more storage/performance

## 🎉 Success!

Your BookRecs application should now be live and accessible to users worldwide!

**Frontend URL:** https://your-frontend-domain.vercel.app
**Backend URL:** https://your-backend-domain.railway.app
**Database:** MongoDB Atlas cluster

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment logs in Railway/Vercel dashboards
3. Verify all environment variables are set correctly
4. Test API endpoints individually
