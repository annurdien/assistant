--
-- PostgreSQL database dump
--

\restrict 9MFVmv9VbLGu2XuExTeWDa9xBHcDxKiVl4QRb1BAFT6NppT8PLrHfrAHG5lRpQP

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Admin" (
    id text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Admin" OWNER TO admin;

--
-- Name: Command; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Command" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    script text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Command" OWNER TO admin;

--
-- Name: CronJob; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."CronJob" (
    id text NOT NULL,
    "commandId" text NOT NULL,
    schedule text NOT NULL,
    "targetJid" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CronJob" OWNER TO admin;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    amount double precision NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Expense" OWNER TO admin;

--
-- Name: Log; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Log" (
    id text NOT NULL,
    "commandName" text NOT NULL,
    status text NOT NULL,
    output text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Log" OWNER TO admin;

--
-- Name: Reminder; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Reminder" (
    id text NOT NULL,
    "executeAt" timestamp(3) without time zone NOT NULL,
    "targetJid" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Reminder" OWNER TO admin;

--
-- Name: Secret; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Secret" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Secret" OWNER TO admin;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    jid text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO admin;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Setting" OWNER TO admin;

--
-- Name: UserQuota; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."UserQuota" (
    id text NOT NULL,
    jid text NOT NULL,
    "commandCount" integer DEFAULT 0 NOT NULL,
    "tokensUsed" integer DEFAULT 0 NOT NULL,
    "resetAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserQuota" OWNER TO admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Admin" (id, username, "passwordHash", "createdAt") FROM stdin;
e8a639c6-6e51-415d-8b1f-98e5bdd69fa0	admin	$2b$10$pAKKqzF.ovCTXu32Rt8/9.AVQw4Q.i6gmEqwVO2qATWGXjxSf8bqO	2026-03-18 06:45:15.917
\.


--
-- Data for Name: Command; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Command" (id, name, description, script, enabled, "createdAt") FROM stdin;
72321961-1177-41fe-89d7-fd220df1eb2a	hello	Simple greeting to test system pipeline.	/**\n * @param {SandboxContext} ctx\n */\nexport default async function(ctx) {\n  return "👋 Hello there! The system is fully operational.";\n}	t	2026-03-18 03:44:41.237
bcb28943-1726-4b3b-adf6-803e789c9a7f	ai	Interact with OpenAI inference.	/**\n * @param {SandboxContext} ctx\n */\nexport default async function(ctx) {\n  if (!ctx.input) return "Please provide a prompt. Example: /ai What is the capital of France?";\n  \n  try {\n    const response = await ctx.ai.ask(ctx.input);\n    return "🤖 AI: " + response;\n  } catch (err) {\n    return "⚠️ AI Error: " + err.message;\n  }\n}	t	2026-03-18 03:44:41.243
c2ef4e69-5c35-4fc0-9b1b-b008f9362805	expense	Manage simple expenses in the database.	/**\n * @param {SandboxContext} ctx\n */\nexport default async function(ctx) {\n  const parts = ctx.input.trim().split(' ');\n  const action = parts[0]?.toLowerCase();\n\n  if (action === 'add') {\n    const amount = parseFloat(parts[1]);\n    const note = parts.slice(2).join(' ');\n    \n    if (isNaN(amount) || !note) {\n      return "Format: /expense add <amount> <note>";\n    }\n    \n    await ctx.expense.add(amount, note);\n    return `✅ Added expense: $${amount} for "${note}"`;\n  }\n  \n  if (action === 'list' || action === 'summarize') {\n    const total = await ctx.expense.summarize();\n    return `📊 Total Expenses: $${total}`;\n  }\n\n  return "Commands: /expense add <amount> <note> | /expense summarize";\n}	t	2026-03-18 03:44:41.245
98b430fe-8e46-4c9e-9915-850b212b8903	rek	Rekening	/**\n * @param {SandboxContext} ctx\n */\nexport default async function (ctx) {\n  return `Rekening:\n- BCA: 4561310437\n- CIMB: 708665713600\n\nE-Wallet:\n- OVO, DANA, Shopee Pay, Gopay\n- No: 082313078170`\n}	t	2026-03-18 04:23:09.327
59099b2a-6b33-47b6-97dc-6dfc9aef63d7	remind	Schedules a one-off reminder via AI natural language	export default async function(ctx) {\n  if (!ctx.input || ctx.input.trim().length === 0) {\n    await ctx.reply('❌ Please specify your reminder. Example: /remind tomorrow at 9am to call John');\n    return;\n  }\n  \n  const prompt = `Extract the precise future date and time from the following reminder request. Respond with ONLY the strictly formatted ISO-8601 datetime string, absolutely nothing else. Assume the current origin date/time/timezone is strictly ${new Date().toISOString()}. Request: "${ctx.input}"`;\n  \n  let aiDateStr;\n  try {\n     aiDateStr = await ctx.ai.ask(prompt);\n  } catch (err) {\n     await ctx.reply('❌ Failed to parse the requested time via AI engine. Try a simpler date format.');\n     return;\n  }\n  \n  const parsedDate = new Date(aiDateStr.trim());\n  if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {\n    await ctx.reply('❌ The AI could not determine a valid future date from your request. (Got: ' + aiDateStr + ')');\n    return;\n  }\n  \n  await ctx.remind(parsedDate, ctx.input);\n  await ctx.reply(`✅ Reminder AI mapped precisely to: ${parsedDate.toLocaleString()}`);\n}	t	2026-03-18 09:35:41.583
ac0baced-2e0e-4412-8d53-43bc63230f98	help	Displays all available bot commands and functionality	export default async function(ctx) {\n  const commands = await ctx.db.command.findMany({\n    where: { enabled: true },\n    orderBy: { name: 'asc' }\n  });\n\n  if (commands.length === 0) {\n    await ctx.reply("❌ No commands are currently available.");\n    return;\n  }\n\n  let helpText = "🤖 *Available Commands*\\n\\n";\n  for (const cmd of commands) {\n    const desc = cmd.description ? ` - ${cmd.description}` : '';\n    helpText += `*/${cmd.name}*${desc}\\n`;\n  }\n  \n  helpText += `\\nType /<command> to interact with the assistant!`;\n  \n  await ctx.reply(helpText.trim());\n}	t	2026-03-18 10:19:00.377
\.


--
-- Data for Name: CronJob; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."CronJob" (id, "commandId", schedule, "targetJid", enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Expense" (id, amount, note, "createdAt") FROM stdin;
a0bb2e76-5e64-47d5-b4fc-bfaaa4fbac63	10000	beli buku	2026-03-17 19:53:14.487
d9d0bb6d-42d1-4afe-bf04-199372d4555f	100	beli baju	2026-03-17 20:15:47.427
c3e32e3e-6cc0-4e58-a999-682ad7d04963	15.5	Lunch	2026-03-18 03:45:37.367
5f716738-051c-46ea-85ea-768f04cf4ccd	10000	beli jajan	2026-03-18 04:21:06.668
\.


--
-- Data for Name: Log; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Log" (id, "commandName", status, output, "createdAt") FROM stdin;
\.


--
-- Data for Name: Reminder; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Reminder" (id, "executeAt", "targetJid", text, "createdAt") FROM stdin;
8a4a982a-ed34-4573-a420-e34894e097b3	2026-03-18 10:50:00	6282313078170@s.whatsapp.net	me to cook meal at 17.50	2026-03-18 10:43:41.537
\.


--
-- Data for Name: Secret; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Secret" (id, key, value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Session" (id, jid, data, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Setting" (id, key, value, "createdAt", "updatedAt") FROM stdin;
0d1daf4a-476e-4a9f-af93-874906b71887	AI_API_KEY	AIzaSyC6fuThP-rIrHqp0Hc-Sn6KlzZKaozQA3g	2026-03-18 07:38:35.271	2026-03-18 10:42:56.09
05a0a84c-1726-45e8-8bfe-c1b32efb30a1	AI_MODEL	gemini-3.1-flash-lite-preview	2026-03-18 07:38:35.282	2026-03-18 10:42:56.093
55e89a77-d691-4389-bf01-9ce81cd0b7b8	WA_ALLOWED_NUMBERS	6282313078170	2026-03-18 07:38:35.283	2026-03-18 10:42:56.095
7c5e20f3-9fa9-438a-9a4a-9a218b0b0b13	WA_COMMAND_PREFIX	/	2026-03-18 07:38:35.284	2026-03-18 10:42:56.096
49ad7a5e-1174-421a-ba13-5643fb8d1565	WA_MAINTENANCE_MODE	false	2026-03-18 07:38:35.285	2026-03-18 10:42:56.098
74d77191-c9c5-416e-bdb0-a9f9c62c4a0f	WA_REPLY_UNKNOWN	true	2026-03-18 07:38:35.286	2026-03-18 10:42:56.099
\.


--
-- Data for Name: UserQuota; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."UserQuota" (id, jid, "commandCount", "tokensUsed", "resetAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
448c511b-dcc2-44b0-824e-c0b45eed1878	2dedc6da2a299ae964ebb0f0d555b4693134a9c35f03d1b38fe4f6f3194547ea	2026-03-17 18:36:22.470843+00	20260317183622_init	\N	\N	2026-03-17 18:36:22.452684+00	1
\.


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: Command Command_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Command"
    ADD CONSTRAINT "Command_pkey" PRIMARY KEY (id);


--
-- Name: CronJob CronJob_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."CronJob"
    ADD CONSTRAINT "CronJob_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Log Log_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Log"
    ADD CONSTRAINT "Log_pkey" PRIMARY KEY (id);


--
-- Name: Reminder Reminder_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Reminder"
    ADD CONSTRAINT "Reminder_pkey" PRIMARY KEY (id);


--
-- Name: Secret Secret_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Secret"
    ADD CONSTRAINT "Secret_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: UserQuota UserQuota_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."UserQuota"
    ADD CONSTRAINT "UserQuota_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Admin_username_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Admin_username_key" ON public."Admin" USING btree (username);


--
-- Name: Command_name_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Command_name_key" ON public."Command" USING btree (name);


--
-- Name: Secret_key_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Secret_key_key" ON public."Secret" USING btree (key);


--
-- Name: Session_jid_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Session_jid_key" ON public."Session" USING btree (jid);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: UserQuota_jid_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "UserQuota_jid_key" ON public."UserQuota" USING btree (jid);


--
-- PostgreSQL database dump complete
--

\unrestrict 9MFVmv9VbLGu2XuExTeWDa9xBHcDxKiVl4QRb1BAFT6NppT8PLrHfrAHG5lRpQP

