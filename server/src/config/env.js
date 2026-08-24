const required=['DATABASE_URL','JWT_SECRET'];
for(const key of required){if(!process.env[key])throw new Error(`Missing required environment variable: ${key}`);}
module.exports={
  port:Number(process.env.PORT||5001),
  clientUrl:process.env.CLIENT_URL||'http://localhost:3000'
};
