require('dotenv').config();
const express=require('express');
const cors=require('cors');
const {PrismaClient}=require('@prisma/client');
const {helmetMiddleware,apiLimiter}=require('./middleware/security');
const {port,clientUrl}=require('./config/env');
const prisma=new PrismaClient();
const app=express();
app.set('trust proxy',1);
app.use(helmetMiddleware);
app.use(cors({origin:clientUrl.split(','),credentials:true}));
app.use(express.json({limit:'2mb'}));
app.use(apiLimiter);
app.get('/api/health',async(_req,res)=>{
  try{await prisma.$queryRaw`SELECT 1`;res.json({success:true,status:'ok',database:'connected',service:'CAD Point CRM API'});}
  catch{res.status(503).json({success:false,status:'error',database:'disconnected'});}
});
// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/students', require('./routes/students'));
app.use('/api/admissions', require('./routes/admissions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));
app.use((req,res)=>res.status(404).json({success:false,message:'API endpoint not found'}));
app.use((err,_req,res,_next)=>res.status(err.status||500).json({success:false,message:process.env.NODE_ENV==='production'?'Internal server error':err.message}));
module.exports={app,prisma,port};
