# Tableicity — AWS Deployment Walkthrough

A step-by-step guide to deploying Tableicity on AWS using App Runner, RDS, S3, CloudFront, and ECR. This guide assumes you are deploying manually from GitHub — no automatic triggers.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Set Up RDS (PostgreSQL Database)](#step-1-set-up-rds-postgresql-database)
4. [Step 2: Migrate Your Database](#step-2-migrate-your-database)
5. [Step 3: Set Up S3 (Document Storage)](#step-3-set-up-s3-document-storage)
6. [Step 4: Set Up ECR (Container Registry)](#step-4-set-up-ecr-container-registry)
7. [Step 5: Build and Push Docker Image](#step-5-build-and-push-docker-image)
8. [Step 6: Set Up App Runner](#step-6-set-up-app-runner)
9. [Step 7: Set Up CloudFront (CDN)](#step-7-set-up-cloudfront-cdn)
10. [Step 8: Configure Custom Domain](#step-8-configure-custom-domain)
11. [Step 9: Configure SES (Email)](#step-9-configure-ses-email)
12. [Step 10: Verify Everything Works](#step-10-verify-everything-works)
13. [Ongoing Operations](#ongoing-operations)
14. [Cost Estimates](#cost-estimates)
15. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

```
    Users
      │
      ▼
┌───────────────┐
│   Route 53    │  ← www.tableicity.com DNS
└──────┬────────┘
       │
┌──────▼────────┐
│  CloudFront   │  ← CDN, SSL termination, caching
└──────┬────────┘
       │
┌──────▼────────┐
│  App Runner   │  ← Express server (API + React frontend)
└──┬─────────┬──┘
   │         │
┌──▼───┐  ┌──▼──┐
│ RDS  │  │ S3  │  ← PostgreSQL database / Document storage
└──────┘  └─────┘
       │
┌──────▼────────┐
│    SES        │  ← Email verification & MFA codes
└───────────────┘
```

**Data Flow:**
- Users hit CloudFront → routes to App Runner
- App Runner serves the React frontend and Express API
- API reads/writes to RDS (PostgreSQL)
- Document uploads go to S3
- Email verification codes sent via SES

---

## 2. Prerequisites

Before you begin, make sure you have:

- [ ] An AWS account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker Desktop installed on your local machine
- [ ] The Tableicity code cloned from GitHub: `git clone https://github.com/Tableicity/tableicity.git`
- [ ] The database backup file: `tableicity_db_backup.dump` (included in the repo)
- [ ] Your environment variable values ready:
  - `SESSION_SECRET` (any random 64-character string)
  - `STRIPE_SECRET_KEY` (from Stripe dashboard)
  - `STRIPE_PUBLISHABLE_KEY` (from Stripe dashboard)

### Choose Your AWS Region

Pick one region and use it consistently for all services. Recommended:
- **us-east-1** (N. Virginia) — cheapest, most services available
- **us-west-2** (Oregon) — good alternative

This guide uses `us-east-1`. Replace with your chosen region throughout.

---

## Step 1: Set Up RDS (PostgreSQL Database)

### 1.1 Create the RDS Instance

1. Go to **AWS Console → RDS → Create Database**
2. Choose **Standard Create**
3. Engine: **PostgreSQL** (version 14 or 15)
4. Template: **Free Tier** (for testing) or **Production** (for live)
5. Settings:
   - DB Instance Identifier: `tableicity-db`
   - Master Username: `tableicity_admin`
   - Master Password: Choose a strong password and save it
6. Instance Configuration:
   - **Free Tier**: `db.t3.micro` (1 vCPU, 1 GB RAM)
   - **Production**: `db.t3.small` or `db.t3.medium` recommended
7. Storage:
   - Type: **gp3**
   - Allocated: **20 GB** (expandable)
   - Enable storage autoscaling: Yes
8. Connectivity:
   - VPC: Default VPC
   - Public Access: **Yes** (for initial setup; restrict later)
   - VPC Security Group: Create new → name it `tableicity-db-sg`
9. Database Authentication: **Password authentication**
10. Additional Configuration:
    - Initial Database Name: `tableicity`
    - Backup retention: 7 days
    - Enable deletion protection: Yes (for production)

11. Click **Create Database** — this takes 5-10 minutes.

### 1.2 Configure Security Group

1. Go to **EC2 → Security Groups** → find `tableicity-db-sg`
2. Edit Inbound Rules:
   - Type: **PostgreSQL** (port 5432)
   - Source: **My IP** (for initial setup)
   - Add another rule: Source: **App Runner security group** (after Step 6)
3. Save rules

### 1.3 Get Your Connection String

Once the RDS instance is available, go to the instance details and note the **Endpoint**. Your connection string will be:

```
postgresql://tableicity_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/tableicity
```

Example:
```
postgresql://tableicity_admin:MyStr0ngP@ss@tableicity-db.abc123xyz.us-east-1.rds.amazonaws.com:5432/tableicity
```

---

## Step 2: Migrate Your Database

### 2.1 Restore the Database Backup

From your local machine (where you have the repo cloned):

```bash
cd tableicity

# Restore the full database dump into RDS
pg_restore --no-owner --no-acl \
  -h YOUR_RDS_ENDPOINT \
  -U tableicity_admin \
  -d tableicity \
  tableicity_db_backup.dump
```

Enter your RDS password when prompted.

### 2.2 Verify the Restore

```bash
# Connect to verify
psql -h YOUR_RDS_ENDPOINT -U tableicity_admin -d tableicity

# Check public schema tables
\dt public.*

# Check tenant schemas exist
\dn tenant_*

# Check a tenant's tables
\dt tenant_acme.*

# Exit
\q
```

You should see:
- **Public schema**: `users`, `tenants`, `tenant_members`, `session`, `platform_resources`, `trial_signups`
- **Tenant schemas**: `tenant_acme` (and any others) with `companies`, `stakeholders`, `securities`, `safe_agreements`, etc.

### 2.3 Verify User Accounts

```bash
psql -h YOUR_RDS_ENDPOINT -U tableicity_admin -d tableicity \
  -c "SELECT id, email, username FROM users LIMIT 10;"
```

---

## Step 3: Set Up S3 (Document Storage)

### 3.1 Create the S3 Bucket

1. Go to **AWS Console → S3 → Create Bucket**
2. Bucket name: `tableicity-documents` (must be globally unique, add a suffix if taken)
3. Region: `us-east-1`
4. Block all public access: **Yes** (documents served through the app, not directly)
5. Versioning: **Enable** (protects against accidental deletes)
6. Encryption: **SSE-S3** (default encryption)
7. Click **Create Bucket**

### 3.2 Create an IAM Policy for S3 Access

1. Go to **IAM → Policies → Create Policy**
2. JSON editor:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::tableicity-documents",
        "arn:aws:s3:::tableicity-documents/*"
      ]
    }
  ]
}
```

3. Name it: `TableicityS3Access`
4. Create the policy

### 3.3 Create IAM User for the App

1. Go to **IAM → Users → Create User**
2. Username: `tableicity-app`
3. Attach policies:
   - `TableicityS3Access` (created above)
   - `AmazonSESFullAccess` (for email — or create a scoped policy)
4. Create access keys:
   - Use case: **Application running outside AWS**
   - Save the **Access Key ID** and **Secret Access Key**

> Note: These become your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables.

---

## Step 4: Set Up ECR (Container Registry)

### 4.1 Create the ECR Repository

```bash
aws ecr create-repository \
  --repository-name tableicity \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```

Note the **repositoryUri** from the output. It will look like:
```
123456789012.dkr.ecr.us-east-1.amazonaws.com/tableicity
```

### 4.2 Set Up Lifecycle Policy (Optional)

Keep only the last 10 images to save storage costs:

```bash
aws ecr put-lifecycle-policy \
  --repository-name tableicity \
  --region us-east-1 \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": { "type": "expire" }
    }]
  }'
```

---

## Step 5: Build and Push Docker Image

### 5.1 Clone and Build

```bash
# Clone from GitHub
git clone https://github.com/Tableicity/tableicity.git
cd tableicity

# Build the Docker image
docker build -t tableicity .
```

### 5.2 Test Locally (Optional but Recommended)

```bash
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://tableicity_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/tableicity" \
  -e SESSION_SECRET="any-random-string-here" \
  -e NODE_ENV=production \
  tableicity
```

Open `http://localhost:5000` — you should see the Tableicity login page.

### 5.3 Tag and Push to ECR

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Authenticate Docker with ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Tag the image
docker tag tableicity:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:latest

# Also tag with a version number for tracking
docker tag tableicity:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:v1.0.0

# Push both tags
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:v1.0.0
```

---

## Step 6: Set Up App Runner

### 6.1 Create an App Runner Service

1. Go to **AWS Console → App Runner → Create Service**
2. Source:
   - Repository type: **Container Registry**
   - Provider: **Amazon ECR**
   - Image URI: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tableicity:latest`
   - ECR access role: Create new or use existing (App Runner needs ECR pull access)
3. Deployment settings:
   - Deployment trigger: **Manual** (no automatic deployments)
4. Configure Service:
   - Service name: `tableicity`
   - CPU: **1 vCPU**
   - Memory: **2 GB**
   - Port: **5000**
5. Environment Variables (click "Add environment variable" for each):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://tableicity_admin:PASS@RDS_ENDPOINT:5432/tableicity` |
| `SESSION_SECRET` | Your random 64-character string |
| `NODE_ENV` | `production` |
| `AWS_ACCESS_KEY_ID` | From IAM user created in Step 3 |
| `AWS_SECRET_ACCESS_KEY` | From IAM user created in Step 3 |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `PORT` | `5000` |

6. Health Check:
   - Protocol: **HTTP**
   - Path: `/api/auth/me`
   - Healthy threshold: 3
   - Unhealthy threshold: 5
   - Interval: 10 seconds
   - Timeout: 5 seconds
7. Auto Scaling:
   - Min instances: **1**
   - Max instances: **3** (adjust based on traffic)
   - Max concurrency: **100**
8. Click **Create & Deploy**

This takes 3-5 minutes. App Runner will give you a URL like:
```
https://abc123xyz.us-east-1.awsapprunner.com
```

### 6.2 Test the App Runner URL

Open the App Runner URL in your browser. You should see the Tableicity login page with the marketing slideshow.

### 6.3 Connect App Runner to RDS

If your RDS instance is in a VPC (not publicly accessible), you'll need to set up a VPC connector:

1. In App Runner service settings → **Networking**
2. Create VPC Connector:
   - VPC: Same VPC as your RDS
   - Subnets: Select the same subnets
   - Security Group: Create one that allows outbound to port 5432
3. Update the RDS security group to allow inbound from the App Runner VPC connector security group

---

## Step 7: Set Up CloudFront (CDN)

### 7.1 Create CloudFront Distribution

1. Go to **AWS Console → CloudFront → Create Distribution**
2. Origin:
   - Origin Domain: Your App Runner URL (`abc123xyz.us-east-1.awsapprunner.com`)
   - Protocol: **HTTPS only**
   - Origin Path: Leave empty
3. Default Cache Behavior:
   - Viewer Protocol Policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP Methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache Policy: **CachingDisabled** (for API routes, the app handles caching)
   - Origin Request Policy: **AllViewerExceptHostHeader**
4. Settings:
   - Price Class: **Use all edge locations** (or restrict to reduce cost)
   - Alternate Domain Name (CNAME): `www.tableicity.com`
   - Custom SSL Certificate: Request one (see Step 8)
   - Default Root Object: Leave empty (Express handles routing)
5. Click **Create Distribution**

### 7.2 Create a Cache Behavior for Static Assets

Add a second cache behavior for static files:

1. Path Pattern: `/assets/*`
2. Cache Policy: **CachingOptimized** (24-hour TTL)
3. This caches JavaScript, CSS, and images at the edge

---

## Step 8: Configure Custom Domain

### 8.1 Request an SSL Certificate

1. Go to **AWS Console → Certificate Manager (ACM)**
2. **Important**: Must be in **us-east-1** for CloudFront
3. Request a public certificate:
   - Domain: `tableicity.com`
   - Additional names: `www.tableicity.com`
   - Validation: **DNS validation**
4. Add the CNAME records to your domain's DNS (where you registered the domain)
5. Wait for validation (usually 5-30 minutes)

### 8.2 Configure Route 53 (If Using Route 53 for DNS)

1. Go to **Route 53 → Hosted Zones**
2. Create or select `tableicity.com`
3. Create Record:
   - Name: `www`
   - Type: **A — Alias**
   - Route traffic to: **CloudFront distribution**
   - Select your distribution
4. Create another record for the apex domain:
   - Name: (leave blank for `tableicity.com`)
   - Type: **A — Alias**
   - Route traffic to: **CloudFront distribution**

### 8.3 If NOT Using Route 53

At your domain registrar, create a CNAME record:
- Name: `www`
- Value: Your CloudFront distribution domain (e.g., `d1234abcd.cloudfront.net`)

For the apex domain (`tableicity.com`), you'll need your registrar to support ALIAS/ANAME records, or use Route 53.

---

## Step 9: Configure SES (Email)

### 9.1 Verify Your Domain

1. Go to **AWS Console → SES → Verified Identities**
2. Create Identity → **Domain**
3. Domain: `tableicity.com`
4. Add the DNS records SES provides (DKIM, SPF)

### 9.2 Verify Sender Email

1. Create Identity → **Email Address**
2. Email: `noreply@tableicity.com` (or your preferred sender)
3. Click the verification link sent to that email

### 9.3 Request Production Access

By default, SES is in **sandbox mode** (can only send to verified emails). To send to any email:

1. Go to **SES → Account Dashboard**
2. Click **Request Production Access**
3. Fill out the form:
   - Mail type: Transactional
   - Use case: "Email verification codes and MFA for SaaS application"
   - Expected send volume: Start with 1,000/day
4. AWS usually approves within 24 hours

### 9.4 Update Your App Configuration

The app uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for SES. These were already set in Step 6. The SES sending region should match your app's configuration in `server/email-verification.ts`.

---

## Step 10: Verify Everything Works

### Checklist

Run through each of these to confirm the deployment is working:

- [ ] **Login Page Loads** — Visit `https://www.tableicity.com` and see the login page with marketing slideshow
- [ ] **Registration Works** — Create a new account, receive verification email via SES
- [ ] **Email Verification** — Enter the code, get verified
- [ ] **Login with MFA** — Login, receive MFA code, verify and enter dashboard
- [ ] **Dashboard Loads** — See ownership overview, charts, and metrics
- [ ] **Stakeholders** — View, create, edit, delete stakeholders
- [ ] **Share Classes** — Define and manage share classes
- [ ] **Securities** — Issue and track securities
- [ ] **SAFE Agreements** — Create a SAFE using the wizard
- [ ] **Equity Plans** — Navigate pools, plans, grants, warrants, phantom, SARs
- [ ] **Data Room** — Upload and categorize documents
- [ ] **Privacy Mode** — Toggle encrypted view on/off
- [ ] **Dark/Light Theme** — Toggle theme
- [ ] **Profile Page** — Change password, view subscription tiers
- [ ] **Multi-Tenant** — Verify tenant isolation (different users see different data)

### Quick API Health Check

```bash
# Should return 401 (server is alive, user not authenticated)
curl -s -o /dev/null -w "%{http_code}" https://www.tableicity.com/api/auth/me

# Should return pricing tiers JSON
curl -s https://www.tableicity.com/api/stripe/pricing
```

---

## Ongoing Operations

### Deploying Updates

When you push new code to GitHub and want to deploy:

```bash
# 1. Pull latest code
cd tableicity
git pull origin main

# 2. Build new Docker image
docker build -t tableicity .

# 3. Tag and push to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

docker tag tableicity:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/tableicity:latest

# 4. Go to AWS Console → App Runner → tableicity → Deploy
#    Click "Deploy" button to pull the new image
```

Total time: ~5 minutes from code push to live.

### Database Backups

RDS handles automated backups (7-day retention set in Step 1). For manual backups:

```bash
# Create a manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier tableicity-db \
  --db-snapshot-identifier tableicity-manual-$(date +%Y%m%d)

# Or dump to a file
pg_dump $DATABASE_URL --no-owner --no-acl -F c -f backup_$(date +%Y%m%d).dump
```

### Monitoring

1. **App Runner** — Built-in metrics (requests, latency, errors) in the console
2. **RDS** — CloudWatch metrics (CPU, connections, storage)
3. **CloudFront** — Request counts, cache hit ratio, error rates
4. **SES** — Bounce rate, complaint rate, delivery metrics

### Scaling

- **App Runner**: Adjust min/max instances and concurrency in service settings
- **RDS**: Modify instance class (vertical scaling) or add read replicas (horizontal scaling)
- **CloudFront**: Automatic — scales globally with no intervention

---

## Cost Estimates

### Minimum Viable (Testing / Early Stage)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| App Runner | 1 vCPU, 2 GB, 1 instance | ~$30 |
| RDS | db.t3.micro, 20 GB (Free Tier eligible) | $0 - $15 |
| S3 | 5 GB storage | ~$0.12 |
| CloudFront | 10 GB transfer | ~$0.85 |
| SES | 1,000 emails | ~$0.10 |
| ECR | 2 GB images | ~$0.20 |
| **Total** | | **~$30 - $47/mo** |

### Production (Growing)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| App Runner | 1 vCPU, 2 GB, 2-5 instances | ~$60 - $150 |
| RDS | db.t3.small, 50 GB, Multi-AZ | ~$50 - $100 |
| S3 | 50 GB storage | ~$1.15 |
| CloudFront | 100 GB transfer | ~$8.50 |
| SES | 10,000 emails | ~$1.00 |
| ECR | 5 GB images | ~$0.50 |
| Route 53 | Hosted zone + queries | ~$0.50 |
| **Total** | | **~$120 - $260/mo** |

---

## Troubleshooting

### App Runner shows "Deployment failed"

1. Check the **deployment logs** in App Runner console
2. Common causes:
   - Docker build fails → test locally with `docker build -t tableicity .`
   - Port mismatch → ensure `PORT=5000` is set in environment variables
   - Missing env vars → verify all required variables are set

### Can't connect to RDS from App Runner

1. Verify the VPC connector is attached to App Runner
2. Check the RDS security group allows inbound from App Runner's security group
3. Test the connection string locally first:
   ```bash
   psql "postgresql://tableicity_admin:PASS@RDS_ENDPOINT:5432/tableicity"
   ```

### Emails not sending

1. Check if SES is still in sandbox mode (only sends to verified emails)
2. Verify the sender email is verified in SES
3. Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in App Runner
4. Check SES sending statistics for bounces or complaints

### CloudFront returns 502/503 errors

1. Verify App Runner is running (check service status)
2. Check the origin configuration — make sure it points to the correct App Runner URL
3. Ensure the origin protocol is HTTPS
4. Check that all HTTP methods are allowed (not just GET/HEAD)

### Database connection drops

1. RDS instance may have restarted for maintenance — check RDS events
2. Connection pool exhaustion — the app handles this, but check for unusual traffic
3. Security group rules may have changed — verify port 5432 is open

### Session not persisting after deploy

1. Sessions are stored in PostgreSQL via `connect-pg-simple`
2. If the `session` table was lost during migration, users need to log in again
3. Verify `SESSION_SECRET` is the same across deployments (changing it invalidates all sessions)

### Static assets not loading

1. Check CloudFront cache behavior for `/assets/*`
2. Invalidate CloudFront cache: `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`
3. Verify the Vite build completed successfully (`npm run build`)

---

## Quick Reference Commands

```bash
# === ECR Login ===
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# === Build & Push ===
docker build -t tableicity .
docker tag tableicity:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tableicity:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tableicity:latest

# === Database Backup ===
pg_dump DATABASE_URL --no-owner --no-acl -F c -f backup.dump

# === Database Restore ===
pg_restore --no-owner --no-acl -d DATABASE_URL backup.dump

# === CloudFront Invalidation ===
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# === Check App Runner Logs ===
aws apprunner list-operations --service-arn SERVICE_ARN

# === RDS Snapshot ===
aws rds create-db-snapshot --db-instance-identifier tableicity-db --db-snapshot-identifier snap-$(date +%Y%m%d)
```

---

*Last updated: March 2026*
*Tableicity v1.0 — 524 commits*
