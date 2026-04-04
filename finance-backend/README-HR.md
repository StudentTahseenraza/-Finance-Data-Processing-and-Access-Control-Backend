# Finance Dashboard API - HR Review Guide

## 🚀 Live Deployment Links

- **API Base URL**: `https://finance-backend-api.vercel.app/api/v1`
- **Swagger Documentation**: `https://finance-backend-api.vercel.app/api-docs`
- **HR Review Guide**: `https://finance-backend-api.vercel.app/hr-review`
- **Postman Collection**: `https://finance-backend-api.vercel.app/api/postman-collection.json`
- **GitHub Repository**: `https://github.com/yourusername/finance-backend`

## 📦 What's Included

### Backend Features
- ✅ Complete REST API with 25+ endpoints
- ✅ JWT Authentication with refresh tokens
- ✅ Role-Based Access Control (Admin/Analyst/Viewer)
- ✅ Financial Records CRUD operations
- ✅ Dashboard analytics and insights
- ✅ Advanced filtering, search, and pagination
- ✅ Database with soft delete and audit logs
- ✅ Rate limiting and security measures
- ✅ Comprehensive error handling

### Documentation
- ✅ Interactive Swagger/OpenAPI documentation
- ✅ Postman collection for easy testing
- ✅ Step-by-step testing guide
- ✅ Sample API calls with curl commands

## 🧪 How to Test

### Option 1: Swagger UI (Recommended)
1. Visit the Swagger documentation link
2. Click "Authorize" button
3. First call `POST /auth/login` with test credentials
4. Copy the access token
5. Authorize with `Bearer YOUR_TOKEN`
6. Test any endpoint directly in browser

### Option 2: Postman
1. Download the Postman collection from the link above
2. Import into Postman
3. Set environment variable `baseUrl` to the API URL
4. Run requests in order (Login first, then others)

### Option 3: curl Commands
Use the sample commands provided in the HR Review Guide

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | Admin@123456 |
| Analyst | analyst@finance.com | Analyst@123456 |
| Viewer | viewer@finance.com | Viewer@123456 |

## ✅ Evaluation Criteria

### 1. Authentication & Security (20%)
- [ ] JWT token generation and validation
- [ ] Password hashing (bcrypt)
- [ ] Refresh token mechanism
- [ ] Rate limiting implementation
- [ ] Input validation and sanitization

### 2. Role-Based Access Control (25%)
- [ ] Admin has full access
- [ ] Analyst can create/update/delete records
- [ ] Viewer is read-only
- [ ] Permissions enforced on all endpoints
- [ ] Cannot access other users' data

### 3. Financial Records Management (20%)
- [ ] Create records with validation
- [ ] Read records with filtering
- [ ] Update records with ownership check
- [ ] Delete records (soft delete)
- [ ] Search and pagination working

### 4. Dashboard & Analytics (15%)
- [ ] Summary endpoint returns correct totals
- [ ] Category breakdown works
- [ ] Monthly trends calculated correctly
- [ ] Smart insights provide value
- [ ] Date range filtering works

### 5. Code Quality & Documentation (20%)
- [ ] Clean, readable code structure
- [ ] Proper error handling
- [ ] Swagger documentation complete
- [ ] Postman collection included
- [ ] README and deployment instructions

## 📊 Sample Test Flow

```bash
# 1. Login as Analyst
curl -X POST https://finance-backend-api.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@finance.com","password":"Analyst@123456"}'

# Save the accessToken from response

# 2. Create an expense record
curl -X POST https://finance-backend-api.vercel.app/api/v1/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":150.00,"type":"expense","category":"Groceries","date":"2024-04-04"}'

# 3. Get dashboard summary
curl -X GET "https://finance-backend-api.vercel.app/api/v1/dashboard/summary?start_date=2024-04-01&end_date=2024-04-30" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Test RBAC - Try to create record as Viewer (should fail)
# First login as viewer, then try the same POST request