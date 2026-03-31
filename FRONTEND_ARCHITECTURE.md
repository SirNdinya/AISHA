# AISHA Frontend Architecture

## Multi-Portal Structure

The AISHA frontend is designed with **separation of concerns** in mind. Each user type (Student, Company, Institution, Admin) has access to their own dedicated portal running on a separate port.

### Portal Access Points

| Portal | Port | URL | Test Credentials |
|--------|------|-----|------------------|
| 🎓 **Student Portal** | 5173 | http://localhost:5173 | `student@test.com` / `password123` |
| 🏢 **Company Portal** | 5174 | http://localhost:5174 | `company@test.com` / `password123` |
| 🏛️ **Institution Portal** | 5175 | http://localhost:5175 | `institution@test.com` / `password123` |
| 👤 **Admin Portal** | 5176 | http://localhost:5176 | `admin@test.com` / `password123` |

### Architecture Benefits

1. **Clear Separation of Concerns** - Each subsystem is isolated
2. **Independent Deployment** - Deploy specific portals separately
3. **Better Security** - Role-based access at the infrastructure level
4. **Scalability** - Scale individual portals based on demand
5. **User Experience** - Clear, focused interfaces for each user type

---

## Running the Portals

### Option 1: Launch All Portals (Recommended)

```bash
cd frontend
./launch-portals.sh
```

This will start all 4 portals simultaneously on their respective ports.

### Option 2: Launch via Setup Script

```bash
./setup.sh
```

Select "yes" when prompted to start application services.

### Option 3: Manual Launch (Development)

```bash
# Terminal 1 - Student Portal
cd frontend
VITE_PORTAL=student npm run dev -- --port 5173

# Terminal 2 - Company Portal
cd frontend
VITE_PORTAL=company npm run dev -- --port 5174

# Terminal 3 - Institution Portal
cd frontend
VITE_PORTAL=institution npm run dev -- --port 5175

# Terminal 4 - Admin Portal
cd frontend
VITE_PORTAL=admin npm run dev -- --port 5176
```

---

## Portal Features

### 🎓 Student Portal (Port 5173)

**Features:**
- Dashboard with AI insights and recommendations
- Profile management and CV builder
- Browse and apply for opportunities
- Application tracking
- Payment management (M-Pesa integration)
- Learning resources
- **Mobile view toggle** for responsive preview

**Routes:**
- `/dashboard` - Student dashboard
- `/profile` - Profile management
- `/cv-builder` - CV creation tool
- `/opportunities` - Browse opportunities
- `/applications` - Track applications
- `/payments` - Payment management
- `/learning` - Learning resources

### 🏢 Company Portal (Port 5174)

**Features:**
- Company dashboard with analytics
- Post and manage opportunities
- Review applications with AI ranking
- Applicant management
- Autonomous verification controls

**Routes:**
- `/dashboard` - Company dashboard
- `/opportunities` - Manage opportunities
- `/opportunities/:id/applicants` - Review applicants

### 🏛️ Institution Portal (Port 5175)

**Features:**
- Institution dashboard
- Student oversight
- Partnership management
- Placement tracking

**Routes:**
- `/dashboard` - Institution dashboard
- `/students` - Student management
- `/reports` - Analytics and reports

### 👤 Admin Portal (Port 5176)

**Features:**
- System administration
- User management
- Platform oversight
- System configuration

**Routes:**
- `/dashboard` - Admin dashboard
- `/users` - User management
- `/system` - System settings

---

## Development Guide

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── StudentLayout.tsx
│   │   │   ├── CompanyLayout.tsx
│   │   │   ├── InstitutionLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── auth/
│   │   └── ui/
│   ├── pages/
│   │   ├── student/
│   │   ├── company/
│   │   ├── institution/
│   │   ├── admin/
│   │   ├── auth/
│   │   └── PortalSelector.tsx
│   ├── services/
│   ├── store/
│   ├── types/
│   └── App.tsx
├── launch-portals.sh
└── package.json
```

### Adding New Features

1. **Identify the portal** - Determine which portal needs the feature
2. **Create components** - Add components in appropriate directories
3. **Update routes** - Modify `App.tsx` to add new routes
4. **Test** - Test on the specific portal's port

### Shared Components

Components used across multiple portals should be placed in:
- `src/components/ui/` - UI components
- `src/components/auth/` - Authentication components
- `src/services/` - API services
- `src/store/` - Redux store

---

## Deployment

### Separate Deployment Strategy

Each portal can be deployed independently:

```bash
# Build specific portal
VITE_PORTAL=student npm run build  # Student portal
VITE_PORTAL=company npm run build  # Company portal
# ... etc
```

### Unified Deployment

Deploy all portals together but serve on different subdomains:

- `student.aisha.com` → Student Portal
- `company.aisha.com` → Company Portal
- `institution.aisha.com` → Institution Portal
- `admin.aisha.com` → Admin Portal

### Environment Variables

Each portal can have its own environment configuration:

```env
VITE_API_URL=http://localhost:3000
VITE_PORTAL=student
VITE_PORT=5173
```

---

## Mobile Support

The **Student Portal** includes a mobile view toggle feature:

1. Login to Student Portal
2. Click the "Mobile View" toggle in the header
3. Interface switches to mobile-responsive layout
4. Toggle back to desktop view as needed

For native mobile app, use the React Native mobile application in the `mobile/` directory.

---

## Troubleshooting

### Ports Already in Use

```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9  # Student
lsof -ti:5174 | xargs kill -9  # Company
lsof -ti:5175 | xargs kill -9  # Institution
lsof -ti:5176 | xargs kill -9  # Admin
```

### Portal Not Loading

1. Check if the portal process is running
2. Check logs in `logs/portals/`
3. Verify environment variables are set correctly
4. Ensure backend API is running on port 3000

### Authentication Issues

1. Verify database is running: `docker ps`
2. Check if seed data is loaded
3. Verify test credentials match those in database
4. Check browser console for errors

---

## API Integration

All portals connect to the same backend API:

- **API URL**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`
- **AI Services**: `http://localhost:8000`

Authentication is role-based. Each portal enforces that only users with the appropriate role can access it.

---

## Testing

```bash
# Run all tests
npm test

# Run tests for specific components
npm test -- StudentDashboard
npm test -- CompanyDashboard
```

---

## Support

For issues or questions:
1. Check the logs in `logs/portals/`
2. Verify all services are running
3. Review the implementation plan in `brain/implementation_plan.md`
4. Check the technical documentation in `documentation/`
