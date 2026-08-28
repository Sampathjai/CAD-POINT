const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class StorageService {
  constructor() {
    this.provider = this._detectProvider();
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.S3_BUCKET || 'cadpoint-crm-production';
    this.supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  }

  _detectProvider() {
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
      return 'SUPABASE_STORAGE';
    }
    if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) {
      return 'S3_STORAGE';
    }
    return process.env.NODE_ENV === 'production' ? 'CLOUD_PENDING' : 'LOCAL_DEV';
  }

  async uploadFile({ buffer, filename, mimeType = 'application/octet-stream', category = 'documents', organizationId = 'org_default', userId = null, recordId = null }) {
    const cleanName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const timestamp = Date.now();
    const storageKey = `organizations/${organizationId}/${category}/${timestamp}_${cleanName}`;

    let publicUrl = null;
    let providerUsed = this.provider;

    if (this.provider === 'SUPABASE_STORAGE') {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`;
        
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: buffer
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('Supabase upload error:', errText);
          throw new Error('Cloud storage upload failed: ' + errText);
        }

        publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${storageKey}`;
      } catch (err) {
        console.error('Cloud upload exception:', err);
        throw err;
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Local dev fallback
      const localDir = path.join(process.cwd(), 'storage', 'organizations', organizationId, category);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localFilePath = path.join(localDir, `${timestamp}_${cleanName}`);
      fs.writeFileSync(localFilePath, buffer);
      publicUrl = `/api/files/local/${storageKey}`;
      providerUsed = 'LOCAL_DEV';
    } else {
      throw new Error('Cloud storage provider credentials (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY or S3_BUCKET) must be configured in production environment.');
    }

    // Record metadata in database
    const metadata = await prisma.fileMetadata.create({
      data: {
        organizationId,
        uploadedById: userId,
        originalFilename: filename,
        storageKey,
        storageProvider: providerUsed,
        mimeType,
        fileSize: buffer.length,
        category,
        recordId,
        publicUrl
      }
    });

    return metadata;
  }

  async getSignedUrl(storageKey, expiresInSeconds = 3600) {
    if (this.provider === 'SUPABASE_STORAGE') {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const signUrl = `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${storageKey}`;
        
        const res = await fetch(signUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expiresIn: expiresInSeconds })
        });

        const j = await res.json();
        if (res.ok && j.signedURL) {
          return `${this.supabaseUrl}/storage/v1${j.signedURL}`;
        }
      } catch (e) {
        console.error('Error generating signed URL:', e);
      }
    }
    
    // Fallback public URL
    const file = await prisma.fileMetadata.findUnique({ where: { storageKey } });
    return file?.publicUrl || `/api/files/download/${storageKey}`;
  }

  async deleteFile(storageKey) {
    if (this.provider === 'SUPABASE_STORAGE') {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const deleteUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}`;
        
        await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prefixes: [storageKey] })
        });
      } catch (e) {
        console.error('Cloud delete error:', e);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      const localFilePath = path.join(process.cwd(), 'storage', storageKey);
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
    }

    await prisma.fileMetadata.deleteMany({ where: { storageKey } });
    return { success: true };
  }

  async getStorageUsage(organizationId = 'org_default') {
    const aggregate = await prisma.fileMetadata.aggregate({
      where: { organizationId },
      _sum: { fileSize: true },
      _count: { id: true }
    });

    const totalSizeBytes = aggregate._sum.fileSize || 0;
    const totalFiles = aggregate._count.id || 0;
    const sizeInMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    const sizeInGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(3);

    return {
      organizationId,
      totalFiles,
      totalSizeBytes,
      sizeInMB,
      sizeInGB,
      provider: this.provider,
      bucket: this.bucket
    };
  }

  async testStorageConnection() {
    if (this.provider === 'SUPABASE_STORAGE') {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const res = await fetch(`${this.supabaseUrl}/storage/v1/bucket/${this.bucket}`, {
          headers: { 'Authorization': `Bearer ${this.supabaseKey}` }
        });
        if (res.ok) {
          return { status: 'Connected', provider: 'Supabase Storage', bucket: this.bucket, details: 'Connected to Cloud Bucket' };
        } else {
          const errText = await res.text();
          return { status: 'Disconnected', provider: 'Supabase Storage', bucket: this.bucket, details: 'Bucket check failed: ' + errText };
        }
      } catch (e) {
        return { status: 'Disconnected', provider: 'Supabase Storage', bucket: this.bucket, details: e.message };
      }
    }
    
    if (process.env.NODE_ENV === 'production') {
      return { status: 'Pending Config', provider: 'Cloud Object Storage', bucket: this.bucket, details: 'Provide SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY in production env.' };
    }

    return { status: 'Connected', provider: 'Local Development Storage', bucket: './storage', details: 'Local Development Mode Active' };
  }

  async triggerCloudBackup(organizationId = 'org_default') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `cadpoint_crm_backup_${timestamp}.json`;

    // Gather database snapshot
    const leads = await prisma.lead.findMany();
    const students = await prisma.student.findMany();
    const courses = await prisma.course.findMany();
    const admissions = await prisma.admission.findMany();
    const payments = await prisma.payment.findMany();

    const dumpData = {
      timestamp: new Date(),
      organizationId,
      summary: {
        leads: leads.length,
        students: students.length,
        courses: courses.length,
        admissions: admissions.length,
        payments: payments.length
      },
      data: { leads, students, courses, admissions, payments }
    };

    const buffer = Buffer.from(JSON.stringify(dumpData, null, 2), 'utf-8');

    const result = await this.uploadFile({
      buffer,
      filename: backupFilename,
      mimeType: 'application/json',
      category: 'backups',
      organizationId
    });

    return {
      fileName: backupFilename,
      storageKey: result.storageKey,
      fileSizeFormatted: (buffer.length / 1024).toFixed(2) + ' KB',
      createdAt: result.createdAt,
      publicUrl: result.publicUrl
    };
  }
}

module.exports = new StorageService();
