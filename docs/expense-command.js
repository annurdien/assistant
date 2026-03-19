/**
 * /expense WhatsApp Command
 *
 * Usage:
 *   /expense 50000               → adds 50000 as Other
 *   /expense 50000 lunch         → adds 50000, note "lunch", category Other
 *   /expense 50000 Food lunch    → adds 50000, category Food, note "lunch"
 *   /expense summary             → shows this month's total & breakdown
 *   /expense help                → shows usage
 *
 * Categories: Food, Transport, Shopping, Entertainment, Health, Other
 */

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

// Helper: format currency using the EXPENSE_CURRENCY setting
async function fmt(n) {
  const currency = (await ctx.db.setting.findUnique({ where: { key: 'EXPENSE_CURRENCY' } }))?.value || 'IDR';
  const locales = {
    IDR: { locale: 'id-ID', symbol: 'Rp', decimals: 0 },
    USD: { locale: 'en-US', symbol: '$', decimals: 2 },
    EUR: { locale: 'de-DE', symbol: '€', decimals: 2 },
    SGD: { locale: 'en-SG', symbol: 'S$', decimals: 2 },
    MYR: { locale: 'ms-MY', symbol: 'RM', decimals: 2 },
    JPY: { locale: 'ja-JP', symbol: '¥', decimals: 0 },
    GBP: { locale: 'en-GB', symbol: '£', decimals: 2 },
  };
  const info = locales[currency] || locales['IDR'];
  return `${info.symbol} ${Math.round(n).toLocaleString(info.locale, { minimumFractionDigits: info.decimals, maximumFractionDigits: info.decimals })}`;
}

// Parse args from ctx.input (everything after "/expense ")
const raw = ctx.input.replace(/^\/\w+\s*/, '').trim();
const args = raw.split(/\s+/).filter(Boolean);

// -- HELP --
if (!args.length || args[0].toLowerCase() === 'help') {
  await ctx.reply(
    `💰 *Expense Tracker*\n\n` +
    `*Add expense:*\n` +
    `\`/expense <amount>\`\n` +
    `\`/expense <amount> <note>\`\n` +
    `\`/expense <amount> <category> <note>\`\n\n` +
    `*Categories:* ${CATEGORIES.join(', ')}\n\n` +
    `*Summary:*\n` +
    `\`/expense summary\`\n\n` +
    `*Examples:*\n` +
    `\`/expense 50000\`\n` +
    `\`/expense 25000 Food lunch\`\n` +
    `\`/expense 15000 Transport grab\``
  );
  return;
}

// -- SUMMARY --
if (args[0].toLowerCase() === 'summary') {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await ctx.db.expense.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    orderBy: { createdAt: 'desc' },
  });

  if (!expenses.length) {
    await ctx.reply(`📊 *Expense Summary*\n\nNo expenses recorded this month.`);
    return;
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  let msg = `📊 *Expense Summary — ${monthName}*\n\n`;
  msg += `*Total:* ${await fmt(total)}\n`;
  msg += `*Transactions:* ${expenses.length}\n\n`;
  msg += `*By Category:*\n`;
  for (const [cat, amt] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    msg += `• ${cat}: ${await fmt(amt)}\n`;
  }

  const recent = expenses.slice(0, 3);
  msg += `\n*Recent:*\n`;
  for (const e of recent) {
    const d = new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    msg += `• ${d} — ${await fmt(e.amount)} (${e.note || e.category})\n`;
  }

  await ctx.reply(msg);
  return;
}

// -- ADD EXPENSE --
const amount = parseFloat(args[0]);
if (isNaN(amount) || amount <= 0) {
  await ctx.reply(`❌ Invalid amount. Use: /expense <number> [category] [note]\nExample: \`/expense 50000 Food lunch\``);
  return;
}

// Detect optional category (second word if it matches a known category, case-insensitive)
let category = 'Other';
let noteWords = [];

if (args.length >= 2) {
  const potentialCat = CATEGORIES.find(c => c.toLowerCase() === args[1].toLowerCase());
  if (potentialCat) {
    category = potentialCat;
    noteWords = args.slice(2);
  } else {
    noteWords = args.slice(1);
  }
}

const note = noteWords.join(' ') || null;

await ctx.expense.add(amount, note || '', category);

const formatted = await fmt(amount);
let reply = `✅ *Expense added!*\n\n`;
reply += `💵 *Amount:* ${formatted}\n`;
reply += `🏷 *Category:* ${category}\n`;
if (note) reply += `📝 *Note:* ${note}\n`;

// Show month total
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
const agg = await ctx.db.expense.aggregate({
  where: { createdAt: { gte: startDate } },
  _sum: { amount: true },
});
const monthTotal = agg._sum?.amount || 0;
reply += `\n📊 *This month's total:* ${await fmt(monthTotal)}`;

await ctx.reply(reply);
