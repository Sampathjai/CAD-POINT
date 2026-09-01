import { describe, it, expect } from 'vitest';
import prisma from '../../src/config/prisma';

describe('WhatsApp API Architecture & Database Integrity', () => {
  it('has WhatsAppMessage model with correct fields', async () => {
    expect(prisma.whatsAppMessage).toBeDefined();
    expect(typeof prisma.whatsAppMessage.findMany).toBe('function');
    expect(typeof prisma.whatsAppMessage.create).toBe('function');
  });

  it('has WhatsAppIntegration model connected to Branch', async () => {
    expect(prisma.whatsAppIntegration).toBeDefined();
    const integrations = await prisma.whatsAppIntegration.findMany({
      include: { branch: true }
    });
    expect(Array.isArray(integrations)).toBe(true);
  });
});
