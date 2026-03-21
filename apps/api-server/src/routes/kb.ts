import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';
import { AIService } from '@assistant/services';

const ai = new AIService();

// MED-2: Only allow safe text-based MIME types for KB upload
const ALLOWED_MIME_TYPES = new Set([
  'text/plain', 'text/markdown', 'text/csv', 'text/html',
  'application/json', 'application/xml', 'text/xml',
]);

const MAX_CONTENT_BYTES = 500_000; // 500 KB of text content max

export default async function kbRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.post('/upload', async (request, reply) => {
    const data = await (request as any).file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    // MED-2: Reject disallowed MIME types
    const mimetype: string = String(data?.mimetype ?? '');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const baseType = (mimetype.split(';')[0]!).trim(); // strip charset parameters
    if (!ALLOWED_MIME_TYPES.has(baseType)) {
      return reply.status(415).send({
        error: `Unsupported file type: ${mimetype}. Only plain text, markdown, CSV, JSON, XML, and HTML are supported.`
      });
    }

    const buffer = await data.toBuffer();

    // MED-2: Reject oversized content
    if (buffer.length > MAX_CONTENT_BYTES) {
      return reply.status(413).send({ error: `File exceeds the ${MAX_CONTENT_BYTES / 1000} KB text content limit.` });
    }

    const content = buffer.toString('utf-8');

    const document = await (prisma as any).document.create({
      data: {
        filename: data.filename,
        content: content.slice(0, 10000)
      }
    });

    const chunks = content.split('\n\n').map((c: string) => c.trim()).filter((c: string) => c.length > 20);

    let processed = 0;
    for (const chunk of chunks) {
      try {
        const textChunk = chunk.slice(0, 1500);
        const vector = await ai.embed(textChunk);

        if (vector && vector.length > 0) {
          // MED-1: Validate float values before passing to SQL
          const safeVector = vector.filter((v: number) => typeof v === 'number' && isFinite(v));
          if (safeVector.length !== vector.length) continue;

          const vectorStr = `[${safeVector.join(',')}]`;

          await prisma.$executeRawUnsafe(`
            INSERT INTO "DocumentEmbedding" ("id", "documentId", "content", "embedding", "createdAt")
            VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW());
          `, document.id, textChunk, vectorStr);
          processed++;
        }
      } catch (err: any) {
        fastify.log.warn(`Embedding computation failed for chunk: ${err.message}`);
      }
    }

    return reply.send({ success: true, documentId: document.id, chunksProcessed: processed });
  });

  fastify.get('/', async (_request, reply) => {
    const docs = await (prisma as any).document.findMany({
      select: { id: true, filename: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(docs);
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await (prisma as any).document.delete({ where: { id } });
      return reply.send({ success: true });
    } catch {
      return reply.status(404).send({ error: 'Document not found' });
    }
  });
}
