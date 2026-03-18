import { FastifyInstance } from 'fastify';
import { prisma } from '@assistant/database';
import { AIService } from '@assistant/services';

const ai = new AIService();

export default async function kbRoutes(fastify: FastifyInstance) {
  // Check auth for KB routes
  fastify.addHook('preHandler', async (request, reply) => {
    // Basic JWT verification using our auth plugin
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.post('/upload', async (request, reply) => {
    const data = await (request as any).file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    const buffer = await data.toBuffer();
    const content = buffer.toString('utf-8');

    // Create Document record
    const document = await (prisma as any).document.create({
      data: {
        filename: data.filename,
        content: content.slice(0, 10000) // snippet save
      }
    });

    // Paragraph chunking architecture
    const chunks = content.split('\n\n').map((c: string) => c.trim()).filter((c: string) => c.length > 20);
    
    let processed = 0;
    for (const chunk of chunks) {
      try {
        const textChunk = chunk.slice(0, 1500); // hard cutoff
        const vector = await ai.embed(textChunk);
        
        if (vector && vector.length > 0) {
          const vectorStr = `[${vector.join(',')}]`;
          
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
    await (prisma as any).document.delete({ where: { id }});
    return reply.send({ success: true });
  });
}
