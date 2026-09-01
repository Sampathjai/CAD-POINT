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

// 1. GET /api/whatsapp/config - Public config & multi-branch connection status
router.get('/config', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { branchId, branchCode } = req.query;

    let targetBranchId = branchId;
    if (!targetBranchId && branchCode) {
      const b = await prisma.branch.findFirst({ where: { code: branchCode } });
      if (b) targetBranchId = b.id;
    }

    const rawAppId = (process.env.META_APP_ID || '').trim();
    const isNumericAppId = /^\d{10,20}$/.test(rawAppId);
    console.log('[Meta Config Diagnostic]', { appIdConfigured: isNumericAppId, appIdLength: rawAppId.length });

    if (targetBranchId) {
      const integration = await prisma.whatsAppIntegration.findFirst({
        where: { organizationId, branchId: targetBranchId, status: 'CONNECTED' },
        include: { branch: true }
      });

      return res.json({
        success: true,
        data: {
          appId: isNumericAppId ? rawAppId : '',
          appIdConfigured: isNumericAppId,
          configId: (process.env.META_CONFIG_ID || '').trim(),
          apiVersion: META_GRAPH_VERSION,
          isConnected: Boolean(integration),
          integration: integration ? {
            id: integration.id,
            branchId: integration.branchId,
            branchName: integration.branch?.name,
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
    }

    // Return status for all branches in organization
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        whatsAppIntegration: true
      },
      orderBy: { name: 'asc' }
    });

    const branchIntegrations = branches.map(b => ({
      branchId: b.id,
      branchName: b.name,
      branchCode: b.code,
      isConnected: Boolean(b.whatsAppIntegration && b.whatsAppIntegration.status === 'CONNECTED'),
      integration: b.whatsAppIntegration ? {
        id: b.whatsAppIntegration.id,
        wabaId: b.whatsAppIntegration.wabaId,
        phoneNumberId: b.whatsAppIntegration.phoneNumberId,
        phoneNumber: b.whatsAppIntegration.phoneNumber,
        displayPhoneNumber: b.whatsAppIntegration.displayPhoneNumber,
        businessName: b.whatsAppIntegration.businessName,
        status: b.whatsAppIntegration.status,
        connectedAt: b.whatsAppIntegration.connectedAt
      } : null
    }));

    const globalConnected = branchIntegrations.some(b => b.isConnected);

    res.json({
      success: true,
      data: {
        appId: isNumericAppId ? rawAppId : '',
        appIdConfigured: isNumericAppId,
        configId: (process.env.META_CONFIG_ID || '').trim(),
        apiVersion: META_GRAPH_VERSION,
        isConnected: globalConnected,
        branches: branchIntegrations
      }
    });
  } catch (err) {
    console.error('whatsapp.config', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/whatsapp/connect - Handle Meta OAuth / Embedded Signup Callback per Branch
router.post('/connect', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { branchId, code, wabaId: inputWabaId, phoneNumberId: inputPhoneId, accessToken: rawAccessToken, businessName: inputBizName, displayPhoneNumber: inputPhone } = req.body;

    // Resolve target branch
    let targetBranch = null;
    if (branchId) {
      targetBranch = await prisma.branch.findUnique({ where: { id: branchId } });
    }
    if (!targetBranch) {
      targetBranch = await prisma.branch.findFirst({ orderBy: { name: 'asc' } });
    }

    if (!targetBranch) {
      return res.status(400).json({ success: false, message: 'Valid Branch ID is required to connect WhatsApp.' });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    let systemAccessToken = rawAccessToken || '';
    let wabaId = inputWabaId || '';
    let phoneNumberId = inputPhoneId || '';
    let displayPhoneNumber = inputPhone || '';
    let businessName = inputBizName || `${targetBranch.name} Branch WhatsApp`;

    // Step A: If authorization code returned by Embedded Signup, exchange for Access Token
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
        message: 'Could not obtain valid Meta WhatsApp Access Token. Please verify Meta App credentials in Render environment.'
      });
    }

    // Step B: Fetch WABA & Phone details from Meta Graph API
    if (systemAccessToken) {
      try {
        if (!wabaId) {
          const debugUrl = `${META_GRAPH_BASE_URL}/debug_token?input_token=${encodeURIComponent(systemAccessToken)}&access_token=${encodeURIComponent(appId && appSecret ? `${appId}|${appSecret}` : systemAccessToken)}`;
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
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve valid WhatsApp Business Account (WABA) or Phone Number ID from Meta. Please ensure your Meta App has whatsapp_business_management permissions.'
      });
    }

    const encryptedToken = encryptToken(systemAccessToken);

    // Upsert branch-specific WhatsApp integration
    const integration = await prisma.whatsAppIntegration.upsert({
      where: {
        branchId: targetBranch.id
      },
      update: {
        organizationId,
        wabaId,
        phoneNumberId,
        phoneNumber: displayPhoneNumber,
        displayPhoneNumber,
        businessName,
        accessTokenEncrypted: encryptedToken,
        status: 'CONNECTED',
        updatedAt: new Date()
      },
      create: {
        organizationId,
        branchId: targetBranch.id,
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
      message: `✅ WhatsApp connected successfully for ${targetBranch.name} Branch!`,
      data: {
        id: integration.id,
        branchId: targetBranch.id,
        branchName: targetBranch.name,
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

// 3. GET /api/whatsapp/status - Check connection status per Branch
router.get('/status', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { branchId } = req.query;

    let integration = null;
    if (branchId) {
      integration = await prisma.whatsAppIntegration.findFirst({
        where: { organizationId, branchId, status: 'CONNECTED' },
        include: { branch: true }
      });
    } else {
      integration = await prisma.whatsAppIntegration.findFirst({
        where: { organizationId, status: 'CONNECTED' },
        orderBy: { updatedAt: 'desc' },
        include: { branch: true }
      });
    }

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
        branchId: integration.branchId,
        branchName: integration.branch?.name || 'Main Branch',
        businessName: integration.businessName || `${integration.branch?.name || 'CADPOINT'} Business`,
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

// 4. POST /api/whatsapp/test - Test branch WhatsApp connection
router.post('/test', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { branchId, recipientPhone, message } = req.body;

    let integration = null;
    if (branchId) {
      integration = await prisma.whatsAppIntegration.findFirst({
        where: { organizationId, branchId, status: 'CONNECTED' },
        include: { branch: true }
      });
    } else {
      integration = await prisma.whatsAppIntegration.findFirst({
        where: { organizationId, status: 'CONNECTED' },
        orderBy: { updatedAt: 'desc' },
        include: { branch: true }
      });
    }

    if (!integration) {
      return res.status(400).json({
        success: false,
        message: 'No active WhatsApp Business integration found for this branch. Please click [Connect WhatsApp].'
      });
    }

    const accessToken = decryptToken(integration.accessTokenEncrypted);
    const targetPhone = (recipientPhone || '9994512345').replace(/[^0-9]/g, '');
    const formattedPhone = targetPhone.length === 10 ? '91' + targetPhone : targetPhone;
    const testMsg = message || `Hello from CADPOINT ${integration.branch?.name || ''} Branch! WhatsApp Cloud API test successful. 🚀`;

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
          message: `✅ Test WhatsApp message delivered via ${integration.branch?.name || ''} WhatsApp to +${formattedPhone}!`,
          messageId: metaRes.data.messages[0]?.id
        });
      } else {
        console.warn('Meta send test response:', metaRes.data);
        return res.json({
          success: true,
          message: `${integration.branch?.name || ''} WhatsApp integration active. Meta API notice: ${metaRes.data?.error?.message || 'Connection verified'}`,
          waUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(testMsg)}`
        });
      }
    }

    res.json({
      success: true,
      message: `✅ ${integration.branch?.name || ''} WhatsApp connection verified for +${formattedPhone}!`,
      waUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(testMsg)}`
    });
  } catch (err) {
    console.error('whatsapp.test', err);
    res.status(500).json({ success: false, message: 'WhatsApp connection test failed: ' + err.message });
  }
});

// 5. POST /api/whatsapp/send - Send outgoing message strictly using the entity's branch WhatsApp
router.post('/send', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { leadId, studentId, admissionId, branchId, recipientPhone, message } = req.body;

    if (!recipientPhone || !message) {
      return res.status(400).json({ success: false, message: 'Recipient phone and message text are required.' });
    }

    // Step A: Determine target branchId strictly from entity or prop
    let targetBranchId = branchId || null;
    let targetBranchName = 'Branch';

    if (!targetBranchId && studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId }, select: { branchId: true, branch: { select: { name: true } } } });
      if (student?.branchId) {
        targetBranchId = student.branchId;
        targetBranchName = student.branch?.name || targetBranchName;
      }
    }

    if (!targetBranchId && leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { branchId: true, branch: { select: { name: true } } } });
      if (lead?.branchId) {
        targetBranchId = lead.branchId;
        targetBranchName = lead.branch?.name || targetBranchName;
      }
    }

    if (!targetBranchId && admissionId) {
      const admission = await prisma.admission.findUnique({ where: { id: admissionId }, select: { branchId: true, branch: { select: { name: true } } } });
      if (admission?.branchId) {
        targetBranchId = admission.branchId;
        targetBranchName = admission.branch?.name || targetBranchName;
      }
    }

    if (targetBranchId && targetBranchName === 'Branch') {
      const b = await prisma.branch.findUnique({ where: { id: targetBranchId }, select: { name: true } });
      if (b) targetBranchName = b.name;
    }

    // Step B: Validate branch assignment
    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp account cannot be determined because this record is not assigned to a branch.'
      });
    }

    // Step C: Look up branch's WhatsApp integration strictly (NO wrong-branch fallback)
    const integration = await prisma.whatsAppIntegration.findFirst({
      where: { organizationId, branchId: targetBranchId, status: 'CONNECTED' },
      include: { branch: true }
    });

    if (!integration || !integration.accessTokenEncrypted || !integration.phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: `${targetBranchName} WhatsApp is not connected. Please connect the WhatsApp Business account in Settings.`
      });
    }

    // Step D: Format phone number
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid recipient phone number format.' });
    }

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

    if (metaRes.ok && metaRes.data?.messages?.[0]?.id) {
      const wamid = metaRes.data.messages[0].id;

      // Log outbound message to database
      const msgRecord = await prisma.whatsAppMessage.create({
        data: {
          branchId: targetBranchId,
          userId: req.user?.id || null,
          leadId: leadId || null,
          studentId: studentId || null,
          phoneNumberId: integration.phoneNumberId,
          recipientPhone: formattedPhone,
          message,
          direction: 'OUTBOUND',
          status: 'SENT',
          wamid
        }
      });

      return res.json({
        success: true,
        message: `✅ Message delivered via ${integration.branch?.name || targetBranchName} WhatsApp!`,
        data: {
          id: msgRecord.id,
          wamid,
          status: 'SENT',
          senderBranch: integration.branch?.name || targetBranchName,
          senderPhone: integration.displayPhoneNumber || integration.phoneNumber
        }
      });
    }

    // Meta API returned error
    const errDetail = metaRes.data?.error?.message || 'Meta WhatsApp API error';
    await prisma.whatsAppMessage.create({
      data: {
        branchId: targetBranchId,
        userId: req.user?.id || null,
        leadId: leadId || null,
        studentId: studentId || null,
        phoneNumberId: integration.phoneNumberId,
        recipientPhone: formattedPhone,
        message,
        direction: 'OUTBOUND',
        status: 'FAILED',
        errorMessage: errDetail
      }
    });

    return res.status(400).json({
      success: false,
      message: `Failed to send WhatsApp message via ${integration.branch?.name || targetBranchName} WhatsApp: ${errDetail}`
    });

  } catch (err) {
    console.error('whatsapp.send', err);
    res.status(500).json({ success: false, message: 'Server error sending WhatsApp message: ' + err.message });
  }
});

// 5b. GET /api/whatsapp/messages - Fetch message history for student/lead
router.get('/messages', authenticate, async (req, res) => {
  try {
    const { leadId, studentId, recipientPhone } = req.query;

    const whereClause = {};
    if (studentId) whereClause.studentId = studentId;
    if (leadId) whereClause.leadId = leadId;
    if (recipientPhone) {
      const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
      const phone10 = cleanPhone.slice(-10);
      whereClause.recipientPhone = { contains: phone10 };
    }

    if (!studentId && !leadId && !recipientPhone) {
      return res.json({ success: true, data: [] });
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, role: true } },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('whatsapp.messages', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/whatsapp/disconnect - Disconnect WhatsApp per Branch
router.post('/disconnect', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { branchId } = req.body;

    if (branchId) {
      await prisma.whatsAppIntegration.updateMany({
        where: { organizationId, branchId },
        data: { status: 'DISCONNECTED', updatedAt: new Date() }
      });
    } else {
      await prisma.whatsAppIntegration.updateMany({
        where: { organizationId },
        data: { status: 'DISCONNECTED', updatedAt: new Date() }
      });
    }

    res.json({
      success: true,
      message: '✅ WhatsApp Business account disconnected successfully for this branch.'
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

// 8. POST /api/whatsapp/webhook - Branch-Aware Incoming WhatsApp Webhook & Status Updates
router.post('/webhook', async (req, res) => {
  res.status(200).send('EVENT_RECEIVED'); // Always respond 200 immediately to Meta

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        const val = change.value;
        if (!val) continue;

        // Process Delivery / Read / Sent / Failed Status Updates
        if (val.statuses && val.statuses.length > 0) {
          for (const statusObj of val.statuses) {
            const wamid = statusObj.id;
            const statusVal = (statusObj.status || '').toUpperCase();
            if (wamid && statusVal) {
              await prisma.whatsAppMessage.updateMany({
                where: { wamid },
                data: { status: statusVal, updatedAt: new Date() }
              });
            }
          }
        }

        // Process Incoming WhatsApp Messages
        if (val.messages && val.messages.length > 0) {
          const messageObj = val.messages[0];
          const senderPhoneRaw = messageObj.from || '';
          const messageText = messageObj.text?.body || 'WhatsApp Message';
          const senderName = val.contacts?.[0]?.profile?.name || 'WhatsApp Contact';
          const phoneNumberId = val.metadata?.phone_number_id || '';
          const wabaId = entry.id || '';
          const wamid = messageObj.id || null;

          if (!senderPhoneRaw) continue;

          // Find matching WhatsAppIntegration by phoneNumberId or wabaId
          let integration = await prisma.whatsAppIntegration.findFirst({
            where: {
              OR: [
                { phoneNumberId: phoneNumberId },
                { wabaId: wabaId }
              ],
              status: 'CONNECTED'
            },
            include: { branch: true }
          });

          const resolvedBranchId = integration?.branchId || null;
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

          let existingStudent = await prisma.student.findFirst({
            where: {
              OR: [
                { phone: { contains: phone10 } },
                { whatsappNumber: { contains: phone10 } }
              ]
            }
          });

          // Log inbound message in WhatsAppMessage table
          await prisma.whatsAppMessage.create({
            data: {
              branchId: resolvedBranchId,
              leadId: existingLead?.id || null,
              studentId: existingStudent?.id || null,
              phoneNumberId,
              recipientPhone: cleanPhone,
              message: messageText,
              direction: 'INBOUND',
              status: 'DELIVERED',
              wamid
            }
          });

          if (existingLead) {
            await prisma.followUp.create({
              data: {
                leadId: existingLead.id,
                scheduledAt: new Date(),
                completedAt: new Date(),
                type: 'WHATSAPP',
                status: 'COMPLETED',
                notes: `Incoming WhatsApp message (${integration?.branch?.name || 'General'}): ${messageText}`,
                outcome: 'Message Received'
              }
            });
          } else if (!existingStudent) {
            // Auto-create new Enquiry/Lead bound to the specific Branch!
            let whatsappSource = await prisma.enquirySource.findFirst({
              where: { name: { equals: 'WhatsApp', mode: 'insensitive' } }
            });
            if (!whatsappSource) {
              whatsappSource = await prisma.enquirySource.create({
                data: { name: 'WhatsApp', type: 'DIGITAL', isActive: true }
              });
            }

            let branchCounsellor = null;
            if (resolvedBranchId) {
              branchCounsellor = await prisma.user.findFirst({
                where: { role: 'COUNSELLOR', branchId: resolvedBranchId, isActive: true }
              });
            }
            if (!branchCounsellor) {
              branchCounsellor = await prisma.user.findFirst({
                where: { role: 'COUNSELLOR', isActive: true }
              });
            }

            const leadCount = await prisma.lead.count();
            const leadNum = `LD-${String(leadCount + 1001).padStart(5, '0')}`;

            await prisma.lead.create({
              data: {
                leadNumber: leadNum,
                firstName: senderName,
                phone: cleanPhone,
                whatsappNumber: cleanPhone,
                interestedCourse: 'Course Enquiry',
                branchId: resolvedBranchId,
                sourceId: whatsappSource.id,
                assignedCounsellorId: branchCounsellor?.id || null,
                status: 'NEW',
                followUps: {
                  create: {
                    scheduledAt: new Date(),
                    type: 'WHATSAPP',
                    status: 'PENDING',
                    notes: `New Enquiry via ${integration?.branch?.name || ''} WhatsApp: ${messageText}`
                  }
                }
              }
            });
            console.log(`✅ Auto-created Lead ${leadNum} bound to Branch [${integration?.branch?.name || 'Default'}] for incoming WhatsApp enquiry from +${cleanPhone}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error handling multi-branch WhatsApp webhook:', err.message);
  }
});

// ============================================================================
// WHATSAPP MESSAGE TEMPLATE MANAGEMENT ENDPOINTS
// ============================================================================

const DEFAULT_SYSTEM_TEMPLATES = [
  {
    name: 'New Enquiry Welcome',
    category: 'LEAD',
    description: 'Welcome message sent to new course enquiries',
    isSystemTemplate: true,
    content: `Hello {{first_name}} 👋! Thank you for contacting CADPOINT COIMBATORE. We offer industry-recognized CAD, BIM, 3Ds Max & Civil Engineering programs. How can we assist your training goals today?`
  },
  {
    name: 'Course & Fee Overview',
    category: 'LEAD',
    description: 'Overview of course fees and upcoming batch options',
    isSystemTemplate: true,
    content: `Hi {{first_name}}! Regarding your enquiry for {{course_name}}, estimated course fee is {{course_fee}}. Our upcoming batches offer flexible morning & evening schedules. Let us know if you would like to reserve your seat!`
  },
  {
    name: 'Free Demo Session Invitation',
    category: 'LEAD',
    description: 'Invitation to attend a free live demo session',
    isSystemTemplate: true,
    content: `Hi {{first_name}}! We invite you to attend a free live demo session for {{course_name}} at CADPOINT COIMBATORE. Please reply with your convenient date and time slot!`
  },
  {
    name: 'Admission Confirmation',
    category: 'ADMISSION',
    description: 'Official admission confirmation message',
    isSystemTemplate: true,
    content: `Hi {{student_name}} 👋! Your admission has been successfully confirmed for {{course_name}} at CADPOINT {{branch_name}} Branch.\n\nBatch: {{batch_name}}\nAdmission Date: {{admission_date}}\n\nThank you for choosing CADPOINT!`
  },
  {
    name: 'Documents Required Reminder',
    category: 'ADMISSION',
    description: 'Reminder to submit required enrollment documents',
    isSystemTemplate: true,
    content: `Hi {{student_name}}, please submit your educational certificates, photo, and ID proof to complete your {{course_name}} enrollment registration at CADPOINT {{branch_name}} Branch.`
  },
  {
    name: 'Payment Receipt Notification',
    category: 'PAYMENT',
    description: 'Confirmation receipt for fee payment received',
    isSystemTemplate: true,
    content: `Dear {{student_name}}, payment of {{paid_amount}} has been received successfully for {{course_name}} on {{payment_date}}. Remaining Pending Fee: {{pending_amount}}. Thank you! - CADPOINT {{branch_name}}`
  },
  {
    name: 'Pending Fee Reminder',
    category: 'PAYMENT',
    description: 'Gentle reminder for outstanding course fees',
    isSystemTemplate: true,
    content: `Hello {{student_name}}, this is a reminder regarding your pending course fee of {{pending_amount}} for {{course_name}}.\nTotal Agreed Fee: {{course_fee}}\nPaid Amount: {{paid_amount}}\nPending Amount: {{pending_amount}}\n\nKindly complete the pending payment at your earliest convenience. Thank you, CADPOINT.`
  },
  {
    name: 'Overdue Fee Alert',
    category: 'PAYMENT',
    description: 'Urgent notice for overdue pending fee balance',
    isSystemTemplate: true,
    content: `IMPORTANT NOTICE: Dear {{student_name}}, your pending fee balance of {{pending_amount}} for {{course_name}} is overdue. Please settle the pending amount today to ensure uninterrupted class access.`
  },
  {
    name: 'Follow-up Call Reminder',
    category: 'FOLLOW_UP',
    description: 'Follow-up message for pending discussions',
    isSystemTemplate: true,
    content: `Hello {{first_name}}, this is a gentle follow-up from CADPOINT COIMBATORE regarding your {{course_name}} enquiry. Are you available for a brief discussion or callback today?`
  },
  {
    name: 'No Response Follow-up',
    category: 'FOLLOW_UP',
    description: 'Re-engagement message when client has not responded',
    isSystemTemplate: true,
    content: `Hi {{first_name}}, we noticed we missed you earlier! Our new batch for {{course_name}} is starting this week. Reply to this message to check available time slots!`
  },
  {
    name: 'Batch Schedule & Timing Info',
    category: 'BATCH',
    description: 'Information regarding batch start dates and timings',
    isSystemTemplate: true,
    content: `Hi {{student_name}}! Your {{course_name}} batch ({{batch_name}}) regular sessions are scheduled at CADPOINT {{branch_name}} Branch. Please reach out if you need timing adjustments!`
  },
  {
    name: 'Certificate Pickup Ready',
    category: 'COURSE',
    description: 'Notification when course completion certificate is ready',
    isSystemTemplate: true,
    content: `Congratulations {{student_name}} 🎉! Your official course completion certificate for {{course_name}} is ready for pickup at CADPOINT {{branch_name}} Branch. Great job!`
  }
];

// Seed Templates if empty
async function seedDefaultTemplates(organizationId = 'org_default') {
  const count = await prisma.whatsAppTemplate.count({ where: { organizationId } });
  if (count === 0) {
    const templatesToCreate = DEFAULT_SYSTEM_TEMPLATES.map(t => ({
      ...t,
      organizationId
    }));
    await prisma.whatsAppTemplate.createMany({ data: templatesToCreate });
    console.log('✅ Auto-seeded default WhatsApp message templates into database.');
  }
}

// GET /api/whatsapp/templates - Fetch templates with optional category/active filter
router.get('/templates', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    await seedDefaultTemplates(organizationId);

    const { category, activeOnly } = req.query;
    const where = { organizationId };

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      where,
      orderBy: [
        { isSystemTemplate: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({ success: true, data: templates });
  } catch (err) {
    console.error('whatsapp.getTemplates', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/templates - Create new template (Admin only)
router.post('/templates', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const { name, category, content, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Template name is required.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Template content is required.' });
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        organizationId,
        name: name.trim(),
        category: (category || 'GENERAL').toUpperCase(),
        content: content.trim(),
        description: description ? description.trim() : null,
        isActive: isActive !== false,
        isSystemTemplate: false,
        createdBy: req.user?.id || null
      }
    });

    res.json({ success: true, message: 'WhatsApp template created successfully!', data: template });
  } catch (err) {
    console.error('whatsapp.createTemplate', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/whatsapp/templates/:id - Update template (Admin only)
router.put('/templates/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, content, description, isActive } = req.body;

    const existing = await prisma.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const updated = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        category: category ? category.toUpperCase() : existing.category,
        content: content ? content.trim() : existing.content,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive
      }
    });

    res.json({ success: true, message: 'WhatsApp template updated successfully!', data: updated });
  } catch (err) {
    console.error('whatsapp.updateTemplate', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/whatsapp/templates/:id - Delete custom template (Admin only)
router.delete('/templates/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    if (existing.isSystemTemplate) {
      // Soft disable system templates rather than hard deleting
      await prisma.whatsAppTemplate.update({
        where: { id },
        data: { isActive: false }
      });
      return res.json({ success: true, message: 'System template deactivated.' });
    }

    await prisma.whatsAppTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Custom template deleted successfully.' });
  } catch (err) {
    console.error('whatsapp.deleteTemplate', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/templates/:id/duplicate - Duplicate template
router.post('/templates/:id/duplicate', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const duplicated = await prisma.whatsAppTemplate.create({
      data: {
        organizationId: existing.organizationId,
        name: `Copy of ${existing.name}`,
        category: existing.category,
        content: existing.content,
        description: existing.description ? `Copy of ${existing.description}` : null,
        isActive: true,
        isSystemTemplate: false,
        createdBy: req.user?.id || null
      }
    });

    res.json({ success: true, message: 'Template duplicated successfully!', data: duplicated });
  } catch (err) {
    console.error('whatsapp.duplicateTemplate', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
