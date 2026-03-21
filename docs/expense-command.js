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

export default async (ctx) => {
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

  // Get the actual command used (e.g. !exp or /expense)
  const cmdName = ctx.input.split(' ')[0] || '/expense';

  // -- HELP --
  if (!args.length || args[0].toLowerCase() === 'help') {
    await ctx.reply(
      `💰 *Expense Tracker*\n\n` +
      `*Add expense:*\n` +
      `\`${cmdName} <amount>\`\n` +
      `\`${cmdName} <amount> <note>\`\n` +
      `\`${cmdName} <amount> <category> <note>\`\n\n` +
      `*Categories:* ${CATEGORIES.join(', ')}\n\n` +
      `*Summary & List:*\n` +
      `\`${cmdName} summary\`\n` +
      `\`${cmdName} list\` (or \`${cmdName} list 2\`)\n\n` +
      `*Examples:*\n` +
      `\`${cmdName} 50000\`\n` +
      `\`${cmdName} 25000 Food lunch\`\n` +
      `\`${cmdName} 15000 Transport grab\``
    );
    return;
  }

  // -- LIST --
  if (args[0].toLowerCase() === 'list') {
    const page = parseInt(args[1]) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const expenses = await ctx.db.expense.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalCount = await ctx.db.expense.count();

    if (!expenses.length) {
      await ctx.reply(`🗓️ *Expense List*\n\nNo expenses found.`);
      return;
    }

    let msg = '```\n' +
`================================
        EXPENSE RECEIPT         
================================
 Page: ${page} of ${Math.ceil(totalCount / limit)}
--------------------------------
`;

    let pageTotal = 0;
    for (let i = 0; i < expenses.length; i++) {
        const e = expenses[i];
        pageTotal += e.amount;
        
        const dateObj = new Date(e.createdAt);
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        let amountStr = await fmt(e.amount);
        amountStr = amountStr.padStart(15, ' ');
        const catStr = e.category.toUpperCase().padEnd(15, ' ');

        msg += `[${skip + i + 1}] ${dateStr} ${timeStr}\n`;
        msg += `    ${catStr}${amountStr}\n`;
        if (e.note) {
           msg += `    Note: ${e.note}\n`;
        }
        msg += `\n`;
    }

    const totalStr = (await fmt(pageTotal)).padStart(15, ' ');
    msg += `--------------------------------\n`;
    msg += ` TOTAL (PAGE)   ${totalStr}\n`;
    msg += `================================\n`;
    if (skip + expenses.length < totalCount) {
        msg += `Type ${cmdName} list ${page + 1} for more\n`;
    }
    msg += '```';

    await ctx.reply(msg.trim());
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
  let amount = parseFloat(args[0]);
  let category = 'Other';
  let note = null;

  if (isNaN(amount) || amount <= 0) {
    // Fallback to Natural Language Parsing via AI
    await ctx.reply(`⏳ Parsing expense...`);
    const prompt = `
  Extract the expense details from the following text and return ONLY a valid JSON object. Do not wrap it in markdown blocks or add any other text.
  Text: "${raw}"

  The JSON must have the following keys:
  - "amount": a positive number (parse "50k" as 50000, "1.5m" as 1500000, etc.)
  - "category": must be exactly one of: ${CATEGORIES.join(', ')} (guess the best fit, default to "Other" if unsure)
  - "note": a short description of the expense based on the text (string or null)
  `;
    
    try {
      const aiResponse = await ctx.ai.ask(prompt);
      // Strip possible markdown formatting like \`\`\`json ... \`\`\`
      const jsonStr = aiResponse.replace(/^\`\`\`json\s*/i, '').replace(/\s*\`\`\`$/, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      amount = parseFloat(parsed.amount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount parsed");
      
      category = CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
      note = parsed.note || null;
    } catch (err) {
      await ctx.reply(`❌ Could not understand the expense. Please use the exact format:\n\`${cmdName} <number> [category] [note]\`\nExample: \`${cmdName} 50000 Food lunch\``);
      return;
    }
  } else {
    // Traditional precise parsing
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
    note = noteWords.join(' ') || null;
  }

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
};

