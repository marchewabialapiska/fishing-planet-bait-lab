import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stageSelector = "#underwater-stage";
let active = null;

function makeFish(scene, color, scale, x, y, z, speed, phase) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.12 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xc8c5a4, roughness: 0.48 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat);
  body.scale.set(1.25, 0.48, 0.42);
  group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bellyMat);
  belly.scale.set(0.83, 0.18, 0.34);
  belly.position.set(-0.02, -0.25, 0);
  group.add(belly);
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-1.05, 0); tailShape.lineTo(-1.8, 0.55); tailShape.lineTo(-1.58, 0); tailShape.lineTo(-1.8, -0.55); tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), mat);
  tail.position.x = -0.82; tail.position.z = 0;
  group.add(tail);
  const finShape = new THREE.Shape();
  finShape.moveTo(0,0); finShape.lineTo(-0.48,-0.48); finShape.lineTo(0.38,-0.24); finShape.closePath();
  const fin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), mat);
  fin.position.set(-0.05,0.32,0.02); group.add(fin);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055,12,10), new THREE.MeshBasicMaterial({color:0x090d0b}));
  eye.position.set(0.82,0.1,0.36); group.add(eye);
  group.scale.setScalar(scale);
  group.position.set(x,y,z);
  scene.add(group);
  return { group, tail, speed, phase, baseY:y, range:2.6 + Math.random()*1.5 };
}

function build(stage) {
  if (!stage || stage.dataset.ready === "1") return;
  stage.dataset.ready = "1";
  const canvas = stage.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061b1b);
  scene.fog = new THREE.FogExp2(0x0a3936, 0.035);
  const camera = new THREE.PerspectiveCamera(48, stage.clientWidth/stage.clientHeight, 0.1, 100);
  camera.position.set(0, 3.8, 16);
  const target = new THREE.Vector3(0,1.1,0);
  camera.lookAt(target);
  scene.add(new THREE.HemisphereLight(0x9bd9d0,0x14251c,2.0));
  const sun = new THREE.DirectionalLight(0xffd59a,2.4); sun.position.set(-5,9,5); scene.add(sun);
  const blue = new THREE.PointLight(0x36c9bd,35,30); blue.position.set(4,1,5); scene.add(blue);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(60,60,70,70), new THREE.MeshStandardMaterial({color:0x0b4c49,roughness:0.22,metalness:0.18,transparent:true,opacity:0.78,side:THREE.DoubleSide}));
  water.rotation.x=-Math.PI/2; water.position.y=-1.15; scene.add(water);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60,60,1,1),new THREE.MeshStandardMaterial({color:0x293c2b,roughness:1}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-5.1; scene.add(floor);

  const rockMat = new THREE.MeshStandardMaterial({color:0x4a5140,roughness:1});
  for(let i=0;i<26;i++){
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25+Math.random()*0.55,0),rockMat);
    rock.position.set((Math.random()-.5)*26,-4.85+Math.random()*.12,-5+Math.random()*5);
    rock.scale.y=0.45+Math.random()*0.5; scene.add(rock);
  }
  const plantMat = new THREE.MeshStandardMaterial({color:0x397c4e,roughness:0.8});
  for(let i=0;i<35;i++){
    const x=(Math.random()-.5)*27, z=-5+Math.random()*3, h=1.0+Math.random()*2.8;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,-5,z),new THREE.Vector3(x+(Math.random()-.5)*1.6,-5+h*.6,z),new THREE.Vector3(x+(Math.random()-.5)*2.2,-5+h,z));
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve,14,0.035+Math.random()*0.025,5,false),plantMat);
    scene.add(stem);
  }

  const fish = [];
  const palette = [0xb78a4c,0x829b80,0xc0a16a,0x788d91,0x9d744e,0x617c68];
  for(let i=0;i<10;i++){
    fish.push(makeFish(scene,palette[i%palette.length],0.48+Math.random()*0.55,-10+Math.random()*20,-0.2-Math.random()*3,-3+Math.random()*4,0.55+Math.random()*0.7,Math.random()*6.28));
  }
  const dustCount=900, positions=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){positions[i*3]=(Math.random()-.5)*30;positions[i*3+1]=-4.8+Math.random()*8;positions[i*3+2]=-7+Math.random()*13;}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xb9dfc8,size:0.035,transparent:true,opacity:0.48,depthWrite:false}));scene.add(dust);

  let dragging=false,lastX=0,lastY=0,yaw=0,pitch=0,zoom=16;
  const pointerDown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);stage.classList.add("is-dragging");};
  const pointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*0.004;pitch=Math.max(-0.55,Math.min(0.6,pitch+dy*0.003));};
  const pointerUp=()=>{dragging=false;stage.classList.remove("is-dragging");};
  canvas.addEventListener("pointerdown",pointerDown);canvas.addEventListener("pointermove",pointerMove);canvas.addEventListener("pointerup",pointerUp);canvas.addEventListener("pointercancel",pointerUp);
  canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(10,Math.min(24,zoom+e.deltaY*0.012));},{passive:false});
  stage.querySelector("[data-underwater-reset]")?.addEventListener("click",()=>{yaw=0;pitch=0;zoom=16;});
  stage.querySelectorAll("[data-depth]").forEach(btn=>btn.addEventListener("click",()=>{stage.querySelectorAll("[data-depth]").forEach(b=>b.classList.toggle("active",b===btn));target.y=Number(btn.dataset.depth);}));

  const clock=new THREE.Clock();
  let raf=0,disposed=false;
  function resize(){if(disposed)return;const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(stage);
  function animate(){
    if(disposed)return;
    raf=requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    water.position.y=-1.15+Math.sin(t*.7)*.035;
    water.material.color.offsetHSL(0,0,Math.sin(t*.35)*.0015);
    fish.forEach((f,i)=>{const p=t*f.speed+f.phase;f.group.position.x=Math.sin(p*.34)*f.range+Math.sin(f.phase)*2.2;f.group.position.y=f.baseY+Math.sin(p*1.15)*.28;f.group.rotation.y=Math.cos(p*.34)>0?0:Math.PI;f.tail.rotation.y=Math.sin(p*4)*.42;});
    dust.rotation.y=t*.008; dust.position.y=Math.sin(t*.18)*.12;
    const cx=Math.sin(yaw)*zoom,cz=Math.cos(yaw)*zoom;
    camera.position.x+=(cx-camera.position.x)*.045;
    camera.position.z+=(cz-camera.position.z)*.045;
    camera.position.y+=(3.8+pitch*8-camera.position.y)*.045;
    camera.lookAt(target);
    renderer.render(scene,camera);
  }
  animate();
  active={dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();stage.dataset.ready="";}};
}

function scan(){
 const stage=document.querySelector(stageSelector);
 if(stage && stage.dataset.ready!=="1") {
   try{build(stage);}catch(err){console.error("Underwater Command Center:",err);stage.classList.add("underwater-error");}
 }
}
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
scan();
window.addEventListener("beforeunload",()=>{observer.disconnect();active?.dispose();},{once:true});
