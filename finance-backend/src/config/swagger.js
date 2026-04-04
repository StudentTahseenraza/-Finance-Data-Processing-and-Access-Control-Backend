const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API - Complete Documentation',
      version: '1.0.0',
      description: `
        # 🚀 Finance Dashboard Backend API
        
        ## 📋 Overview
        Complete REST API for finance management with Role-Based Access Control (RBAC)
        
        ## ✨ Features
        - 🔐 **JWT Authentication** - Secure login with access/refresh tokens
        - 👥 **Role-Based Access** - Admin, Analyst, Viewer with different permissions
        - 💰 **Financial Records** - Full CRUD operations for transactions
        - 📊 **Dashboard Analytics** - Real-time summaries and insights
        - 📈 **Advanced Charts** - Monthly, weekly, yearly trends
        - 🔍 **Search & Filter** - Powerful filtering and pagination
        - 📝 **Audit Logs** - Complete action tracking
        
        ## 👨‍💼 Test Accounts for HR Review
        | Role | Email | Password | Permissions |
        |------|-------|----------|-------------|
        | 👑 **Admin** | admin@finance.com | Admin@123456 | Full access, user management |
        | 📊 **Analyst** | analyst@finance.com | Analyst@123456 | Create/Update/Delete records |
        | 👀 **Viewer** | viewer@finance.com | Viewer@123456 | Read-only access |
        
        ## 🎯 How to Test
        1. **Login** - Use POST /auth/login with any test account
        2. **Authorize** - Click "Authorize" button and enter: \`Bearer YOUR_TOKEN\`
        3. **Test Endpoints** - Try different endpoints based on role
        4. **Verify RBAC** - Test what each role can/cannot do
        
        ## 📦 Sample Workflow
        \`\`\`
        // 1. Login as Analyst
        POST /auth/login
        {
          "email": "analyst@finance.com",
          "password": "Analyst@123456"
        }
        
        // 2. Create a record
        POST /records
        {
          "amount": 1500.00,
          "type": "income",
          "category": "Freelance",
          "date": "2024-04-04"
        }
        
        // 3. View dashboard
        GET /dashboard/summary
        
        // 4. Get insights
        GET /dashboard/insights
        \`\`\`
        
        ## 🔗 Resources
        - [Postman Collection](https://www.postman.com/collections/your-collection-id)
        - [GitHub Repository](https://github.com/StudentTahseenraza/-Finance-Data-Processing-and-Access-Control-Backend)
        - [Testing Guide](/guide)
      `,
      contact: {
        name: 'API Support Team',
        email: 'support@finance-dashboard.com',
        url: 'https://github.com/yourusername/finance-backend',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://finance-backend-api.vercel.app/api/v1'
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from login response. Format: Bearer <token>',
        },
      },
      schemas: {
        // Auth Schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { 
              type: 'string', 
              format: 'email', 
              example: 'analyst@finance.com',
              description: 'Test account email'
            },
            password: { 
              type: 'string', 
              format: 'password', 
              example: 'Analyst@123456',
              description: 'Test account password'
            }
          }
        },
        
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'full_name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newuser@example.com' },
            password: { 
              type: 'string', 
              format: 'password', 
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])',
              example: 'Password@123',
              description: 'Must contain uppercase, lowercase, number, and special character'
            },
            full_name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' }
          }
        },
        
        // Financial Record Schema
        FinancialRecord: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { 
              type: 'number', 
              format: 'float', 
              minimum: 0.01, 
              example: 1500.00,
              description: 'Transaction amount in USD'
            },
            type: { 
              type: 'string', 
              enum: ['income', 'expense'], 
              example: 'income',
              description: 'Type of transaction'
            },
            category: { 
              type: 'string', 
              minLength: 2, 
              maxLength: 50, 
              example: 'Salary',
              description: 'Transaction category (e.g., Salary, Food, Rent)'
            },
            date: { 
              type: 'string', 
              format: 'date', 
              example: '2024-04-01',
              description: 'Transaction date (YYYY-MM-DD)'
            },
            description: { 
              type: 'string', 
              maxLength: 200, 
              example: 'Monthly salary payment',
              description: 'Optional description'
            },
            notes: { 
              type: 'string', 
              maxLength: 500, 
              example: 'April salary',
              description: 'Additional notes'
            },
            tags: { 
              type: 'array', 
              items: { type: 'string' }, 
              example: ['work', 'monthly'],
              description: 'Tags for categorization'
            }
          }
        },
        
        // Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: '🔐 Login, Register, and Token Management' },
      { name: 'Financial Records', description: '💰 CRUD operations for financial transactions' },
      { name: 'Dashboard', description: '📊 Dashboard summaries and real-time analytics' },
      { name: 'Analytics', description: '📈 Advanced charts, trends, and insights' },
      { name: 'Users', description: '👥 User management (Admin only)' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);