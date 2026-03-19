import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';

const VALID_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

export default async function expenseRoutes(server: FastifyInstance) {
  // Auth hook for all routes
  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // GET /expenses — list with optional month/year/category filters
  server.get('/', async (request, reply) => {
    const { month, year, category, userJid } = request.query as {
      month?: string;
      year?: string;
      category?: string;
      userJid?: string;
    };

    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    };
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (userJid) where.userJid = userJid;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    // Group by category for summary
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return reply.send({
      expenses,
      total: total._sum.amount ?? 0,
      byCategory: byCategory.map((g) => ({
        category: g.category,
        total: g._sum.amount ?? 0,
        count: g._count,
      })),
    });
  });

  // POST /expenses — add a new expense
  server.post('/', async (request, reply) => {
    const { amount, note, category = 'Other', userJid } = request.body as {
      amount: number;
      note?: string;
      category?: string;
      userJid?: string;
    };

    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: 'amount harus lebih dari 0' });
    }

    const resolvedCategory = VALID_CATEGORIES.includes(category) ? category : 'Other';

    const expense = await prisma.expense.create({
      data: {
        amount,
        note: note ?? null,
        category: resolvedCategory,
        userJid: userJid ?? null,
      },
    });

    return reply.status(201).send(expense);
  });

  // DELETE /expenses/:id
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.expense.delete({ where: { id } });
      return reply.send({ success: true });
    } catch {
      return reply.status(404).send({ error: 'Expense tidak ditemukan' });
    }
  });

  // GET /expenses/categories
  server.get('/categories', async (_request, reply) => {
    return reply.send(VALID_CATEGORIES);
  });
}
