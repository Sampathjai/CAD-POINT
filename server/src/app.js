require('dotenv').config();
const express=require('express');
const cors=require('cors');
const prisma=require('./config/prisma');
const {helmetMiddleware,apiLimiter}=require('./middleware/security');
const {port,clientUrl}=require('./config/env');
const app=express();
app.set('trust proxy',1);
app.use(helmetMiddleware);
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5001', 'https://cad-point.vercel.app'];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    maxAge: 86400
  })
);
app.use(express.json({limit:'2mb'}));
app.use(apiLimiter);
app.get(['/api/health', '/health'], async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: 'ok', database: 'connected', service: 'CAD Point CRM API' });
  } catch {
    res.status(503).json({ success: false, status: 'error', database: 'disconnected' });
  }
});
// Mount API routes (supports both /api/route and /route for Vercel serverless functions)
app.use(['/api/auth', '/auth'], require('./routes/auth'));
app.use(['/api/users', '/users'], require('./routes/users'));
app.use(['/api/leads', '/leads'], require('./routes/leads'));
app.use(['/api/followups', '/followups'], require('./routes/followups'));
app.use(['/api/search', '/search'], require('./routes/search'));
app.use(['/api/notifications', '/notifications'], require('./routes/notifications'));
app.use(['/api/courses', '/courses'], require('./routes/courses'));
app.use(['/api/batches', '/batches'], require('./routes/batches'));
app.use(['/api/students', '/students'], require('./routes/students'));
app.use(['/api/admissions', '/admissions'], require('./routes/admissions'));
app.use(['/api/payments', '/payments'], require('./routes/payments'));
app.use(['/api/files', '/files'], require('./routes/files'));
app.use(['/api/desktop-agent', '/desktop-agent'], require('./routes/desktopAgent'));
app.use(['/api/branches', '/branches'], require('./routes/branches'));
app.use(['/api/reports', '/reports'], require('./routes/reports'));
app.use(['/api/settings', '/settings'], require('./routes/settings'));
app.use(['/api/devices', '/devices'], require('./routes/devices'));
app.use(['/api/whatsapp', '/whatsapp'], require('./routes/whatsapp'));
app.use((req,res)=>res.status(404).json({success:false,message:'API endpoint not found'}));
app.use((err,_req,res,_next)=>res.status(err.status||500).json({success:false,message:process.env.NODE_ENV==='production'?'Internal server error':err.message}));
module.exports={app,prisma,port};
