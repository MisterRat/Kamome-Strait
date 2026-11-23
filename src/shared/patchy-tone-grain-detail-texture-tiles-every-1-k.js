/* patchy tone / grain detail texture (tiles every 1 km; the old straight track lines are gone) - only applied to flat low land via the 'land' vertex attribute */
function fieldTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  let sd = 12345;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#e8e8de';
  g.fillRect(0, 0, 1024, 1024);
  const pal = ['#eaeade', '#e8e9dc', '#eae7d8', '#e6e9dc', '#ebe9dc', '#e5e8d9', '#e9e8dd', '#e7e9dc'];
  for (let i = 0; i < 300; i++) {
    const w = 45 + rnd() * 170,
      h = 35 + rnd() * 140,
      x = rnd() * 1024,
      y = rnd() * 1024;
    g.fillStyle = pal[(rnd() * pal.length) | 0];
    for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) g.fillRect(x + ox, y + oy, w, h);
  }
  for (let i = 0; i < 9000; i++) {
    const v = (205 + rnd() * 50) | 0;
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.3)';
    g.fillRect(rnd() * 1024, rnd() * 1024, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(SZ / 1000, SZ / 1000);
  t.anisotropy = 8;
  return t;
}
{
  const p = tg.attributes.position,
    n = p.count,
    hs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const h = HR(p.getX(i), p.getZ(i));
    hs[i] = h;
    p.setY(i, Math.max(h, SEA.PAINT));
  }
  tg.computeVertexNormals();
  const nr = tg.attributes.normal,
    col = new Float32Array(n * 3),
    land = new Float32Array(n),
    wat = new Float32Array(n),
    c = new THREE.Color(),
    c2 = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = p.getX(i),
      z = p.getZ(i),
      h = hs[i],
      ny = nr.getY(i),
      r = hash(x * 0.01, z * 0.01) * 0.1,
      pm = vn(x * 0.0009 + 3.1, z * 0.0009 - 1.7);
    if (h < SEA.PAINT) {
      c.setRGB(0.17, 0.43, 0.66).lerp(c2.setRGB(0.06, 0.2, 0.42), ss(SEA.PAINT, -60, h));
      c.lerp(c2.setRGB(0.8, 0.92, 0.96), ss(-11.5, -8.05, h) * 0.45);
      wat[i] = 1;
    } else {
      c.setRGB(0.27 + r, 0.45 + r, 0.17).lerp(c2.setRGB(0.5 + r, 0.47, 0.22), Math.max(0, pm) * 0.9);
      c.lerp(c2.setRGB(0.1, 0.23, 0.09), ss(0.1, 0.5, vn(x * 0.0011 + 9.3, z * 0.0011 - 4.1)) * (h < 420 ? 0.85 : 0));
      if (h > 150) c.lerp(c2.setRGB(0.36, 0.34, 0.2), ss(150, 300, h));
      c.lerp(c2.setRGB(0.42 + r, 0.4 + r, 0.36), Math.max(ss(0.93, 0.78, ny), ss(300, 650, h)));
      if (h > 650) c.setRGB(0.5, 0.48, 0.44).lerp(c2.setRGB(0.95, 0.97, 1), ss(650, 800, h));
      land[i] = ss(0.95, 0.985, ny) * (1 - ss(120, 250, h)); /* flat low ground only: no field lines on slopes */
    }
    if (h >= SEA.PAINT) {
      const ak = ss(340, 260, Math.abs(x)) * ss(-2260, -2160, z) * ss(1120, 1000, z);
      c.lerp(c2.setRGB(0.3 + r, 0.5 + r, 0.2), ak);
      land[i] *= 1 - ak;
    }
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tg.setAttribute('land', new THREE.BufferAttribute(land, 1));
  tg.setAttribute('wat', new THREE.BufferAttribute(wat, 1));
  /* the sea and the drowned beach are lit as flat ground: lighting is worked out at the 100 m vertices, and a vertex on the shore ramp
     that faces away from the sun made a dark outline around every shore */
  for (let i = 0; i < n; i++) if (hs[i] < 1) nr.setXYZ(i, 0, 1, 0);
  nr.needsUpdate = true;
  {
    const N1 = SEG + 1,
      cv = MMT,
      cx = cv.getContext('2d'),
      im = cx.createImageData(N1, N1),
      L = new V(-0.5, 0.75, -0.45).normalize();
    cv.width = cv.height = N1;
    for (let i = 0; i < n; i++) {
      const u = Math.round(((p.getX(i) + SZ / 2) / SZ) * SEG),
        v = Math.round(((p.getZ(i) + SZ / 2) / SZ) * SEG),
        o = (v * N1 + u) * 4,
        sh = Math.max(0.55, Math.min(1.25, 0.55 + 0.9 * (nr.getX(i) * L.x + nr.getY(i) * L.y + nr.getZ(i) * L.z)));
      im.data[o] = Math.min(255, col[i * 3] * 255 * sh * 1.05);
      im.data[o + 1] = Math.min(255, col[i * 3 + 1] * 255 * sh * 1.05);
      im.data[o + 2] = Math.min(255, col[i * 3 + 2] * 255 * sh * 1.05);
      im.data[o + 3] = Math.round(255 * Math.min(1, Math.min(u, v, SEG - u, SEG - v) / 60)); /* fades out over its last 6 km so it melts into the far-world picture */
    }
    cx.putImageData(im, 0, 0);
  }
}
const FARMU = { value: null },
  FARMG = { value: new THREE.Vector4(3900, -4400, 4700, 0) },
  DETU = { value: 1 };
const TERR_NOISE =
  'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}\nfloat vn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}\n';
const TERR_DETAIL =
  '\nvec2 fuv=(vWP.xz-farmG.xy)/(farmG.z*2.0)+0.5;float inF=step(0.0,fuv.x)*step(fuv.x,1.0)*step(0.0,fuv.y)*step(fuv.y,1.0);vec4 fm=texture2D(farmTex,fuv);diffuseColor.rgb=mix(diffuseColor.rgb,fm.rgb,fm.a*inF*vLand*(1.0-watK));' +
  /* a flooded rice paddy (the farm texture bluer than green there): its water shows the sky, more at a low angle */
  'float wpd=fm.a*inF*vLand*(1.0-watK)*smoothstep(0.01,0.06,fm.b-fm.g);{vec3 Vd=normalize(cameraPosition-vWP);float frd=pow(1.0-clamp(Vd.y,0.0,1.0),3.0);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.56,0.68,0.80),wpd*(0.45+0.5*frd));}\n' +
  'float dd=length(vWP-cameraPosition);float nearK=(1.0-smoothstep(150.0,1300.0,dd))*uDet*(1.0-watK);float flatK=smoothstep(0.70,0.92,vWN.y);float steep=1.0-smoothstep(0.50,0.80,vWN.y);\n' +
  'if(nearK>0.003){float g1=vn2(vWP.xz*0.7),g2=vn2(vWP.xz*2.9),g3=vn2(vWP.xz*11.0);float gr=(g1*0.45+g2*0.33+g3*0.22)-0.5;vec3 tint=vec3(1.0+gr*1.0+(g2-0.5)*0.30,1.0+gr*1.15,1.0+gr*0.55);float blade=vn2(vec2(vWP.x*21.0,vWP.z*2.6))-0.5;float tuft=smoothstep(0.62,0.9,vn2(vWP.xz*1.6));diffuseColor.rgb*=mix(vec3(1.0),tint*(1.0+blade*0.34)*(1.0-tuft*0.18),nearK*flatK*vLand*(1.0-wpd));}\n' +
  '{float band=sin(vWP.y*0.62+vn2(vWP.xz*0.018)*7.0)*0.5+0.5;float layer=smoothstep(0.38,0.62,band);float fine=vn2(vec2(vWP.x*0.9+vWP.z*0.7,vWP.y*5.5));float crack=smoothstep(0.035,0.0,abs(vn2(vWP.xz*0.55+vWP.y*1.3)-0.5));vec3 rock=mix(vec3(0.30,0.27,0.24),vec3(0.50,0.45,0.38),layer)*(0.82+0.36*fine)*(1.0-crack*0.45);diffuseColor.rgb=mix(diffuseColor.rgb,rock,steep*(1.0-watK)*mix(0.45,0.8,nearK));}\n';
