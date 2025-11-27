# Server Environment Variables for Vercel Deployment

This guide lists all environment variables needed for DishDelight server deployment on Vercel.

## Required Environment Variables

### 1. **MongoDB Configuration**
```
DB_USER = your_mongodb_username
DB_PASSWORD = your_mongodb_password
DB_NAME = dishdelight
```

**How to get these:**
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Create a database user (Database Access)
- Copy username and password

**Example:**
```
DB_USER = rakibul_user
DB_PASSWORD = MySecure123Pass
DB_NAME = dishdelight
```

---

### 2. **JWT Secret (Authentication)**
```
JWT_SECRET = your-secret-key-here
```

**How to generate:**
Generate a strong random string (use any of these methods):

**Option A: Using OpenSSL (Linux/Mac/Windows PowerShell)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Online (⚠️ Use only for local dev, not production)**
```
https://www.uuidgenerator.net/
```

**Example:**
```
JWT_SECRET = aB3xYzP9qWlK2mNvRsTuJfGhIkLpOqRsT1uVwXyZ2aBc3DeF4GhI5JkL6MnO7P8Q
```

---

### 3. **Client Origin (CORS)**
```
CLIENT_ORIGIN = https://your-netlify-domain.netlify.app
```

**Set this AFTER deploying to Netlify**

**Examples:**
```
CLIENT_ORIGIN = https://dishdelight.netlify.app
CLIENT_ORIGIN = https://my-food-app.netlify.app
```

**Multiple origins (comma-separated):**
```
CLIENT_ORIGIN = https://dishdelight.netlify.app,http://localhost:3000
```

---

### 4. **Optional: Internal API Key**
```
INTERNAL_API_KEY = your-internal-key
```

**Default:** `dev-internal-key` (if not set)

**Used for:** OAuth sync endpoint authentication

**Example:**
```
INTERNAL_API_KEY = secret-internal-api-key-12345
```

---

### 5. **Optional: Port**
```
PORT = 5000
```

**Default:** `5000` (if not set)

**Note:** Vercel ignores this for production, but useful for local testing

---

## Step-by-Step Setup on Vercel

### 1. **Go to Vercel Dashboard**
- https://vercel.com/dashboard

### 2. **Select Your Project**
- Click on your DishDelight server project

### 3. **Go to Settings**
- Click "Settings" → "Environment Variables"

### 4. **Add Each Variable**

Add these variables one by one:

| Variable Name | Value | Notes |
|---|---|---|
| `DB_USER` | your_mongodb_username | From MongoDB Atlas |
| `DB_PASSWORD` | your_mongodb_password | From MongoDB Atlas |
| `DB_NAME` | dishdelight | Database name |
| `JWT_SECRET` | generated-secret-key | Generate random string |
| `CLIENT_ORIGIN` | https://your-site.netlify.app | Add AFTER Netlify deploy |
| `INTERNAL_API_KEY` | optional-key | Optional |

### 5. **Redeploy**
- Go to "Deployments"
- Click "Redeploy" on the latest deployment
- Or push a new commit to GitHub

---

## Complete Example Setup

```env
# MongoDB
DB_USER=dishdelight_admin
DB_PASSWORD=Secure1Pass@2024
DB_NAME=dishdelight

# JWT
JWT_SECRET=aB3xYzP9qWlK2mNvRsTuJfGhIkLpOqRsT1uVwXyZ2aBc3DeF4GhI5JkL6MnO7P8Q

# CORS
CLIENT_ORIGIN=https://dishdelight-app.netlify.app

# Optional
INTERNAL_API_KEY=my-internal-secret-key
PORT=5000
```

---

## Local Development Setup

Create `.env.local` in `dishdelight-server/` directory:

```env
DB_USER=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_NAME=dishdelight
JWT_SECRET=dev-secret-key-for-local-testing
CLIENT_ORIGIN=http://localhost:3000
INTERNAL_API_KEY=dev-internal-key
PORT=5000
```

**Test locally:**
```bash
npm install
npm start
# Visit http://localhost:5000
```

---

## Security Best Practices

✅ **DO:**
- Generate strong secrets (32+ characters)
- Use unique passwords for MongoDB
- Enable IP whitelist in MongoDB Atlas
- Rotate JWT secrets periodically
- Use different secrets for dev and production

❌ **DON'T:**
- Commit `.env` files to GitHub
- Share secrets in messages/emails
- Use simple passwords like "123456"
- Reuse same secret across projects
- Push secrets to public repositories

---

## Troubleshooting

### Error: "MongoDB connection failed"
**Solution:** Check `DB_USER`, `DB_PASSWORD`, `DB_NAME` are correct

### Error: "Invalid token"
**Solution:** Ensure `JWT_SECRET` is set and consistent

### Error: "CORS error"
**Solution:** Update `CLIENT_ORIGIN` to your Netlify domain

### Error: "Variable not found"
**Solution:** Redeploy after adding variables

---

## MongoDB Atlas Connection String

The server automatically builds the connection string using:
```javascript
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dojua2g.mongodb.net/?appName=Cluster0`;
```

**Components:**
- `DB_USER` = your database username
- `DB_PASSWORD` = your database password
- `cluster0.dojua2g.mongodb.net` = MongoDB cluster (from your account)

---

## Vercel Deployment URLs

After deploying with these variables, your API will be at:

```
https://your-project-name.vercel.app
```

**Example endpoints:**
```
GET    https://your-project.vercel.app/                    # Health check
GET    https://your-project.vercel.app/health              # Health status
POST   https://your-project.vercel.app/auth/register       # Register user
POST   https://your-project.vercel.app/auth/login          # Login user
GET    https://your-project.vercel.app/items               # Get all items
POST   https://your-project.vercel.app/products            # Create product
```

---

## Quick Reference Card

```
🔑 MongoDB Credentials
  DB_USER = [Your MongoDB username]
  DB_PASSWORD = [Your MongoDB password]
  DB_NAME = dishdelight

🔐 Security
  JWT_SECRET = [Generate with: openssl rand -base64 32]
  INTERNAL_API_KEY = [Optional internal key]

🌐 CORS
  CLIENT_ORIGIN = [Your Netlify domain after deployment]

⚙️ Server
  PORT = 5000 (optional, default)
```

---

## Next Steps

1. ✅ Copy MongoDB credentials
2. ✅ Generate JWT_SECRET
3. ✅ Go to Vercel dashboard
4. ✅ Add all variables
5. ✅ Redeploy
6. ✅ Test API: `https://your-project.vercel.app/health`
7. ✅ Deploy client to Netlify
8. ✅ Update CLIENT_ORIGIN with Netlify URL
9. ✅ Redeploy server
10. ✅ Test full integration

You're all set! 🚀
