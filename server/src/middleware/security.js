const helmet=require('helmet');
const rateLimit=require('express-rate-limit');
const apiLimiter=rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:'draft-7',legacyHeaders:false});
const loginLimiter=rateLimit({windowMs:15*60*1000,limit:20});
module.exports={helmetMiddleware:helmet(),apiLimiter,loginLimiter};
