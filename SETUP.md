# SISTEMA-UNI - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with your 3 Neon database URLs:

```env
# Base de Datos 1: Autenticación
AUTH_DATABASE_URL="postgresql://neondb_owner:npg_ea6xmbcn1Ejp@ep-spring-lake-a4g07mjk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Base de Datos 2: Ciclo y Carrera
CICLO_CARRERA_DATABASE_URL="postgresql://neondb_owner:npg_HJvGXxR2LA3B@ep-polished-violet-a44iujcm-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Base de Datos 3: Profesores y Especialidad
PROFESORES_DATABASE_URL="postgresql://neondb_owner:npg_z1frsgQBuP9K@ep-noisy-butterfly-a44dy8yf-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Configuration
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion-12345"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000

# Circuit Breaker Configuration
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000
CIRCUIT_BREAKER_RESET_TIMEOUT=60000

# Database Health Check
HEALTH_CHECK_INTERVAL=30000
```

### 3. Generate Prisma Clients

Generate clients for all 3 databases:

```bash
npm run db:generate
```

Or generate individually:

```bash
npm run db:generate:auth
npm run db:generate:ciclo
npm run db:generate:prof
```

### 4. Push Schemas to Databases

Push the schemas to your Neon databases (development):

```bash
npm run db:push
```

Or push individually:

```bash
npm run db:push:auth
npm run db:push:ciclo
npm run db:push:prof
```

### 5. Run the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📊 Database Management

### View Data with Prisma Studio

Open Prisma Studio for each database (each in a separate terminal):

```bash
# Terminal 1 - Auth Database (port 5555)
npm run db:studio:auth

# Terminal 2 - Ciclo-Carrera Database (port 5556)
npm run db:studio:ciclo

# Terminal 3 - Profesores Database (port 5557)
npm run db:studio:prof
```

### Run Migrations (Production)

For production deployments, use migrations instead of push:

```bash
# Create migrations
npm run db:migrate:dev

# Deploy migrations to production
npm run db:migrate:deploy
```

## 🏥 Health Monitoring

Once the application is running, check the health status:

```bash
# Overall health
curl http://localhost:3000/health

# Database health details
curl http://localhost:3000/health/databases

# Circuit breaker status
curl http://localhost:3000/health/circuit-breakers

# Sync queue status
curl http://localhost:3000/health/sync-queue
```

## 🗄️ Database Architecture

### BD1: Authentication (`auth.prisma`)
- **Models**: Usuario, Rol, Permiso
- **Purpose**: User authentication and authorization
- **Independence**: If down, users cannot login but existing sessions work

### BD2: Ciclo-Carrera (`ciclo-carrera.prisma`)
- **Models**: Ciclo, Carrera, Estudiante, Materia, Docente (reference)
- **Purpose**: Academic management (students, courses, careers)
- **Independence**: If down, student management unavailable but professor management works

### BD3: Profesores (`profesores.prisma`)
- **Models**: Docente (master), Especialidad, Materia (reference)
- **Purpose**: Professor and specialty management
- **Independence**: If down, professor management unavailable but student management works

## 🔄 Cross-Database Synchronization

### Docente Entity
- **Master**: BD3 (has especialidad)
- **Reference**: BD2 (has carrera)
- **Sync**: Automatic via `DocenteSyncService`

### Materia Entity
- **Master**: BD2 (has estudiantes, carrera)
- **Reference**: BD3 (has docente)
- **Sync**: Automatic via `MateriaSyncService`

## 🛡️ Resilience Features

### Circuit Breaker
- Opens after 5 consecutive failures
- Prevents cascading failures
- Auto-recovery after 60 seconds

### Graceful Degradation
- Each database can fail independently
- Application continues with reduced functionality
- Clear error messages indicate which service is unavailable

### Operation Queue
- Failed sync operations are queued
- Automatic retry with exponential backoff
- Manual retry available via admin interface

## 🧪 Testing Database Failures

### Test BD1 (Auth) Failure
1. Pause BD1 in Neon console
2. Try to login → Should show "Authentication temporarily unavailable"
3. Existing JWT tokens should still work
4. Resume BD1 → Login should work again

### Test BD2 (Ciclo-Carrera) Failure
1. Pause BD2 in Neon console
2. Student/course endpoints → Should show "Academic management temporarily unavailable"
3. Professor endpoints → Should still work
4. Resume BD2 → Queued operations should execute

### Test BD3 (Profesores) Failure
1. Pause BD3 in Neon console
2. Professor endpoints → Should show "Professor management temporarily unavailable"
3. Student endpoints → Should still work
4. Resume BD3 → Queued operations should execute

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (requires JWT)

### Docentes
- `GET /docentes` - List all professors
- `POST /docentes` - Create professor (syncs BD2 ↔ BD3)
- `GET /docentes/:id` - Get professor by ID
- `PUT /docentes/:id` - Update professor (syncs BD2 ↔ BD3)
- `DELETE /docentes/:id` - Delete professor (syncs BD2 ↔ BD3)

### Materias
- `GET /materias` - List all courses
- `POST /materias` - Create course (syncs BD2 ↔ BD3)
- `GET /materias/:id` - Get course by ID
- `PUT /materias/:id` - Update course (syncs BD2 ↔ BD3)
- `DELETE /materias/:id` - Delete course (syncs BD2 ↔ BD3)
- `POST /materias/:id/estudiantes` - Assign students to course

### Estudiantes
- `GET /estudiantes` - List all students
- `POST /estudiantes` - Create student
- `GET /estudiantes/:id` - Get student by ID
- `PUT /estudiantes/:id` - Update student
- `DELETE /estudiantes/:id` - Delete student

### Health
- `GET /health` - Overall system health
- `GET /health/databases` - Database health details
- `GET /health/circuit-breakers` - Circuit breaker status
- `GET /health/sync-queue` - Sync queue statistics

## 🚨 Troubleshooting

### Prisma Client Not Generated
```bash
# Delete generated clients
rm -rf generated/

# Regenerate
npm run db:generate
```

### Database Connection Errors
- Check `.env` file has correct URLs
- Verify Neon databases are not paused
- Check network connectivity

### Sync Queue Growing
- Check `/health/sync-queue` endpoint
- Verify both BD2 and BD3 are healthy
- Manually retry failed operations if needed

### Circuit Breaker Stuck Open
- Check database is actually healthy
- Reset circuit breaker via health service
- Restart application if needed

## 📦 Production Deployment

### Environment Variables
Set these in your hosting platform (Vercel, Railway, etc.):
- `AUTH_DATABASE_URL`
- `CICLO_CARRERA_DATABASE_URL`
- `PROFESORES_DATABASE_URL`
- `JWT_SECRET` (use a strong random value)
- `NODE_ENV=production`

### Build and Deploy
```bash
# Build
npm run build

# Run migrations
npm run db:migrate:deploy

# Start
npm run start:prod
```

### Monitoring
- Monitor `/health` endpoint
- Set up alerts for database failures
- Track sync queue size
- Monitor circuit breaker state

## 🔐 Security Notes

- Change `JWT_SECRET` in production
- Use strong database passwords
- Enable SSL for database connections (already configured in Neon URLs)
- Implement rate limiting for auth endpoints
- Regular security audits

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Neon Documentation](https://neon.tech/docs)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
