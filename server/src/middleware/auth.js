const jwt=require('jsonwebtoken');
function authenticate(req,res,next){
  try{
    const h=req.headers.authorization||'';
    if(!h.startsWith('Bearer '))return res.status(401).json({success:false,message:'Authentication required'});
    req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET); next();
  }catch{return res.status(401).json({success:false,message:'Invalid or expired token'});}
}
function authorize(...roles){return(req,res,next)=>{
  if(!req.user||!roles.includes(req.user.role))return res.status(403).json({success:false,message:'Insufficient permissions'});
  next();
};}
module.exports={authenticate,authorize};
