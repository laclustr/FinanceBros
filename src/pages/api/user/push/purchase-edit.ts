// import { PrismaClient } from '@prisma/client';
// import { verifyToken } from '../../verify-token.ts';

// const prisma = new PrismaClient();

// export async function POST({ request, cookies }) {
//   const prisma = new PrismaClient();
//   try {
//     const token = cookies.get('token')?.value;
//     const user = await verifyToken(token);

//     if (!user) {
//       return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), {
//         status: 401,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const body = await request.json();
//     const { title, accountName, amount, }

//     if (!title || !accountName || !amountStr) {
//       return new Response(JSON.stringify({ error: 'Missing required fields' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const cleanAmount = amountStr.replace(/,/g, '');
//     const amount = Math.round(parseFloat(cleanAmount) * 100) / 100;

//     if (isNaN(amount) || amount <= 0) {
//       return new Response(JSON.stringify({ error: 'Amount must be a valid positive number' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const bankAccount = await prisma.bankAccount.findFirst({
//       where: {
//         userId: user.id,
//         name: accountName,
//       },
//     });

//     if (!bankAccount) {
//       return new Response(JSON.stringify({ error: 'Bank account not found' }), {
//         status: 404,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     if (bankAccount.balance < amount) {
//       return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     await prisma.$transaction([
//       prisma.Purchase.create({
//         data: {
//           userId: user.id,
//           bankAccountId: bankAccount.id,
//           title: title.trim(),
//           amount,
//         },
//       }),
//       prisma.bankAccount.update({
//         where: { id: bankAccount.id },
//         data: {
//           balance: {
//             decrement: amount,
//           },
//         },
//       }),
//     ]);

//     return new Response(JSON.stringify({ success: true, message: 'Purchase added successfully!' }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     console.error('Error creating purchase:', error);
//     return new Response(JSON.stringify({ error: 'Internal server error' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// }