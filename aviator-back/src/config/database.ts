import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to SQLite database');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('🔍 Database connection test successful');

  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from SQLite database');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
};