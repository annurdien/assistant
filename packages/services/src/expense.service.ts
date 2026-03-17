// @ts-ignore - Importing from apps/api-server directly violates TS rootDir, but requested by user as an option.
import { PrismaClient } from '../../../apps/api-server/src/generated/prisma/client.js';

/**
 * Service for managing expenses in the database.
 */
export class ExpenseService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    // @ts-expect-error - Prisma 7 requires adapter or accelerateUrl which is not configured yet.
    this.prisma = prismaClient || new PrismaClient({});
  }

  /**
   * Adds a new expense record to the database.
   * 
   * @param amount The cost/amount of the expense
   * @param note A description of the expense
   * @returns The created expense record
   */
  async add(amount: number, note: string) {
    return this.prisma.expense.create({
      data: {
        amount,
        note,
      },
    });
  }

  /**
   * Lists all expense records, ordered by creation date descending.
   * 
   * @returns Array of expense records
   */
  async list() {
    return this.prisma.expense.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Calculates the total sum of all expenses in the database.
   * 
   * @returns The total sum as a number
   */
  async summarize(): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }
}
