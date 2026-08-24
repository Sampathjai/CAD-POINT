const {app,prisma,port}=require('./app');
async function start(){
  await prisma.$connect();
  const server=app.listen(port,()=>console.log(`CAD Point CRM API listening on http://localhost:${port}`));
  const shutdown=()=>server.close(async()=>{await prisma.$disconnect();process.exit(0);});
  process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}
start().catch(async e=>{console.error('Failed to start API:',e);await prisma.$disconnect();process.exit(1);});
