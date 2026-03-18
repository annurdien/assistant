import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  type WAMessage
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { ConsoleLogger } from '@assistant/services';
import { prisma } from '@assistant/database';

const logger = new ConsoleLogger('whatsapp-service');
const fastify = Fastify({ logger: false });
const API_EXECUTE_URL = process.env.API_EXECUTE_URL || 'http://localhost:3000/execute';

export let globalSettings = {
  WA_ALLOWED_NUMBERS: '',
  WA_COMMAND_PREFIX: '/',
  WA_MAINTENANCE_MODE: 'false',
  WA_REPLY_UNKNOWN: 'false'
};

async function fetchWhatsAppSettings() {
  try {
    const keys = ['WA_ALLOWED_NUMBERS', 'WA_COMMAND_PREFIX', 'WA_MAINTENANCE_MODE', 'WA_REPLY_UNKNOWN'];
    const dbSettings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });
    
    // Merge into memory
    dbSettings.forEach((row: any) => {
      (globalSettings as any)[row.key] = row.value;
    });
  } catch (error: any) {
    logger.error(`Failed to refresh WhatsApp settings: ${error.message}`);
  }
}

// Initial fetch & set interval
fetchWhatsAppSettings();
setInterval(fetchWhatsAppSettings, 30000); // 30s sync

let globalSock: ReturnType<typeof makeWASocket> | null = null;

async function sendToApi(text: string, jid: string, media?: any): Promise<string> {
  try {
    const response = await fetch(API_EXECUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, jid, media }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return `❌ Execution Failed: ${data.error || 'Unknown error'}`;
    }

    return data.output || '✅ Command executed successfully (no output).';
  } catch (error: any) {
    logger.error(`API Request failed: ${error.message}`);
    return `⚠️ System Error: Unable to reach the API server.`;
  }
}

function extractMessageText(msg: WAMessage): string | null {
  const message = msg.message;
  if (!message) return null;

  const text =
    message.conversation ||
    message.extendedTextMessage?.text ||
    null;

  return text ? text.trim() : null;
}

async function handleIncomingMessage(sock: ReturnType<typeof makeWASocket>, msg: WAMessage) {
  if (!msg.message) return;

  let senderJid = msg.key.remoteJid;
  if (!senderJid) return;

  // In WhatsApp groups, remoteJid is the group ID, while participant is the actual sender
  const authorJid: string = msg.key.participant || senderJid;
  // Multi-device IDs contain colons (e.g., 628123:15@s.whatsapp.net). We strip to base number.
  const phoneNumber = (authorJid.split('@')[0] || '').split(':')[0] as string;

  const text = extractMessageText(msg);
  if (!text) return;

  const prefix = globalSettings.WA_COMMAND_PREFIX;
  if (!text.startsWith(prefix) && prefix !== '') {
    return;
  }

  // Check Whitelist config
  const allowedNumbers = globalSettings.WA_ALLOWED_NUMBERS.split(',').map(s => s.trim()).filter(Boolean);
  
  const isWhitelisted = allowedNumbers.length === 0 || allowedNumbers.includes(phoneNumber);
  
  // Always permit the authenticated device owner if fromMe is true
  if (!isWhitelisted && !msg.key.fromMe) {
    logger.warn(`Rejected unauthorized access from ${phoneNumber} (Original JID: ${authorJid})`);
    return;
  }

  // Check Maintenance Mode
  if (globalSettings.WA_MAINTENANCE_MODE === 'true') {
    logger.info(`Blocked command from ${phoneNumber} due to MAINTENANCE MODE.`);
    await sendReply(sock, senderJid, '⚠️ The bot is currently undergoing maintenance. Please try again later.', msg);
    return;
  }

  logger.info(`Received command recursively from ${senderJid}: ${text}`);

  try {
    await sock.sendMessage(senderJid, { react: { text: '⏳', key: msg.key } });
  } catch (err) {
    logger.warn(`Failed to send processing reaction: ${err}`);
  }

  let mediaPayload: any = undefined;
  
  if (msg.message?.imageMessage) {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        { },
        { 
          logger: logger as any,
          reuploadRequest: sock.updateMediaMessage
        }
      );
      
      const mimetype = msg.message.imageMessage.mimetype || 'image/jpeg';
      const base64Data = (buffer as Buffer).toString('base64');
      mediaPayload = [{ mimetype, data: base64Data }];
      logger.info(`Successfully parsed attached image buffer (${mimetype})`);
    } catch (err: any) {
      logger.error(`Failed to securely download media buffer: ${err.message}`);
    }
  }

  const responseText = await sendToApi(text as string, senderJid as string, mediaPayload);
  
  if (responseText.includes('CommandNotFoundError') || responseText.includes('Invalid command format')) {
    if (globalSettings.WA_REPLY_UNKNOWN === 'true') {
      await sendReply(sock, senderJid, '❓ Unknown command or invalid format. Please check your spelling.', msg);
    }
  } else {
    await sendReply(sock, senderJid, responseText, msg);
  }

  try {
    await sock.sendMessage(senderJid, { react: { text: '✅', key: msg.key } });
  } catch (err) {
    logger.warn(`Failed to send completion reaction: ${err}`);
  }
}

async function sendReply(
  sock: ReturnType<typeof makeWASocket>,
  jid: string,
  text: string,
  quotedMessage?: WAMessage
) {
  try {
    const options = quotedMessage ? { quoted: quotedMessage } : {};
    
    const CHUNK_SIZE = 4000;
    
    if (text.length <= CHUNK_SIZE) {
      await sock.sendMessage(jid, { text }, options);
      logger.info(`Replied to ${jid} successfully.`);
      return;
    }

    let remaining = text;
    let chunkCount = 1;
    
    while (remaining.length > 0) {
      let breakPoint = remaining.length;
      
      if (remaining.length > CHUNK_SIZE) {
        breakPoint = remaining.lastIndexOf('\n', CHUNK_SIZE);
        if (breakPoint === -1) {
          breakPoint = remaining.lastIndexOf(' ', CHUNK_SIZE);
        }
        if (breakPoint === -1) {
           breakPoint = CHUNK_SIZE;
        }
      }
      
      const chunk = remaining.substring(0, breakPoint).trim();
      remaining = remaining.substring(breakPoint).trim();
      
      const suffix = remaining.length > 0 ? '\n\n*(continued...)*' : '';
      await sock.sendMessage(jid, { text: `${chunk}${suffix}` }, chunkCount === 1 ? options : {});
      logger.info(`Sent chunk ${chunkCount} to ${jid}`);
      
      if (remaining.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      chunkCount++;
    }
  } catch (error: any) {
    logger.error(`Failed to send reply to ${jid}: ${error.message}`);
  }
}

async function initWhatsApp() {
  logger.info('Initializing WhatsApp Service...');

  const { state, saveCreds } = await useMultiFileAuthState('./wa-auth-session');
  
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    syncFullHistory: false,
  });

  globalSock = sock;

  sock.ev.on('connection.update', (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('Scan the QR code below to authenticate WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      logger.error(`Connection closed due to ${(lastDisconnect?.error as any)?.message || 'Unknown'}, reconnecting ${shouldReconnect}`);
      
      if (shouldReconnect) {
        initWhatsApp();
      } else {
        logger.info('You are logged out. Delete the ./wa-auth-session directory and restart to scan again.');
      }
    } else if (connection === 'open') {
      logger.info('🚀 WhatsApp connection established and authenticated successfully!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m: any) => {
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      await handleIncomingMessage(sock, msg);
    }
  });
}

// Setup Webhook Server for dynamic replies
fastify.post('/reply', async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as { jid: string; text: string };
  if (!body || !body.jid || !body.text) {
    return reply.status(400).send({ error: 'Missing jid or text' });
  }

  if (!globalSock) {
    return reply.status(500).send({ error: 'WhatsApp socket not initialized' });
  }

  try {
    await sendReply(globalSock, body.jid, body.text);
    return reply.send({ success: true });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
});

fastify.listen({ port: 3001, host: '0.0.0.0' }).then(() => {
  logger.info('Webhook server listening on port 3001');
}).catch(err => {
  logger.error(`Failed to start webhook server: ${err.message}`);
});

initWhatsApp().catch((err) => {
  logger.error(`Fatal error in WhatsApp Service: ${err.message}`);
  process.exit(1);
});
