const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const p=new PrismaClient();
async function main(){
 const passwordHash=await bcrypt.hash('Admin@123',12);
 const admin=await p.user.upsert({where:{email:'admin@cadpoint.com'},update:{},create:{name:'CAD Point Admin',email:'admin@cadpoint.com',passwordHash,role:'SUPER_ADMIN'}});
 const names=['Google','Meta','Referral','Website','Walk-in','WhatsApp'];
 for(const name of names) await p.enquirySource.upsert({where:{name},update:{},create:{name}});
 const courses=[
  ['AUTOCAD','AutoCAD',30000],['REVIT','Revit Architecture',45000],['SOLIDWORKS','SolidWorks',35000],['BIM','BIM Professional',50000],['STAAD','STAAD Pro',28000]
 ];
 for(const [courseCode,name,standardFee] of courses) await p.course.upsert({where:{courseCode},update:{},create:{courseCode,name,standardFee}});
 console.log('Seed complete. Login: admin@cadpoint.com / Admin@123');
}
main().finally(()=>p.$disconnect());
