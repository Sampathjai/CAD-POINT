const {app,prisma,port}=require('./app');

async function start(){
  let retries = 3;
  while (retries > 0) {
    try {
      await prisma.$connect();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      console.warn(`Prisma connection attempt failed. Retrying in 2s (${retries} attempts left)...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  const server=app.listen(port,()=>console.log(`CAD Point CRM API listening on http://localhost:${port}`));
  const shutdown=()=>server.close(async()=>{await prisma.$disconnect();process.exit(0);});
  process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}

start().catch(async e=>{console.error('Failed to start API:',e);await prisma.$disconnect();process.exit(1);});
