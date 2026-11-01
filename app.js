'use strict';
const $=s=>document.querySelector(s);
const ls={get:(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}};
const STYLES=['Aleatório','Absurdo','Irônico','Cotidiano','Trocadilho'];
const MSGS=['Analisando a imagem…','Caçando o lado cômico…','Afinando o trocadilho…','Escolhendo a zoeira…'];
const FONT=n=>`${n}px Anton,Impact,'Arial Black',sans-serif`;
const S={key:ls.get('mv_key',localStorage.getItem('gemini_api_key')||''),model:ls.get('mv_model','gemini-2.5-flash'),lang:ls.get('mv_lang',localStorage.getItem('meme_lang')||'Brasil'),style:ls.get('mv_style','Aleatório'),layout:'bars',busy:false,ideas:[],seen:[],cur:0,hid:null,img:null,b64:'',small:''};
const SYS=`Você é a MemeVision, uma máquina brasileira de criar memes: rápida, criativa e debochada na medida. Olhe a imagem, ache o que há de cômico (expressão, pose, objeto, bicho, cenário, situação) e escreva legendas curtas que as pessoas mandariam no grupo. Use exagero, ironia, trocadilho, comparação absurda, referências a memes e cultura pop quando couber, e gírias naturais do idioma ou dialeto pedido. Evite legendas genéricas. Pode brincar com características visíveis (nariz, cabelo, cara de sono) de forma leve e criativa, como apelido de amigo. Nunca humilhe nem ataque raça, etnia, religião, gênero, deficiência, orientação ou corpo de forma cruel, e não identifique ninguém pelo rosto. Se a imagem for delicada, faça a piada sobre a situação, a expressão ou o objeto. NUNCA responda com recusa, aviso ou explicação: sempre entregue as ideias. Cada texto tem no máximo 70 caracteres, sem aspas, hashtags ou emojis. Se uma frase só for mais engraçada, deixe bottom vazio. Gere 4 ideias com ângulos bem diferentes, a mais forte primeiro.`;
let tt,iv;
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),1800)};
const showErr=m=>{const e=$('#err');e.textContent=m||'';e.hidden=!m};
const clean=s=>String(s||'').replace(/["“”*#]/g,'').replace(/\s+/g,' ').trim().slice(0,90);

function imgFrom(src){return new Promise((ok,no)=>{const blob=typeof src!=='string',u=blob?URL.createObjectURL(src):src,i=new Image();i.onload=()=>{if(blob)URL.revokeObjectURL(u);ok(i)};i.onerror=()=>no(new Error('Não consegui abrir essa imagem. Use JPG, PNG ou WebP.'));i.src=u})}
function scale(img,max,q){const r=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*r);c.height=Math.round(img.naturalHeight*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q)}
async function setImage(src){const img=await imgFrom(src);S.img=img;S.b64=scale(img,1024,.8).split(',')[1];S.small=scale(img,480,.7);S.seen=[];S.ideas=[];S.hid=null;$('#thumb').src=S.small;$('#thumb').hidden=false;$('#dropTxt').hidden=true}

async function callGemini(){
  if(!S.key){openSettings();throw new Error('Cole sua chave Gemini nas configurações (é grátis no Google AI Studio).')}
  const tema=$('#tema').value.trim();
  const u=`Idioma/dialeto: ${S.lang}. Estilo de humor: ${S.style==='Aleatório'?'o que for mais engraçado, misture':S.style}.${tema?` Tema obrigatório: ${tema}.`:''}${S.seen.length?` Já usadas (não repita nem parafraseie): ${S.seen.join(' | ')}.`:''} Gere 4 ideias.`;
  const body={systemInstruction:{parts:[{text:SYS}]},contents:[{parts:[{text:u},{inline_data:{mime_type:'image/jpeg',data:S.b64}}]}],
    generationConfig:{temperature:1.1,maxOutputTokens:700,responseMimeType:'application/json',
      responseSchema:{type:'OBJECT',properties:{ideas:{type:'ARRAY',items:{type:'OBJECT',properties:{top:{type:'STRING'},bottom:{type:'STRING'}},required:['top']}}},required:['ideas']},
      ...(S.model.includes('2.5')?{thinkingConfig:{thinkingBudget:0}}:{})},
    safetySettings:['HARASSMENT','HATE_SPEECH','SEXUALLY_EXPLICIT','DANGEROUS_CONTENT'].map(c=>({category:'HARM_CATEGORY_'+c,threshold:'BLOCK_ONLY_HIGH'}))};
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),25000);let r;
  try{r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':S.key},body:JSON.stringify(body),signal:ctl.signal})}
  catch(e){const x=new Error(e.name==='AbortError'?'A IA demorou demais. Tente de novo.':'Sem conexão com o Google. Verifique a internet.');x.retry=e.name==='AbortError';throw x}
  finally{clearTimeout(t)}
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const m=d.error?.message||'',x=new Error(r.status===429?'Limite de requisições atingido. Espere um minuto e tente de novo.':(r.status===401||r.status===403||/API key/i.test(m))?'Chave Gemini inválida ou sem permissão. Confira nas configurações.':r.status>=500?'Os servidores do Gemini estão instáveis. Tente de novo.':`Erro ${r.status}: ${m.slice(0,120)}`);x.retry=r.status>=500;throw x}
  const c=d.candidates?.[0];
  if(d.promptFeedback?.blockReason||!c?.content?.parts?.length)throw new Error('O filtro do Google bloqueou essa imagem. Tente outra ou mude o tema.');
  let j;try{j=JSON.parse(c.content.parts.map(p=>p.text||'').join('').replace(/```json|```/g,''))}catch{throw new Error('Resposta inválida da IA. Toque em gerar de novo.')}
  const ideas=(Array.isArray(j.ideas)?j.ideas:[]).map(i=>({top:clean(i?.top),bottom:clean(i?.bottom)})).filter(i=>i.top||i.bottom);
  if(!ideas.length)throw new Error('A IA não devolveu legendas. Toque em gerar de novo.');
  return ideas;
}
function ui(on){const g=$('#gen');g.disabled=$('#more').disabled=on;clearInterval(iv);if(on){let i=0;g.innerHTML='<span class="spin"></span><span></span>';const set=()=>{g.lastChild.textContent=MSGS[i++%MSGS.length]};set();iv=setInterval(set,1400)}else g.textContent='GERAR MEMES'}
async function generate(){
  if(S.busy)return;
  if(!S.b64)return showErr('Escolha uma imagem primeiro.');
  S.busy=true;showErr('');ui(true);
  try{
    let ideas;try{ideas=await callGemini()}catch(e){if(!e.retry)throw e;await new Promise(r=>setTimeout(r,1200));ideas=await callGemini()}
    S.ideas=ideas;S.seen=[...S.seen,...ideas.map(i=>[i.top,i.bottom].filter(Boolean).join(' / '))].slice(-16);
    $('#res').hidden=false;pick(0);addHistory();$('#res').scrollIntoView({behavior:'smooth'});
  }catch(e){showErr(e.message)}finally{S.busy=false;ui(false)}
}
function ideasUI(){const el=$('#ideas');el.replaceChildren();S.ideas.forEach((it,i)=>{const b=document.createElement('button');b.textContent=[it.top,it.bottom].filter(Boolean).join(' / ');b.classList.toggle('on',i===S.cur);b.onclick=()=>pick(i);el.append(b)})}
function pick(i){S.cur=i;const it=S.ideas[i]||{top:'',bottom:''};$('#top').value=it.top;$('#bot').value=it.bottom;ideasUI();draw()}

function wrap(x,t,w){const L=[];let l='';for(const s of t.split(' ')){const n=l?l+' '+s:s;if(x.measureText(n).width>w&&l){L.push(l);l=s}else l=n}if(l)L.push(l);return L}
function lines(x,t,W,fs){x.font=FONT(fs);return t?wrap(x,t.toUpperCase(),W*.9):[]}
async function draw(){
  const img=S.img;if(!img)return;try{await document.fonts.load(FONT(40))}catch{}
  const W=1080,H=Math.round(img.naturalHeight*W/img.naturalWidth),cv=$('#cv'),x=cv.getContext('2d'),fs=Math.round(W*.085),lh=fs*1.15,pad=fs*.5,bars=S.layout==='bars';
  const T=lines(x,$('#top').value.trim(),W,fs),B=lines(x,$('#bot').value.trim(),W,fs);
  const th=T.length?T.length*lh+pad*2:0,bh=B.length?B.length*lh+pad*2:0;
  cv.width=W;cv.height=bars?H+th+bh:H;
  x.fillStyle='#000';x.fillRect(0,0,W,cv.height);x.drawImage(img,0,bars?th:0,W,H);
  x.font=FONT(fs);x.textAlign='center';x.textBaseline='top';x.lineJoin='round';
  const put=(L,y0)=>L.forEach((l,i)=>{const y=y0+i*lh;if(!bars){x.lineWidth=fs*.16;x.strokeStyle='#000';x.strokeText(l,W/2,y)}x.fillStyle='#fff';x.fillText(l,W/2,y)});
  put(T,bars?pad:pad*.6);put(B,bars?th+H+pad:H-B.length*lh-pad*.6);
}
const blob=()=>new Promise(r=>$('#cv').toBlob(r,'image/png'));
async function dl(){saveEdit();await draw();const b=await blob();if(!b)return showErr('Não foi possível gerar o PNG.');const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`MemeVision_${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function share(){saveEdit();await draw();const b=await blob();if(!b)return showErr('Não foi possível gerar a imagem.');const f=new File([b],'meme.png',{type:'image/png'});if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f],title:'MemeVision'})}catch{}}else dl()}
async function copy(){saveEdit();const t=[$('#top').value,$('#bot').value].filter(Boolean).join('\n');try{await navigator.clipboard.writeText(t);toast('Copiado!')}catch{showErr('Não consegui copiar. Selecione o texto manualmente.')}}
function speak(){const t=[$('#top').value,$('#bot').value].filter(Boolean).join('. ');if(!t||!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(t);u.lang=/portugal|tuga/i.test(S.lang)?'pt-PT':/english|inglês|ingles/i.test(S.lang)?'en-US':/español|espanhol/i.test(S.lang)?'es-ES':'pt-BR';speechSynthesis.cancel();speechSynthesis.speak(u)}

function addHistory(){S.hid=Date.now();const h=[{id:S.hid,img:S.small,top:$('#top').value,bot:$('#bot').value,ideas:S.ideas},...ls.get('mv_hist',[])].slice(0,20);while(h.length&&!ls.set('mv_hist',h))h.pop()}
function saveEdit(){const h=ls.get('mv_hist',[]),it=h.find(x=>x.id===S.hid);if(it){it.top=$('#top').value;it.bot=$('#bot').value;ls.set('mv_hist',h)}}
function openHist(){
  const h=ls.get('mv_hist',[]),el=$('#hList');el.replaceChildren();
  if(!h.length)el.textContent='Nada por aqui ainda. Gere seu primeiro meme!';
  h.forEach(it=>{const b=document.createElement('button'),i=new Image(),s=document.createElement('span');b.className='hi';i.src=it.img;s.textContent=[it.top,it.bot].filter(Boolean).join(' / ');b.append(i,s);
    b.onclick=async()=>{try{await setImage(it.img)}catch(e){return showErr(e.message)}S.ideas=it.ideas||[];S.hid=it.id;S.cur=-1;$('#res').hidden=false;$('#top').value=it.top;$('#bot').value=it.bot;ideasUI();draw();$('#dHist').close()};el.append(b)});
  $('#dHist').showModal();
}
function openSettings(){$('#kKey').value=S.key;$('#kModel').value=S.model;$('#kLang').value=S.lang;$('#dSet').showModal()}

const chips=$('#chips');
STYLES.forEach(s=>{const b=document.createElement('button');b.textContent=s;b.classList.toggle('on',s===S.style);b.onclick=()=>{S.style=s;ls.set('mv_style',s);[...chips.children].forEach(c=>c.classList.toggle('on',c===b))};chips.append(b)});
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;showErr('');try{await setImage(f);$('#res').hidden=true}catch(x){showErr(x.message)}e.target.value=''};
$('#gen').onclick=generate;$('#more').onclick=generate;
$('#top').oninput=$('#bot').oninput=draw;
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{S.layout=b.dataset.l;document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));draw()});
$('#dl').onclick=dl;$('#share').onclick=share;$('#copy').onclick=copy;$('#speak').onclick=speak;
$('#btnSet').onclick=openSettings;$('#btnHist').onclick=openHist;
$('#hClear').onclick=()=>{ls.set('mv_hist',[]);openHist()};
$('#sSave').onclick=()=>{S.key=$('#kKey').value.trim();S.model=$('#kModel').value||'gemini-2.5-flash';S.lang=$('#kLang').value.trim()||'Brasil';ls.set('mv_key',S.key);ls.set('mv_model',S.model);ls.set('mv_lang',S.lang);$('#dSet').close();toast('Salvo')};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
