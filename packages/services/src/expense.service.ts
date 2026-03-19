import { PrismaClient, prisma as defaultPrisma } from '@assistant/database';

const VALID_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

export class ExpenseService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Adds a new expense record to the database.
   */
  async add(amount: number, note: string, category = 'Other', userJid?: string) {
    const resolvedCategory = VALID_CATEGORIES.includes(category) ? category : 'Other';
    return this.prisma.expense.create({
      data: {
        amount,
        note,
        category: resolvedCategory,
        userJid: userJid ?? null,
      },
    });
  }

  /**
   * Lists all expense records for a given month/year, ordered by date descending.
   */
  async list(month?: number, year?: number, userJid?: string) {
    const now = new Date();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const where: any = { createdAt: { gte: startDate, lte: endDate } };
    if (userJid) where.userJid = userJid;

    return this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Calculates the total sum of all expenses.
   */
  async summarize(userJid?: string): Promise<number> {
    const where = userJid ? { userJid } : {};
    const result = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });
    return result._sum?.amount ?? 0;
  }

  /**
   * Returns a formatted IDR string — e.g., Rp 1.500.000
   */
  static formatIDR(amount: number): string {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  }

  static get categories() {
    return VALID_CATEGORIES;
  }
}
