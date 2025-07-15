import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aviator.com' },
    update: {},
    create: {
      username: 'demo_player',
      email: 'demo@aviator.com',
      password: hashedPassword,
      balance: 5000,
      avatar: '/avatars/av-5.png'
    }
  });

  // Create test user
  const testPassword = await bcrypt.hash('test123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@aviator.com' },
    update: {},
    create: {
      username: 'test_player',
      email: 'test@aviator.com',
      password: testPassword,
      balance: 2000,
      avatar: '/avatars/av-3.png'
    }
  });

  console.log('✅ Demo users created:');
  console.log('📧 demo@aviator.com / demo123');
  console.log('📧 test@aviator.com / test123');
  console.log({ demoUser, testUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });