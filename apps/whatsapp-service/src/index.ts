import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WAMessage
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';
import { ConsoleLogger } from '@assistant/services';

const logger = new ConsoleLogger('whatsapp-service');
// Fallback in case the user meant the global execution endpoint
const API_EXECUTE_URL = process.env.API_EXECUTE_URL || 'http://localhost:3000/execute';

/**
 * Forwards a parsed command to the API server for execution.
 * 
 * @param text The raw message text starting with '/'
 * @returns The string response to reply with
 */
async function sendToApi(text: string): Promise<string> {
  try {
    const response = await fetch(API_EXECUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
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

/**
 * Extracts normalized text from a Baileys Web Message Info object.
 */
function extractMessageText(msg: WAMessage): string | null {
  const message = msg.message;
  if (!message) return null;

  // Extract text depending on the message type
  const text =
    message.conversation ||
    message.extendedTextMessage?.text ||
    null;

  return text ? text.trim() : null;
}

/**
 * Handles incoming WhatsApp messages.
 */
async function handleIncomingMessage(sock: ReturnType<typeof makeWASocket>, msg: WAMessage) {
  // Ignore empty messages, system messages, or messages from ourselves
  if (!msg.message || msg.key.fromMe) return;

  const senderJid = msg.key.remoteJid;
  if (!senderJid) return;

  const text = extractMessageText(msg);

  // We only care about explicit command triggers
  if (!text || !text.startsWith('/')) {
    return;
  }

  logger.info(`Received command recursively from ${senderJid}: ${text}`);

  // Send the command text precisely to the orchestrator API
  const responseText = await sendToApi(text);

  // Dispatch the API's execution result back to the WhatsApp user
  await sendReply(sock, senderJid, responseText, msg);
}

/**
 * Sends a text reply back to a specific WhatsApp JID.
 */
async function sendReply(
  sock: ReturnType<typeof makeWASocket>,
  jid: string,
  text: string,
  quotedMessage?: WAMessage
) {
  try {
    const options = quotedMessage ? { quoted: quotedMessage } : {};
    await sock.sendMessage(jid, { text }, options);
    logger.info(`Replied to ${jid} successfully.`);
  } catch (error: any) {
    logger.error(`Failed to send reply to ${jid}: ${error.message}`);
  }
}

/**
 * Initializes the WhatsApp Baileys socket connection.
 */
async function initWhatsApp() {
  logger.info('Initializing WhatsApp Service...');

  // Store auth state (session) securely in a local folder
  const { state, saveCreds } = await useMultiFileAuthState('./wa-auth-session');
  
  // Fetch the purest WA web version directly
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  // Initialize Socket Connection using the Pino logger for internal Baileys logging
  // makeWASocket acts as the default export wrapper in this version
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), // Suppress verbose Baileys internal logs
    printQRInTerminal: false, // We'll manage QR generation manually 
    auth: state,
    syncFullHistory: false, // Keep it lightweight
  });

  // Handle Baileys connection state modifications (Login, QR, Reconnects)
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
      
      // Attempt reconnection unless explicitly logged out
      if (shouldReconnect) {
        initWhatsApp();
      } else {
        logger.info('You are logged out. Delete the ./wa-auth-session directory and restart to scan again.');
      }
    } else if (connection === 'open') {
      logger.info('🚀 WhatsApp connection established and authenticated successfully!');
    }
  });

  // Automatically save session creds when they update
  sock.ev.on('creds.update', saveCreds);

  // Delegate incoming message arrays 
  sock.ev.on('messages.upsert', async (m: any) => {
    if (m.type !== 'notify') return; // We only care about new messages
    
    for (const msg of m.messages) {
      await handleIncomingMessage(sock, msg);
    }
  });
}

// Start the service
initWhatsApp().catch((err) => {
  logger.error(`Fatal error in WhatsApp Service: ${err.message}`);
  process.exit(1);
});
