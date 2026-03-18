import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, DollarSign, Bell, Cloud, BookOpen, 
  MessageSquare, Database, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: 'AI' | 'Finance' | 'Scheduling' | 'Data' | 'Utility';
  icon: React.ElementType;
  color: string;
  script: string;
}

const TEMPLATES: CommandTemplate[] = [
  {
    id: 'ai-chat',
    name: 'ai',
    description: 'Chat with Gemini AI directly via WhatsApp.',
    category: 'AI',
    icon: Bot,
    color: 'text-violet-400',
    script: `export default async function (ctx) {
  const { input, ai, reply } = ctx;

  if (!input) {
    reply("Please type a question after /ai");
    return;
  }

  const answer = await ai.ask(input);
  reply(answer);
}`,
  },
  {
    id: 'kb-search',
    name: 'ask',
    description: 'Answer questions using your Knowledge Base documents.',
    category: 'AI',
    icon: BookOpen,
    color: 'text-blue-400',
    script: `export default async function (ctx) {
  const { input, ai, reply } = ctx;

  if (!input) {
    reply("Please type a question. Example: /ask What is the refund policy?");
    return;
  }

  // Search the Knowledge Base for relevant document chunks
  const results = await ai.search(input, 3);

  if (!results.length) {
    reply("I couldn't find relevant information in the Knowledge Base.");
    return;
  }

  // Build context from the top matching document chunks
  const context = results.map(r => r.content).join("\\n\\n");

  const answer = await ai.ask(
    \`Answer the question using ONLY the facts below. If the facts don't contain the answer, say so.\\n\\nFacts:\\n\${context}\\n\\nQuestion: \${input}\`
  );

  reply(answer);
}`,
  },
  {
    id: 'add-expense',
    name: 'expense',
    description: 'Log expenses and view spending totals.',
    category: 'Finance',
    icon: DollarSign,
    color: 'text-green-400',
    script: `export default async function (ctx) {
  const { input, expense, reply } = ctx;
  
  // Command usage: /expense add 50000 coffee
  //               /expense list
  //               /expense total
  
  const parts = input.trim().split(" ");
  const action = parts[0]?.toLowerCase();

  if (action === "add") {
    const amount = parseFloat(parts[1]);
    const note = parts.slice(2).join(" ") || "No description";

    if (isNaN(amount)) {
      reply("Usage: /expense add <amount> <note>\\nExample: /expense add 50000 Groceries");
      return;
    }

    await expense.add(amount, note);
    reply(\`✅ Logged: \${note} — Rp\${amount.toLocaleString()}\`);

  } else if (action === "list") {
    const all = await expense.list();
    if (!all.length) { reply("No expenses recorded yet."); return; }
    const lines = all.slice(0, 10).map(e => \`• \${e.note}: Rp\${e.amount.toLocaleString()}\`);
    reply("*Recent Expenses:*\\n" + lines.join("\\n"));

  } else if (action === "total") {
    const total = await expense.summarize();
    reply(\`💰 *Total spending:* Rp\${total.toLocaleString()}\`);

  } else {
    reply("Usage:\\n/expense add <amount> <note>\\n/expense list\\n/expense total");
  }
}`,
  },
  {
    id: 'reminder',
    name: 'remind',
    description: 'Schedule a reminder using natural language.',
    category: 'Scheduling',
    icon: Bell,
    color: 'text-orange-400',
    script: `export default async function (ctx) {
  const { input, ai, remind, reply } = ctx;

  // Example: /remind buy milk in 30 minutes
  // Example: /remind meeting tomorrow at 9am

  if (!input) {
    reply("Tell me what to remind you about.\\nExample: /remind dentist appointment next Monday at 10am");
    return;
  }

  // Use Gemini to extract the time and message from natural language
  const parsed = await ai.ask(
    \`Extract the reminder time and message from this text: "\${input}"
    
    Respond with ONLY valid JSON in this exact format (no markdown):
    {"time": "<ISO 8601 datetime or number of minutes>", "message": "<the reminder text>"}
    
    If no specific time is mentioned, assume 30 minutes from now and use "30".
    Use ISO 8601 format for specific dates (e.g. 2026-12-25T09:00:00).\`
  );

  try {
    const { time, message } = JSON.parse(parsed);
    await remind(time, message);
    reply(\`⏰ Reminder set! I'll message you: "\${message}"\`);
  } catch {
    reply("Sorry, I couldn't understand the time. Try: /remind dentist tomorrow at 3pm");
  }
}`,
  },
  {
    id: 'weather',
    name: 'weather',
    description: 'Get weather for a city using an API key from the vault.',
    category: 'Utility',
    icon: Cloud,
    color: 'text-sky-400',
    script: `export default async function (ctx) {
  const { input, env, reply } = ctx;

  const city = input.trim() || "Jakarta";
  
  // Get the API key securely from the vault (add it via Admin > API Keys)
  const apiKey = await env.get("OPENWEATHER_API_KEY");

  if (!apiKey) {
    reply("⚠️ OPENWEATHER_API_KEY not configured. Please add it in Admin > API Keys.");
    return;
  }

  try {
    const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${encodeURIComponent(city)}&appid=\${apiKey}&units=metric\`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200) {
      reply(\`Couldn't find weather for "\${city}". Try a different city name.\`);
      return;
    }

    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const desc = data.weather[0].description;
    const humidity = data.main.humidity;

    reply(
      \`🌤 *Weather in \${data.name}, \${data.sys.country}*\\n\` +
      \`Temperature: \${temp}°C (feels like \${feels}°C)\\n\` +
      \`Conditions: \${desc}\\n\` +
      \`Humidity: \${humidity}%\`
    );
  } catch {
    reply("Failed to fetch weather. Please try again later.");
  }
}`,
  },
  {
    id: 'session-counter',
    name: 'count',
    description: 'Track a per-user counter that persists across messages.',
    category: 'Data',
    icon: Database,
    color: 'text-pink-400',
    script: `export default async function (ctx) {
  const { input, session, reply } = ctx;

  const action = input.trim().toLowerCase();

  // Get current count from persistent session storage
  const current = (await session.get("counter")) || 0;

  if (action === "reset") {
    await session.set("counter", 0);
    reply("🔄 Counter reset to 0.");
    return;
  }

  // Increment the counter by 1
  const newCount = current + 1;
  await session.set("counter", newCount);

  reply(\`You've run this command *\${newCount}* time\${newCount === 1 ? "" : "s"}.\\nSend "/count reset" to start over.\`);
}`,
  },
  {
    id: 'echo',
    name: 'echo',
    description: 'A simple command that echoes back the user\'s message.',
    category: 'Utility',
    icon: MessageSquare,
    color: 'text-teal-400',
    script: `export default async function (ctx) {
  const { input, reply } = ctx;

  if (!input) {
    reply("You didn't say anything! Try: /echo Hello World");
    return;
  }

  reply(\`You said: \${input}\`);
}`,
  },
  {
    id: 'smart-reply',
    name: 'help',
    description: 'List available commands with AI-generated descriptions.',
    category: 'Utility',
    icon: Sparkles,
    color: 'text-yellow-400',
    script: `export default async function (ctx) {
  const { db, ai, reply } = ctx;

  // Fetch all enabled commands from the database
  const commands = await db.command.findMany({
    where: { enabled: true },
    select: { name: true, description: true },
    orderBy: { name: 'asc' },
  });

  if (!commands.length) {
    reply("No commands are currently available.");
    return;
  }

  // Format the list and send it
  const lines = commands.map(c => 
    \`• /\${c.name}\${c.description ? " — " + c.description : ""}\`
  );

  reply("*Available Commands:*\\n" + lines.join("\\n"));
}`,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  AI: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Finance: 'bg-green-500/10 text-green-400 border-green-500/20',
  Scheduling: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Data: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Utility: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

interface CommandTemplateGalleryProps {
  onSelect: (template: CommandTemplate) => void;
}

export default function CommandTemplateGallery({ onSelect }: CommandTemplateGalleryProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Start from a template</h3>
          <p className="text-sm text-muted-foreground">Pick a ready-made example and customize it.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-8 text-xs gap-1">
          {isOpen ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show templates</>}
        </Button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="cursor-pointer group border border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 bg-card hover:bg-card/80"
                onClick={() => onSelect(template)}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Icon size={16} className={template.color} />
                      </div>
                      <CardTitle className="text-sm font-semibold font-mono">/{template.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${CATEGORY_COLORS[template.category]} shrink-0`}>
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <CardDescription className="text-xs leading-relaxed">
                    {template.description}
                  </CardDescription>
                  <div className="mt-3 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to use this template →
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
