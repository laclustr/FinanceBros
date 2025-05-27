import { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function normalizeEmail(email: string): string {
    const [localPart, domain] = email.toLowerCase().split('@');
    if (!domain) return email.toLowerCase();

    const cleanedLocal = localPart.split('+')[0].replace(/\./g, '');
    return `${cleanedLocal}@${domain}`;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Both email and password are required.',
                    email: !!email,
                    password: !!password,
                }),
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!existingUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'User does not exist.',
                    emailExists: false,
                }),
                { status: 404 }
            );
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.password);
        if (!passwordMatches) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid password.',
                }),
                { status: 401 }
            );
        }

        const token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email,
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Logged in successfully!',
                token,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
    }
};
