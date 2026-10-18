import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceDir = "C:/Users/2mabc/OneDrive/Desktop/Desarrollo-Cloud-Native";
const buildDir = "C:/Users/2mabc/.codex/visualizations/2026/10/18/01a150a8-2914-78c0-9a85-6ea2a43ca765/Pedidos360-build";
const outputDir = path.join(workspaceDir, "artifacts");
const candidatePath = path.join(workspaceDir, "Pedidos360-candidate.pptx");
const finalPath = path.join(outputDir, "Pedidos360.pptx");
const skillDir = "C:/Users/2mabc/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations";
const toolPath = "C:/Users/2mabc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const { Presentation, PresentationFile } = await import(pathToFileURL(toolPath).href);

const FONT = "Arial";
const C = { navy:"#102235", teal:"#078C8C", cyan:"#42C6C6", blue:"#2D67B2", orange:"#E79845", ink:"#172B3A", muted:"#526879", line:"#BED0DA", pale:"#F3F7F8", white:"#FFFFFF", green:"#18875D", red:"#B64343" };
const pres = Presentation.create({ slideSize:{ width:1280, height:720 } });

function rect(s,x,y,w,h,fill="none",stroke="none",sw=0,name) {
  return s.shapes.add({ geometry:"rect", name, position:{left:x,top:y,width:w,height:h}, fill, line:{style:"solid",fill:stroke,width:sw} });
}
function txt(s,text,x,y,w,h,o={}) {
  const z=s.shapes.add({geometry:"textbox",name:o.name,position:{left:x,top:y,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}});
  z.text=text;
  z.text.style={typeface:FONT,fontSize:o.size??22,bold:o.bold??false,color:o.color??C.ink,alignment:o.align??"left",verticalAlignment:o.valign??"middle",autoFit:"shrinkText",wrap:"square",insets:0};
  return z;
}
function box(s,title,detail,x,y,w,h,accent=C.teal,titleSize=21,detailSize=17) {
  const z=rect(s,x,y,w,h,C.white,C.line,1.5);
  rect(s,x,y,7,h,accent,accent,0);
  txt(s,title,x+18,y+9,w-30,31,{size:titleSize,bold:true,color:C.navy});
  if(detail) txt(s,detail,x+18,y+42,w-30,h-48,{size:detailSize,color:C.muted});
  return z;
}
function link(s,a,b,color=C.teal,kind="elbow",fromSide,toSide) {
  return s.shapes.connect(a,b,{kind,fromSide,toSide,line:{style:"solid",fill:color,width:2},head:{type:"triangle",width:"sm",length:"sm"}});
}
function slide(title,n) {
  const s=pres.slides.add(); s.background.fill=C.pale;
  txt(s,title,62,36,1080,58,{size:44,bold:true,color:C.navy,name:"slide-"+n+"-title"});
  rect(s,62,108,84,5,C.teal,C.teal,0);
  txt(s,String(n).padStart(2,"0")+" / 08",1125,50,92,24,{size:15,bold:true,color:C.muted,align:"right"});
  return s;
}

// 1 Portada
{
 const s=pres.slides.add(); s.background.fill=C.navy; rect(s,0,0,17,720,C.cyan,C.cyan,0);
 txt(s,"DSY1107  ·  PROYECTO DE ARQUITECTURA",82,125,660,32,{size:18,bold:true,color:C.cyan});
 txt(s,"Pedidos360",78,210,920,100,{size:78,bold:true,color:C.white,name:"cover-title"});
 txt(s,"Plataforma cloud-native para gestión de pedidos",84,326,900,56,{size:31,color:"#D5E5EC"});
 rect(s,84,432,170,3,C.cyan,C.cyan,0);
 txt(s,"Presentan",84,466,180,28,{size:17,bold:true,color:"#A9C4D0"});
 txt(s,"Tu nombre  ·  Javier",84,500,580,43,{size:26,bold:true,color:C.white});
 txt(s,"Identidad, API, microservicios y mensajería",84,638,780,30,{size:17,color:"#A9C4D0"});
 s.speakerNotes.text="Presentamos Pedidos360, una plataforma de pedidos desplegada con servicios cloud-native. En tres minutos recorreremos la arquitectura, el inicio de sesión con Entra ID, la protección de API Gateway, el despliegue en Docker y la mensajería RabbitMQ.";
}

// 2 Arquitectura general en un diagrama editable
{
 const s=slide("Arquitectura general",2);
 const fe=box(s,"Frontend","React · Nginx · EC2",55,170,205,94,C.blue);
 const entra=box(s,"Microsoft Entra ID","Tenant · OIDC · JWT",55,410,225,88,C.orange,20,16);
 const gw=box(s,"AWS API Gateway","JWT authorizer · CORS",340,170,225,94,C.teal,21,16);
 const group=rect(s,635,132,284,318,"none",C.line,1.5,"microservices-boundary");
 txt(s,"MICROSERVICIOS EN DOCKER",653,142,245,24,{size:15,bold:true,color:C.muted});
 const u=box(s,"user-service","Usuarios",657,185,239,66,C.blue,20,15);
 const i=box(s,"item-service","Ítems",657,271,239,66,C.teal,20,15);
 const c=box(s,"category-service","Categorías",657,357,239,66,C.orange,20,15);
 const db=box(s,"MariaDB","Base de datos",1000,235,215,103,C.navy,24,18);
 const mq=box(s,"RabbitMQ","Clúster interno · 2 nodos",520,524,340,87,C.orange,24,17);
 const admin=box(s,"rabbit-service","Administración de recursos",933,524,282,87,C.blue,21,16);
 link(s,fe,gw,C.teal,"straight","right","left");
 link(s,gw,u,C.blue,"elbow","right","left"); link(s,gw,i,C.teal,"straight","right","left"); link(s,gw,c,C.orange,"elbow","right","left");
 link(s,u,db,C.blue,"elbow","right","left"); link(s,i,db,C.teal,"straight","right","left"); link(s,c,db,C.orange,"elbow","right","left");
 link(s,entra,fe,C.orange,"straight","top","bottom"); txt(s,"Inicio de sesión",70,338,190,25,{size:16,bold:true,color:C.orange,align:"center"});
 link(s,group,mq,C.navy,"elbow","bottom","top"); link(s,admin,mq,C.blue,"straight","left","right");
 txt(s,"REST",265,183,68,25,{size:15,bold:true,color:C.teal,align:"center"});
 txt(s,"eventos",547,476,120,25,{size:15,bold:true,color:C.navy,align:"center"});
 s.speakerNotes.text="El frontend React se sirve desde Nginx en EC2. Los usuarios se autentican en Microsoft Entra ID y la aplicación envía solicitudes al API Gateway de AWS. El gateway valida el JWT y distribuye las rutas a los tres servicios Spring Boot. Cada servicio persiste en MariaDB. RabbitMQ conecta los servicios de forma asíncrona, y rabbit-service administra los recursos del broker.";
}

// 3 Identidad
{
 const s=slide("Identidad y tenant de Entra ID",3);
 txt(s,"Tenant Microsoft Entra ID del proyecto",72,137,780,35,{size:25,bold:true,color:C.navy});
 const steps=[["1","App registrada","SPA · redirect URI HTTPS"],["2","MSAL","Inicio de sesión OIDC"],["3","Authorization Code","PKCE protege el flujo"],["4","JWT","Token enviado a la API"]];
 const xs=[70,365,660,955], shapes=[];
 steps.forEach((v,k)=>{const x=xs[k],sh=rect(s,x,220,245,132,C.white,C.line,1.5);rect(s,x+16,236,36,36,k===2?C.orange:C.teal,"none",0);txt(s,v[0],x+16,236,36,36,{size:18,bold:true,color:C.white,align:"center"});txt(s,v[1],x+64,236,164,40,{size:21,bold:true,color:C.navy});txt(s,v[2],x+18,291,210,43,{size:17,color:C.muted});shapes.push(sh);});
 for(let k=0;k<3;k++) link(s,shapes[k],shapes[k+1],C.teal,"straight","right","left");
 txt(s,"Scopes de la API",72,397,240,32,{size:21,bold:true,color:C.navy});
 txt(s,"Users.Read  ·  Users.Write",72,443,340,35,{size:20});
 txt(s,"Items.Read  ·  Items.Write",455,443,340,35,{size:20});
 txt(s,"Categories.Read  ·  Categories.Write",838,443,380,35,{size:20});
 rect(s,72,525,8,76,C.orange,C.orange,0);
 txt(s,"HTTPS en Nginx",100,526,250,31,{size:21,bold:true,color:C.navy});
 txt(s,"Certificado TLS y contexto seguro para MSAL/PKCE.",100,562,1050,44,{size:19,color:C.muted});
 s.speakerNotes.text="En Entra ID se registra la aplicación de una sola página y se configuran los URI de retorno. MSAL inicia el flujo OpenID Connect con Authorization Code y PKCE. La aplicación solicita permisos delimitados por scopes, por ejemplo lectura y escritura de usuarios, ítems y categorías. El usuario recibe un JWT para llamar a la API. En el sitio desplegado se usa HTTPS en Nginx, porque el navegador requiere un contexto seguro para las capacidades criptográficas del flujo.";
}

// 4 API Gateway
{
 const s=slide("AWS API Gateway y rutas",4);
 txt(s,"Una entrada HTTPS para los servicios",72,139,680,37,{size:26,bold:true,color:C.navy});
 const auth=box(s,"JWT authorizer","Issuer y audiencia de Entra ID",72,208,330,102,C.teal,24,18);
 const api=box(s,"API Gateway","Rutas proxy → Docker",472,208,330,102,C.blue,24,18); link(s,auth,api,C.teal,"straight","right","left");
 txt(s,"RUTAS",72,367,170,24,{size:16,bold:true,color:C.muted});
 [["/users/{proxy+}","user-service"],["/items/{proxy+}","item-service"],["/categories/{proxy+}","category-service"]].forEach((v,k)=>{const y=410+k*53;txt(s,v[0],72,y,390,39,{size:22,bold:true,color:C.navy});rect(s,475,y+20,82,1,C.line,C.line,1);txt(s,v[1],580,y,340,39,{size:21});});
 rect(s,970,178,3,366,C.line,C.line,0); txt(s,"CORS",1010,204,180,34,{size:23,bold:true,color:C.navy});
 txt(s,"Orígenes, métodos y headers configurados",1010,251,210,84,{size:18,color:C.muted});
 rect(s,1010,375,185,62,"#E4F4EC","#B4D8C5",1.2); txt(s,"OPTIONS",1020,384,165,42,{size:21,bold:true,color:C.green,align:"center"});
 txt(s,"Sin authorizer",1010,448,185,28,{size:17,color:C.muted,align:"center"});
 txt(s,"Las demás solicitudes requieren un JWT válido.",72,602,770,30,{size:19,bold:true,color:C.muted});
 s.speakerNotes.text="AWS API Gateway recibe las solicitudes y aplica el JWT authorizer contra el emisor de Entra ID. Las rutas proxy conservan el path y envían usuarios, ítems y categorías a sus respectivos microservicios Docker. CORS limita los orígenes, métodos y encabezados permitidos. Las solicitudes OPTIONS atienden el preflight del navegador sin exigir token; las rutas funcionales sí exigen un JWT.";
}

// 5 Docker
{
 const s=slide("Docker y publicación de imágenes",5);
 txt(s,"Build multi-stage",72,143,330,38,{size:25,bold:true,color:C.navy});
 const b1=box(s,"Backend · build","JDK + Maven Wrapper\ncompila el servicio",72,204,300,120,C.blue,21,18);
 const b2=box(s,"Backend · runtime","JRE + JAR\nimagen liviana",450,204,300,120,C.teal,21,18); link(s,b1,b2,C.teal,"straight","right","left");
 const f1=box(s,"Frontend · build","Node.js + Vite\ngenera archivos estáticos",72,376,300,120,C.orange,21,18);
 const f2=box(s,"Frontend · runtime","Nginx sirve la aplicación",450,376,300,120,C.blue,21,18); link(s,f1,f2,C.teal,"straight","right","left");
 const hub=box(s,"Docker Hub","Imágenes versionadas",865,229,300,100,C.navy,24,18);
 const ec2=box(s,"EC2","Descarga y ejecuta contenedores",865,401,300,100,C.teal,24,18);
 link(s,b2,hub,C.blue,"elbow","right","left"); link(s,f2,hub,C.orange,"elbow","right","left"); link(s,hub,ec2,C.teal,"straight","bottom","top");
 txt(s,"docker run -d --restart unless-stopped",72,561,735,42,{size:24,bold:true,color:C.navy});
 txt(s,"Docker aplica la política de reinicio y mantiene el contenedor activo.",72,610,1080,31,{size:18,color:C.muted});
 s.speakerNotes.text="Las imágenes separan compilación y ejecución. Los servicios Java se compilan con JDK y Maven, y corren con JRE y el JAR generado. El frontend se construye con Node y Vite, y Nginx sirve los archivos estáticos. Las imágenes se publican en Docker Hub y EC2 las ejecuta. Para mantenerlas activas después de reinicios se usa la política de Docker --restart unless-stopped; la política de reinicio pertenece al daemon de Docker.";
}

// 6 RabbitMQ
{
 const s=slide("RabbitMQ: eventos y administración",6);
 txt(s,"Clúster de 2 nodos en docker-compose",72,137,980,36,{size:25,bold:true,color:C.navy});
 const topic=box(s,"shopping.events","Exchange topic",72,233,230,100,C.teal,23,19);
 const q1=box(s,"Cola de usuarios","durable",386,168,230,72,C.blue,20,16), q2=box(s,"Cola de ítems","durable",386,267,230,72,C.orange,20,16), q3=box(s,"Cola de categorías","durable",386,366,230,72,C.navy,20,16);
 const dlx=box(s,"shopping.dlx","Exchange direct",714,265,205,100,C.red,22,18);
 const d1=box(s,"DLQ usuarios","",1000,168,205,72,C.red,19,15), d2=box(s,"DLQ ítems","",1000,267,205,72,C.red,19,15), d3=box(s,"DLQ categorías","",1000,366,205,72,C.red,19,15);
 link(s,topic,q1,C.teal,"elbow","right","left"); link(s,topic,q2,C.teal,"straight","right","left"); link(s,topic,q3,C.teal,"elbow","right","left");
 link(s,q1,dlx,C.red,"elbow","right","left"); link(s,q2,dlx,C.red,"straight","right","left"); link(s,q3,dlx,C.red,"elbow","right","left");
 link(s,dlx,d1,C.red,"elbow","right","left"); link(s,dlx,d2,C.red,"straight","right","left"); link(s,dlx,d3,C.red,"elbow","right","left");
 txt(s,"Cada cola tiene su DLQ",388,455,375,27,{size:17,bold:true,color:C.red,align:"center"});
 txt(s,"rabbitmq-1",72,512,205,40,{size:21,bold:true,color:C.navy,align:"center"}); rect(s,277,518,1,29,C.line,C.line,0); txt(s,"rabbitmq-2",286,512,205,40,{size:21,bold:true,color:C.navy,align:"center"});
 box(s,"rabbit-service","Crear y eliminar colas,\nexchanges y bindings",714,500,491,92,C.blue,21,17);
 txt(s,"Reintentos agotados: DLQ y registro ERROR",72,605,800,31,{size:18,color:C.muted});
 s.speakerNotes.text="RabbitMQ corre como un clúster de dos nodos definido en docker-compose. Los productores publican en el exchange topic shopping.events, que enruta a tres colas durables por clave. Si un consumidor falla tras los reintentos, el broker usa shopping.dlx, de tipo direct, para enviar el mensaje a la DLQ correspondiente. rabbit-service ofrece administración de colas, exchanges y bindings.";
}

// 7 Seguridad
{
 const s=slide("Seguridad y despliegue en AWS",7);
 txt(s,"EC2 pública",72,151,315,43,{size:28,bold:true,color:C.navy});
 txt(s,"Elastic IP",72,221,260,38,{size:22,bold:true,color:C.teal}); txt(s,"Dirección estable para el sitio",72,261,335,35,{size:18,color:C.muted});
 rect(s,72,321,440,1,C.line,C.line,1); txt(s,"Security Group",72,352,300,38,{size:22,bold:true,color:C.teal});
 txt(s,"Reglas de entrada limitan los puertos expuestos.",72,392,390,60,{size:18,color:C.muted});
 txt(s,"Nginx termina HTTPS",72,487,390,38,{size:22,bold:true,color:C.navy}); txt(s,"Certificado TLS para el acceso público",72,527,390,35,{size:18,color:C.muted});
 rect(s,598,154,2,424,C.line,C.line,0); txt(s,"Validación JWT",650,151,470,43,{size:28,bold:true,color:C.navy});
 txt(s,"Prueba de acceso al API Gateway",650,204,490,31,{size:18,color:C.muted});
 rect(s,650,282,220,118,"#FBE9E8","#E6B9B6",1.5); txt(s,"401",670,294,180,56,{size:42,bold:true,color:C.red,align:"center"}); txt(s,"Sin token",670,350,180,33,{size:18,align:"center"});
 rect(s,920,282,220,118,"#E4F4EC","#B4D8C5",1.5); txt(s,"200",940,294,180,56,{size:42,bold:true,color:C.green,align:"center"}); txt(s,"Con JWT válido",940,350,180,33,{size:18,align:"center"});
 txt(s,"Entra ID emite el token y API Gateway valida issuer, audiencia y firma.",650,455,500,84,{size:20,color:C.muted});
 s.speakerNotes.text="El despliegue publica la aplicación en EC2 con Elastic IP y reglas de Security Group que limitan los puertos accesibles. Nginx sirve el frontend por HTTPS. API Gateway valida el JWT emitido por Entra ID. La prueba de seguridad esperada devuelve 401 cuando la solicitud no incluye token y 200 cuando incluye un token válido para la API.";
}

// 8 Conclusión
{
 const s=slide("Conclusión y próximos pasos",8);
 txt(s,"Logrado",72,155,360,40,{size:27,bold:true,color:C.teal});
 txt(s,"OIDC con MSAL y PKCE\nJWT authorizer para la API\nServicios Docker conectados a MariaDB\nEventos RabbitMQ con DLQ",72,218,530,255,{size:22,valign:"top"});
 rect(s,652,151,2,414,C.line,C.line,0); txt(s,"Mejoras siguientes",704,155,440,40,{size:27,bold:true,color:C.orange});
 txt(s,"Certificado HTTPS real y renovación automática\n\nSecretos en AWS Secrets Manager o Parameter Store\n\nMás nodos RabbitMQ y pruebas de tolerancia a fallos",704,218,490,270,{size:22,valign:"top"});
 txt(s,"Pedidos360 integra identidad, servicios y operación en una sola solución.",72,603,1125,42,{size:23,bold:true,color:C.navy});
 s.speakerNotes.text="Pedidos360 reúne autenticación centralizada, rutas protegidas, tres microservicios y mensajería asíncrona en una arquitectura desplegable en AWS. Los siguientes pasos son usar un certificado de producción con renovación automática, mover las credenciales fuera del código y probar mayor tolerancia a fallos con más nodos RabbitMQ. Gracias.";
}

await fs.mkdir(buildDir,{recursive:true}); await fs.mkdir(outputDir,{recursive:true});
for(const [index,s] of pres.slides.items.entries()){
 const png=await pres.export({slide:s,format:"png",scale:1});
 await fs.writeFile(path.join(buildDir,"slide-"+String(index+1).padStart(2,"0")+".png"),new Uint8Array(await png.arrayBuffer()));
}
const montage=await pres.export({format:"png",montage:true});
await fs.writeFile(path.join(buildDir,"montage.png"),new Uint8Array(await montage.arrayBuffer()));
await (await PresentationFile.exportPptx(pres)).save(candidatePath);
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,"container_tools/artifact_tool_utils.mjs")).href);
const result=await finalizePresentation({
 explicitTotalSlideCount:8, requiredNativeTableOwnerSlides:[], requiredNativeChartOwnerSlides:[],
 workspaceDir,candidatePath,finalPath,
 pythonExecutable:"C:/Users/2mabc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
 integrityValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_package_integrity.py"),
 layoutValidatorPath:path.join(skillDir,"container_tools/inspect_presentation_layout_geometry.py"),
 layoutArgs:["--expected-slide-size-emu","12192000,6858000","--validate-heading-fit"],
 fontPolicy:{basis:"design",families:[FONT]},verifyArtifactToolImport:true,
 receiptPath:path.join(workspaceDir,"Pedidos360.validation.json"),
});
console.log(JSON.stringify(result,null,2));
