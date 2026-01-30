$env:AUTH_DATABASE_URL="postgresql://neondb_owner:npg_ea6xmbcn1Ejp@ep-spring-lake-a4g07mjk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:CICLO_CARRERA_DATABASE_URL="postgresql://neondb_owner:npg_HJvGXxR2LA3B@ep-polished-violet-a44iujcm-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:PROFESORES_DATABASE_URL="postgresql://neondb_owner:npg_z1frsgQBuP9K@ep-noisy-butterfly-a44dy8yf-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "--- Generating Prisma Clients (Direct Schema) ---"
Write-Host "1. Users Client..."
npx prisma generate --schema prisma/schema-users.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Users generate failed"; exit 1 }

Write-Host "2. Academic Client..."
npx prisma generate --schema prisma/schema-academic.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Academic generate failed"; exit 1 }

Write-Host "3. Profiles Client..."
npx prisma generate --schema prisma/schema-profiles.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Profiles generate failed"; exit 1 }

Write-Host "`n--- Pushing to DBs ---"
Write-Host "1. Users DB Push..."
npx prisma db push --schema prisma/schema-users.prisma --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Error "Users db push failed"; exit 1 }

Write-Host "2. Academic DB Push..."
npx prisma db push --schema prisma/schema-academic.prisma --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Error "Academic db push failed"; exit 1 }

Write-Host "3. Profiles DB Push..."
npx prisma db push --schema prisma/schema-profiles.prisma --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Error "Profiles db push failed"; exit 1 }

Write-Host "`n--- Database Setup Completed Successfully ---"
