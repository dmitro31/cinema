
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const runtime = globalThis as typeof globalThis & {
    process: { env: Record<string, string | undefined>; exitCode?: number };
};
const email = runtime.process.env.ADMIN_EMAIL!.toLowerCase();
async function main() {
    const passwordHash = await argon2.hash(runtime.process.env.ADMIN_PASSWORD!);

    await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            passwordHash, // Оновлювати хеш при кожному запуску сиду
        },
        create: {
            email,
            name: 'Admin',
            passwordHash,
            role: 'ADMIN',
        },
    });
}

main().catch((error) => {
    console.error(error);
    runtime.process.exitCode = 1;
});