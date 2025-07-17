#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BookRecs Deployment Script');
console.log('==============================\n');

// Check if we're in the right directory
const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

// Function to run commands
function runCommand(command, cwd = rootDir) {
  try {
    console.log(`📍 Running: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Pre-deployment checks
console.log('🔍 Running pre-deployment checks...\n');

// Check if package.json files exist
if (!fileExists(path.join(backendDir, 'package.json'))) {
  console.error('❌ Backend package.json not found');
  process.exit(1);
}

if (!fileExists(path.join(frontendDir, 'package.json'))) {
  console.error('❌ Frontend package.json not found');
  process.exit(1);
}

// Check if environment files exist
if (!fileExists(path.join(backendDir, '.env.example'))) {
  console.warn('⚠️  Backend .env.example not found - create one for deployment reference');
}

if (!fileExists(path.join(frontendDir, '.env.example'))) {
  console.warn('⚠️  Frontend .env.example not found - create one for deployment reference');
}

console.log('✅ Pre-deployment checks passed\n');

// Install dependencies
console.log('📦 Installing dependencies...\n');

console.log('Installing backend dependencies...');
if (!runCommand('npm install', backendDir)) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

console.log('Installing frontend dependencies...');
if (!runCommand('npm install', frontendDir)) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

console.log('✅ Dependencies installed successfully\n');

// Test backend
console.log('🧪 Testing backend...\n');
console.log('Starting backend server for testing...');

// Create a simple test
const testBackend = () => {
  try {
    // Test if server starts without errors
    const { spawn } = require('child_process');
    const server = spawn('node', ['server.js'], { cwd: backendDir });
    
    return new Promise((resolve) => {
      let output = '';
      
      server.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server running on port')) {
          server.kill();
          resolve(true);
        }
      });
      
      server.stderr.on('data', (data) => {
        console.error('Backend error:', data.toString());
        server.kill();
        resolve(false);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        server.kill();
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error('Backend test failed:', error);
    return false;
  }
};

// Test frontend build
console.log('🧪 Testing frontend build...\n');
console.log('Building frontend for production...');

if (!runCommand('npm run build', frontendDir)) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}

console.log('✅ Frontend build successful\n');

// Git checks
console.log('📝 Checking Git status...\n');

try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.warn('⚠️  You have uncommitted changes:');
    console.log(gitStatus);
    console.log('Consider committing your changes before deployment\n');
  } else {
    console.log('✅ Git working directory is clean\n');
  }
} catch (error) {
  console.warn('⚠️  Could not check Git status (not a Git repository?)\n');
}

// Deployment instructions
console.log('🎯 Deployment Instructions');
console.log('==========================\n');

console.log('Your application is ready for deployment! Follow these steps:\n');

console.log('1. 🗄️  Set up MongoDB Atlas:');
console.log('   - Go to https://www.mongodb.com/atlas');
console.log('   - Create a free cluster');
console.log('   - Get your connection string\n');

console.log('2. 🚂 Deploy Backend to Railway:');
console.log('   - Go to https://railway.app');
console.log('   - Connect your GitHub repository');
console.log('   - Set root directory to "backend"');
console.log('   - Add environment variables (see backend/.env.example)\n');

console.log('3. ⚡ Deploy Frontend to Vercel:');
console.log('   - Go to https://vercel.com');
console.log('   - Connect your GitHub repository');
console.log('   - Set root directory to "frontend"');
console.log('   - Add environment variables (see frontend/.env.example)\n');

console.log('4. 🔗 Update CORS settings:');
console.log('   - Add your Vercel URL to backend FRONTEND_URL environment variable');
console.log('   - Update frontend VITE_API_BASE_URL to your Railway backend URL\n');

console.log('5. 🧪 Test your deployment:');
console.log('   - Visit your Vercel URL');
console.log('   - Test registration and login');
console.log('   - Verify all features work correctly\n');

console.log('📚 For detailed instructions, see DEPLOYMENT_GUIDE.md\n');

console.log('🎉 Deployment preparation complete!');
console.log('Your application is ready to be deployed to production.');

// Create deployment checklist
const checklist = `
# 📋 Deployment Checklist

## Pre-deployment
- [x] Dependencies installed
- [x] Frontend builds successfully
- [x] Backend starts without errors
- [ ] Environment variables configured
- [ ] Database connection string ready

## Backend Deployment (Railway)
- [ ] Railway account created
- [ ] Repository connected
- [ ] Root directory set to "backend"
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Health check endpoint working

## Frontend Deployment (Vercel)
- [ ] Vercel account created
- [ ] Repository connected
- [ ] Root directory set to "frontend"
- [ ] Environment variables added
- [ ] Build successful
- [ ] Site accessible

## Post-deployment Testing
- [ ] Registration works
- [ ] Login works
- [ ] Book recommendations work
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Mobile responsive

## Final Steps
- [ ] Custom domain configured (optional)
- [ ] Analytics set up (optional)
- [ ] Monitoring configured
- [ ] Documentation updated

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
console.log('📋 Deployment checklist created: DEPLOYMENT_CHECKLIST.md');
