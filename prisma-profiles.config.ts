import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema-profiles.prisma',
    datasource: {
        url: env('PROFESORES_DATABASE_URL')
    },
})
