import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// MANDATORY: ProxySQL HA Cluster (with fallback to environment variables)
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "192.168.187.50",
  user: process.env.DB_USER || "nb_app",
  password: process.env.DB_PASSWORD || "NB_App_Pass_2026!",
  database: process.env.DB_NAME || "neural_bridge",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectTimeout: 20000,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
