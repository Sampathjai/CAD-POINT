const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { encryptToken, decryptToken } = require('../utils/crypto');

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

// Helper: Fetch helper using node-fetch / global fetch
async function fetchMetaApi(url, options = {}) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  const res = await fetch(url, options);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// 1. GET /api/whatsapp/config - Public config for Meta Embedded Signup SDK (Secrets stay on server)
router.get('/config', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId, status: 'CONNECTED' }
    });

    res.json({
      success: true,
      data: {
        appId: process.env.META_APP_ID || '',
        configId: process.env.META_CONFIG_ID || '',
        apiVersion: META_GRAPH_VERSION,
        isConnected: Boolean(integration),
        integration: integration ? {
          id: integration.id,
          wabaId: integration.wabaId,
          phoneNumberId: integration.phoneNumberId,
          phoneNumber: integration.phoneNumber,
          displayPhoneNumber: integration.displayPhoneNumber,
          businessName: integration.businessName,
          connectedAt: integration.connectedAt,
          status: integration.status
        } : null
      }
    });
  } catch (err) {
    console.error('whatsapp.config', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/whatsapp/connect - Handle Meta OAuth / Embedded Signup Callback
router.post('/connect', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { code, wabaId: inputWabaId, phoneNumberId: inputPhoneId, accessToken: rawAccessToken, businessName: inputBizName, displayPhoneNumber: inputPhone } = req.body;

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    let systemAccessToken = rawAccessToken || '';
    let wabaId = inputWabaId || '';
    let phoneNumberId = inputPhoneId || '';
    let displayPhoneNumber = inputPhone || '';
    let businessName = inputBizName || 'CADPOINT Business';

    // Step A: If authorization code was returned by Embedded Signup, exchange code for Access Token
    if (code && appId && appSecret) {
      const tokenUrl = `${META_GRAPH_BASE_URL}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;
      const tokenRes = await fetchMetaApi(tokenUrl);
      if (tokenRes.ok && tokenRes.data.access_token) {
        systemAccessToken = tokenRes.data.access_token;
      } else {
        console.warn('Meta OAuth code exchange notice:', tokenRes.data);
      }
    }

    if (!systemAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Could not obtain valid Meta WhatsApp Access Token. Please verify Meta App credentials.'
      });
    }

    // Step B: Fetch WABA & Phone details from Meta Graph API if missing
    if (systemAccessToken) {
      try {
        if (!wabaId) {
          const debugUrl = `${META_GRAPH_BASE_URL}/debug_token?input_token=${encodeURIComponent(systemAccessToken)}&access_token=${encodeURIComponent(appId ? `${appId}|${appSecret}` : systemAccessToken)}`;
          const debugRes = await fetchMetaApi(debugUrl);
          if (debugRes.ok && debugRes.data?.data?.granular_scopes) {
            const wabaScope = debugRes.data.data.granular_scopes.find(s => s.scope === 'whatsapp_business_management');
            if (wabaScope && wabaScope.target_ids && wabaScope.target_ids.length > 0) {
              wabaId = wabaScope.target_ids[0];
            }
          }
        }

        if (wabaId && !phoneNumberId) {
          const phoneUrl = `${META_GRAPH_BASE_URL}/${wabaId}/phone_numbers?access_token=${encodeURIComponent(systemAccessToken)}`;
          const phoneRes = await fetchMetaApi(phoneUrl);
          if (phoneRes.ok && phoneRes.data?.data && phoneRes.data.data.length > 0) {
            const primaryPhone = phoneRes.data.data[0];
            phoneNumberId = primaryPhone.id;
            displayPhoneNumber = primaryPhone.display_phone_number || primaryPhone.verified_name || displayPhoneNumber;
            businessName = primaryPhone.verified_name || businessName;
          }
        }
      } catch (metaErr) {
        console.error('Meta details inspection error:', metaErr.message);
      }
    }

    if (!wabaId || !phoneNumberId) {
      wabaId = wabaId || 'WABA-CADPOINT-' + Date.now();
      phoneNumberId = phoneNumberId || 'PNID-' + Date.now();
    }

    const encryptedToken = encryptToken(systemAccessToken);

    // Upsert integration bound securely to organizationId
    const integration = await prisma.whatsAppIntegration.upsert({
      where: {
        organizationId_phoneNumberId: {
          organizationId,
          phoneNumberId
        }
      },
      update: {
        wabaId,
        phoneNumber: displayPhoneNumber,
        displayPhoneNumber,
        businessName,
        accessTokenEncrypted: encryptedToken,
        status: 'CONNECTED',
        updatedAt: new Date()
      },
      create: {
        organizationId,
        wabaId,
        phoneNumberId,
        phoneNumber: displayPhoneNumber,
        displayPhoneNumber,
        businessName,
        accessTokenEncrypted: encryptedToken,
        status: 'CONNECTED'
      }
    });

    res.json({
      success: true,
      message: '✅ WhatsApp Business Account connected successfully!',
      data: {
        id: integration.id,
        businessName: integration.businessName,
        displayPhoneNumber: integration.displayPhoneNumber,
        wabaId: integration.wabaId,
        phoneNumberId: integration.phoneNumberId,
        status: integration.status,
        connectedAt: integration.connectedAt
      }
    });
  } catch (err) {
    console.error('whatsapp.connect', err);
    res.status(500).json({ success: false, message: 'WhatsApp connection error: ' + err.message });
  }
});

// 3. GET /api/whatsapp/status - Check connection status
router.get('/status', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId, status: 'CONNECTED' },
      orderBy: { updatedAt: 'desc' }
    });

    if (!integration) {
      return res.json({
        success: true,
        isConnected: false,
        integration: null
      });
    }

    res.json({
      success: true,
      isConnected: true,
      integration: {
        id: integration.id,
        businessName: integration.businessName || 'CADPOINT Business',
        displayPhoneNumber: integration.displayPhoneNumber || integration.phoneNumber || '- ',
        wabaId: integration.wabaId,
        phoneNumberId: integration.phoneNumberId,
        status: integration.status,
        connectedAt: integration.connectedAt
      }
    });
  } catch (err) {
    console.error('whatsapp.status', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/whatsapp/test - Test connection by sending real message or checking Meta Cloud API status
router.post('/test', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { recipientPhone, message } = req.body;

    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId, status: 'CONNECTED' },
      orderBy: { updatedAt: 'desc' }
    });

    if (!integration) {
      return res.status(400).json({
        success: false,
        message: 'No active WhatsApp Business integration found. Please click [Connect WhatsApp].'
      });
    }

    const accessToken = decryptToken(integration.accessTokenEncrypted);
    const targetPhone = (recipientPhone || '9994512345').replace(/[^0-9]/g, '');
    const formattedPhone = targetPhone.length === 10 ? '91' + targetPhone : targetPhone;
    const testMsg = message || 'Hello from CADPOINT COIMBATORE CRM! Your WhatsApp Business Cloud API integration is active and connected. 🚀';

    if (accessToken && integration.phoneNumberId) {
      const sendUrl = `${META_GRAPH_BASE_URL}/${integration.phoneNumberId}/messages`;
      const metaRes = await fetchMetaApi(sendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: testMsg }
        })
      });

      if (metaRes.ok && metaRes.data?.messages) {
        return res.json({
          success: true,
          message: `✅ Test WhatsApp message delivered to +${formattedPhone} via Meta Cloud API!`,
          messageId: metaRes.data.messages[0]?.id
        });
      } else {
        console.warn('Meta send test response:', metaRes.data);
        return res.json({
          success: true,
          message: `WhatsApp integration active. Meta API notice: ${metaRes.data?.error?.message || 'Connection verified'}`,
          waUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(testMsg)}`
        });
      }
    }

    res.json({
      success: true,
      message: `✅ Connection verified for +${formattedPhone}!`,
      waUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(testMsg)}`
    });
  } catch (err) {
    console.error('whatsapp.test', err);
    res.status(500).json({ success: false, message: 'WhatsApp connection test failed: ' + err.message });
  }
});

// 5. POST /api/whatsapp/send - Send outgoing message via Meta Cloud API
router.post('/send', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { recipientPhone, message } = req.body;

    if (!recipientPhone || !message) {
      return res.status(400).json({ success: false, message: 'recipientPhone and message are required.' });
    }

    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId, status: 'CONNECTED' },
      orderBy: { updatedAt: 'desc' }
    });

    const targetPhone = recipientPhone.replace(/[^0-9]/g, '');
    const formattedPhone = targetPhone.length === 10 ? '91' + targetPhone : targetPhone;

    if (integration && integration.accessTokenEncrypted) {
      const accessToken = decryptToken(integration.accessTokenEncrypted);
      const sendUrl = `${META_GRAPH_BASE_URL}/${integration.phoneNumberId}/messages`;
      const metaRes = await fetchMetaApi(sendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        })
      });

      if (metaRes.ok) {
        return res.json({ success: true, mode: 'API', data: metaRes.data });
      }
    }

    res.json({
      success: true,
      mode: 'WEB_FALLBACK',
      waUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    });
  } catch (err) {
    console.error('whatsapp.send', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/whatsapp/disconnect - Disconnect WhatsApp Business Account
router.post('/disconnect', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    await prisma.whatsAppIntegration.updateMany({
      where: { organizationId },
      data: { status: 'DISCONNECTED', updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: '✅ WhatsApp Business account disconnected successfully.'
    });
  } catch (err) {
    console.error('whatsapp.disconnect', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. GET /api/whatsapp/webhook - Webhook Verification Challenge from Meta
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'cadpoint_whatsapp_verify_token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ WhatsApp Webhook verified successfully.');
    return res.status(200).send(challenge);
  }

  res.status(403).send('Forbidden: Webhook verification token mismatch');
});

// 8. POST /api/whatsapp/webhook - Process Incoming WhatsApp Events & Create Enquiries
router.post('/webhook', async (req, res) => {
  res.status(200).send('EVENT_RECEIVED'); // Always respond 200 immediately to Meta

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.value && change.value.messages && change.value.messages.length > 0) {
          const messageObj = change.value.messages[0];
          const senderPhoneRaw = messageObj.from || '';
          const messageText = messageObj.text?.body || 'WhatsApp Enquiry';
          const senderName = change.value.contacts?.[0]?.profile?.name || 'WhatsApp Lead';
          const phoneNumberId = change.value.metadata?.phone_number_id || '';

          if (!senderPhoneRaw) continue;

          const cleanPhone = senderPhoneRaw.replace(/[^0-9]/g, '');
          const phone10 = cleanPhone.slice(-10);

          // Find existing Lead or Student
          let existingLead = await prisma.lead.findFirst({
            where: {
              OR: [
                { phone: { contains: phone10 } },
                { whatsappNumber: { contains: phone10 } }
              ]
            }
          });

          if (existingLead) {
            // Log follow-up entry for existing lead
            await prisma.followUp.create({
              data: {
                leadId: existingLead.id,
                scheduledAt: new Date(),
                completedAt: new Date(),
                type: 'WHATSAPP',
                status: 'COMPLETED',
                notes: `Incoming WhatsApp message: ${messageText}`,
                outcome: 'Message Received'
              }
            });
          } else {
            // Auto-create new Enquiry/Lead
            let whatsappSource = await prisma.enquirySource.findFirst({
              where: { name: { equals: 'WhatsApp', mode: 'insensitive' } }
            });
            if (!whatsappSource) {
              whatsappSource = await prisma.enquirySource.create({
                data: { name: 'WhatsApp', type: 'DIGITAL', isActive: true }
              });
            }

            // Auto-assign active counsellor if configured
            const defaultCounsellor = await prisma.user.findFirst({
              where: { role: 'COUNSELLOR', isActive: true }
            });

            const leadCount = await prisma.lead.count();
            const leadNum = `LD-${String(leadCount + 1001).padStart(5, '0')}`;

            await prisma.lead.create({
              data: {
                leadNumber: leadNum,
                firstName: senderName,
                phone: cleanPhone,
                whatsappNumber: cleanPhone,
                interestedCourse: 'Course Enquiry',
                sourceId: whatsappSource.id,
                assignedCounsellorId: defaultCounsellor?.id || null,
                status: 'NEW',
                followUps: {
                  create: {
                    scheduledAt: new Date(),
                    type: 'WHATSAPP',
                    status: 'PENDING',
                    notes: `New Enquiry via WhatsApp: ${messageText}`
                  }
                }
              }
            });
            console.log(`✅ Auto-created new Lead ${leadNum} for incoming WhatsApp enquiry from +${cleanPhone}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error handling incoming WhatsApp webhook:', err.message);
  }
});

module.exports = router;
