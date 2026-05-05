import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/confeitaria_saas";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: datasourceUrl
  }
});
