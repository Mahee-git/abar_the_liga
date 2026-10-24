import {cfg,ADMINS,START,WIN_BONUS,SECOND_BONUS,MAX_SEASONS,FORMATIONS} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,setDoc,updateDoc,writeBatch,addDoc,deleteDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const fb=initializeApp(cfg),auth=getAuth(fb),db=getFirestore(fb);
const S={matches:[],arch:[],sm:{},ls:0,user:null,users:[],players:[],tab:'home',view:null,sel:null,es:false};
const $=s=>document.querySelector(s),esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const me=()=>S.users.find(u=>u.id===S.user?.uid),isAdmin=()=>ADMINS.includes(S.user?.email),pl=id=>S.players.find(p=>p.id===id),owned=uid=>S.players.filter(p=>p.owner===uid);
const season=()=>S.sm.n||1,typ=()=>S.sm.type||'league',legs=()=>S.sm.legs||1,sname=()=>S.sm.name||'The Liga Season #'+season(),A=window.A={};
const AV=['#dbe7f3','#dcece6','#efe7d9','#e5e0f0','#f0e0e0'];
const av=id=>{const u=S.users.find(x=>x.id===id);return u?`<i class="av" style="background:${AV[[...id].reduce((a,c)=>a+c.charCodeAt(0),0)%5]}">${esc((u.name[0]||'?').toUpperCase())}</i>`:''};
const nm=id=>{const u=S.users.find(x=>x.id===id);if(!u)return'?';const l=S.arch.filter(a=>a.firstId===id&&a.type!=='cup').length,c=S.arch.filter(a=>a.firstId===id&&a.type==='cup').length;
  return esc(u.name)+(l?` 🏅${l>1?'×'+l:''}`:'')+(c?` 🏆${c>1?'×'+c:''}`:'')};
const grp=id=>Object.entries(S.sm.groups||{}).find(([k,v])=>v.includes(id))?.[0];
const SL={L:'League',A:'Group A',B:'Group B',SF1:'Semi-final 1',SF2:'Semi-final 2',F:'Final'};
// ---------- auth ----------
A.login=async()=>{try{await signInWithEmailAndPassword(auth,$('#em').value,$('#pw').value)}catch(e){alert(e.message)}};
A.signup=async()=>{const em=$('#em').value,pw=$('#pw').value;S.pn=$('#nm').value||em.split('@')[0];try{await createUserWithEmailAndPassword(auth,em,pw)}catch(e){alert(e.message)}};
A.out=()=>signOut(auth);
onAuthStateChanged(auth,u=>{S.user=u;if(u)listen();render()});
let on=false;function listen(){if(on)return;on=true;
  onSnapshot(collection(db,'users'),s=>{S.users=s.docs.map(d=>({id:d.id,...d.data()}));
    if(S.user&&!s.metadata.fromCache&&!me()&&!S.mk){S.mk=1;setDoc(doc(db,'users',S.user.uid),{name:S.pn||S.user.email.split('@')[0],email:S.user.email,balance:START,lineup:[],formation:'4-3-3'})}render()});
  onSnapshot(collection(db,'players'),s=>{S.players=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name));render()});
  onSnapshot(collection(db,'matches'),s=>{S.matches=s.docs.map(d=>({id:d.id,...d.data()}));render()});
  onSnapshot(collection(db,'archive'),s=>{S.arch=s.docs.map(d=>d.data()).sort((a,b)=>b.n-a.n);render()});
  onSnapshot(doc(db,'meta','season'),s=>{S.sm=s.data()||{};render()});}
// ---------- finance ----------
A.search=v=>{S.apq=v;S.apid='';const q=v.toLowerCase().trim(),r=q?S.players.filter(p=>!p.owner&&p.name.toLowerCase().includes(q)).slice(0,10):[];
  $('#res').innerHTML=r.map(p=>`<div class="opt" onclick="A.choose('${p.id}')"><span>${esc(p.name)}</span><span class="mu">${esc(p.pos)} · base ${p.base??0}M</span></div>`).join('')||(q?'<div class="opt mu">No available player found</div>':'')};
A.choose=id=>{const p=pl(id);S.apid=id;S.apq=p.name;$('#q').value=p.name;$('#res').innerHTML='';$('#pr').value=p.base??0;A.tot()};
A.tot=()=>{const t=(+$('#pr').value||0)*(+$('#yrs').value||1);$('#tot').textContent='Total deduction: '+t+'M'};
A.assign=async()=>{const pid=S.apid,uid=$('#ow').value,pr=+$('#pr').value,yrs=+$('#yrs').value,u=S.users.find(x=>x.id===uid),total=pr*yrs;
  if(!pid||!u||!(pr>=0))return alert('Search and pick a player, owner and price');if(total>u.balance)return alert('Not enough balance: needs '+total+'M, has '+u.balance+'M');
  const b=writeBatch(db);b.update(doc(db,'players',pid),{owner:uid,price:pr,left:yrs});b.update(doc(db,'users',uid),{balance:u.balance-total});await b.commit();S.apid='';S.apq=''};
A.release=async(pid,refund)=>{const p=pl(pid),u=S.users.find(x=>x.id===p.owner),b=writeBatch(db);
  b.update(doc(db,'players',pid),{owner:null,price:0,left:0});if(refund&&u)b.update(doc(db,'users',u.id),{balance:u.balance+p.price*p.left});await b.commit()};
A.importCsv=async()=>{const rows=$('#csv').value.split('\n').map(r=>r.split(',').map(x=>x.trim())).filter(r=>r[0]&&r[0].toLowerCase()!=='name');
  for(let i=0;i<rows.length;i+=400){const b=writeBatch(db);rows.slice(i,i+400).forEach(([n,pos,base])=>{const id=n.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    b.set(doc(db,'players',id),{name:n,pos:pos||'',base:+base||0,...(S.players.some(x=>x.id===id)?{}:{owner:null,price:0,left:0})},{merge:true})});await b.commit()}alert(rows.length+' players imported')};
// ---------- matches & competition logic ----------
A.submit=async()=>{const o=$('#op').value,a=$('#ms').value,c=$('#os').value;let st=$('#st')?.value||'L';if(st==='G')st=grp(S.user.uid);
  if(!o||a===''||c===''||!st)return alert('Fill all fields (cup group stage needs you in a group)');const w=$('#pw2')?.value;
  await addDoc(collection(db,'matches'),{season:season(),stage:st,home:S.user.uid,away:o,hs:+a,as:+c,pw:w==='me'?S.user.uid:w==='opp'?o:'',status:'pending',by:S.user.uid,ts:Date.now()});alert('Sent to admin for approval')};
A.adminMatch=async()=>{const h=$('#mh').value,a=$('#ma').value;let st=$('#mst').value;if(st==='G')st=grp(h);if(h===a||$('#mhs').value===''||$('#mas').value===''||!st)return alert('Check fields');
  await addDoc(collection(db,'matches'),{season:season(),stage:st,home:h,away:a,hs:+$('#mhs').value,as:+$('#mas').value,pw:'',status:'approved',by:S.user.uid,ts:Date.now()})};
A.approve=id=>updateDoc(doc(db,'matches',id),{status:'approved'});
A.del=id=>confirm('Delete this match?')&&deleteDoc(doc(db,'matches',id));
A.ls=v=>{S.ls=v;render()};A.open=n=>{S.ls=n;S.tab='league';scrollTo(0,0);render()};
const table=(s,st='L',ids)=>{const t={};S.users.filter(u=>!ids||ids.includes(u.id)).forEach(u=>t[u.id]={n:u.name,P:0,W:0,D:0,L:0,F:0,A:0,Pts:0});
  S.matches.filter(m=>m.season===s&&(m.stage||'L')===st&&m.status==='approved').forEach(m=>{const h=t[m.home],a=t[m.away];if(!h||!a)return;h.P++;a.P++;h.F+=m.hs;h.A+=m.as;a.F+=m.as;a.A+=m.hs;
    if(m.hs>m.as){h.W++;a.L++;h.Pts+=3}else if(m.hs<m.as){a.W++;h.L++;a.Pts+=3}else{h.D++;a.D++;h.Pts++;a.Pts++}});
  return Object.entries(t).map(([id,x])=>({id,...x})).sort((a,b)=>b.Pts-a.Pts||(b.F-b.A)-(a.F-a.A)||b.F-a.F)};
const agg=(s,st,x,y)=>{if(!x||!y)return null;const ms=S.matches.filter(m=>m.season===s&&m.stage===st&&m.status==='approved'&&((m.home===x&&m.away===y)||(m.home===y&&m.away===x))).sort((a,b)=>a.ts-b.ts);
  if(!ms.length)return null;let gx=0,gy=0;ms.forEach(m=>{const h=m.home===x;gx+=h?m.hs:m.as;gy+=h?m.as:m.hs});return{gx,gy,n:ms.length,pw:ms[ms.length-1].pw}};
const tie=(s,st,x,y)=>{const a=agg(s,st,x,y);if(!a||a.n<(st==='F'?1:legs()))return null;return a.gx>a.gy?x:a.gy>a.gx?y:(a.pw||null)};
const bracket=s=>{const g=S.sm.groups||{},tA=table(s,'A',g.A||[]),tB=table(s,'B',g.B||[]),s1=[tA[0]?.id,tB[1]?.id],s2=[tB[0]?.id,tA[1]?.id],w1=tie(s,'SF1',...s1),w2=tie(s,'SF2',...s2);
  return{tA,tB,s1,s2,w1,w2,wf:tie(s,'F',w1,w2)}};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const draw=()=>{const u=shuffle(S.users.map(x=>x.id)),h=Math.ceil(u.length/2);return{A:u.slice(0,h),B:u.slice(h)}};
// ---------- admin: season settings ----------
A.saveSet=()=>setDoc(doc(db,'meta','season'),{n:season(),name:$('#sn').value||sname(),type:$('#stp').value,legs:+$('#slg').value},{merge:true});
A.draw=()=>setDoc(doc(db,'meta','season'),{n:season(),groups:draw()},{merge:true});
A.setGrp=(uid,v)=>{const g={A:(S.sm.groups?.A||[]).filter(x=>x!==uid),B:(S.sm.groups?.B||[]).filter(x=>x!==uid)};if(v)g[v].push(uid);return setDoc(doc(db,'meta','season'),{n:season(),groups:g},{merge:true})};
A.esOpen=()=>{S.es=true;render()};A.esCancel=()=>{S.es=false;render()};
A.endSeason=async()=>{const n=season();let w,s,tb;
  if(typ()==='cup'){const b=bracket(n);if(!b.wf)return alert('The final has no decided winner yet.');w=b.wf;s=[b.w1,b.w2].find(x=>x!==w);tb=[...b.tA,...b.tB]}
  else{const t=table(n,'L');if(t.length<2||!S.matches.some(m=>m.season===n&&(m.stage||'L')==='L'&&m.status==='approved'))return alert('No approved results yet, so there is no champion.');w=t[0].id;s=t[1].id;tb=t}
  if(!s)return alert('Could not determine the runner-up.');
  const nt=$('#nt').value,nl=+$('#nl').value,nn=n+1,name=nt==='cup'?'The Liga Super Cup Season #'+nn:'The Liga Season #'+nn,N=id=>S.users.find(u=>u.id===id)?.name;
  if(!confirm('End '+sname()+'?\n\nChampion: '+N(w)+' (+'+WIN_BONUS+'M)\nRunner-up: '+N(s)+' (+'+SECOND_BONUS+'M)\n\nNext: '+name+' ('+(nt==='cup'?'cup':'league')+', '+nl+' leg'+(nl>1?'s':'')+')'))return;
  const b=writeBatch(db),sq={};S.users.forEach(u=>sq[u.name]=owned(u.id).map(p=>p.name));
  b.set(doc(db,'archive',String(n)),{n,name:sname(),type:typ(),legs:legs(),firstId:w,secondId:s,first:N(w),second:N(s),table:tb,squads:sq,ts:Date.now()});
  S.users.forEach(u=>b.update(doc(db,'users',u.id),{balance:u.balance+START+(u.id===w?WIN_BONUS:u.id===s?SECOND_BONUS:0)}));
  S.players.filter(p=>p.owner).forEach(p=>p.left-1<=0?b.update(doc(db,'players',p.id),{owner:null,price:0,left:0}):b.update(doc(db,'players',p.id),{left:p.left-1}));
  b.set(doc(db,'meta','season'),{n:nn,name,type:nt,legs:nl,groups:nt==='cup'?draw():{}});S.es=false;await b.commit()};
// ---------- squad ----------
A.pick=id=>{S.sel=S.sel===id?null:id;render()};
A.place=async i=>{if(S.view)return;const m=me(),id=S.sel,l=[...(m.lineup||[])];while(l.length<11)l.push(null);
  if(!id){if(l[i]){l[i]=null;await updateDoc(doc(db,'users',m.id),{lineup:l})}return}
  const old=l.indexOf(id);if(old>-1)l[old]=l[i];l[i]=id;S.sel=null;await updateDoc(doc(db,'users',m.id),{lineup:l})};
A.setFm=async f=>{if(S.view)return;await updateDoc(doc(db,'users',me().id),{formation:f})};
A.drag=(e,id)=>{e.dataTransfer.setData('t',id)};A.drop=(e,i)=>{e.preventDefault();S.sel=e.dataTransfer.getData('t');A.place(i)};
A.view=id=>{S.view=id===S.user.uid?null:id;S.tab='home';scrollTo(0,0);render()};
A.copy=()=>{navigator.clipboard.writeText(S.players.filter(p=>!p.owner).map(p=>[p.name,p.pos,p.base??0].join(',')).join('\n'));alert('Pool copied')};
A.tab=t=>{S.tab=t;if(t!=='home')S.view=null;if(t!=='league')S.ls=0;S.es=false;render()};
// ---------- views ----------
const tbl=(t,q=0)=>`<table><tr><th>#</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF/GA</th><th>GD</th><th>Pts</th></tr>${t.map((r,i)=>`<tr class="${i<q?'q':''}"><td>${i+1}</td><td class="pn">${av(r.id)}${S.users.some(u=>u.id===r.id)?nm(r.id):esc(r.n)}${i<q?'<span class="tag">Qualified</span>':''}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.F}/${r.A}</td><td>${r.F-r.A>0?'+':''}${r.F-r.A}</td><td><b>${r.Pts}</b></td></tr>`).join('')}</table>`;
const stOpts=()=>typ()==='cup'?'<option value="G">Group stage</option><option value="SF1">Semi-final 1</option><option value="SF2">Semi-final 2</option><option value="F">Final</option>':'<option value="L">League</option>';
function squadView(){const u=S.view?S.users.find(x=>x.id===S.view):me();if(!u)return'';const ro=!!S.view,f=u.formation||'4-3-3',l=u.lineup||[];let i=0;
  const pitch=FORMATIONS[f].map(r=>`<div class="line">${r.map(pos=>{const k=i++,p=pl(l[k]);return`<div class="slot ${p?'f':''}" ${ro?'':`ondragover="event.preventDefault()" ondrop="A.drop(event,${k})" onclick="A.place(${k})"`}>${p?`<b>${esc(p.name)}</b>${esc(p.pos)}`:pos}</div>`}).join('')}</div>`).join('');
  const bench=owned(u.id).filter(p=>!l.includes(p.id));
  return`<div class="sec"><h2>${ro?esc(u.name)+"'s squad":'My squad'}</h2>${ro?'<button onclick="A.view(S_ME)">← Back to my squad</button>'.replace('S_ME',"'"+S.user.uid+"'"):''}</div><div class="sq"><div class="card"><select ${ro?'disabled':''} onchange="A.setFm(this.value)">${Object.keys(FORMATIONS).map(x=>`<option ${x===f?'selected':''}>${x}</option>`).join('')}</select><div class="pitch">${pitch}</div>${ro?'':'<p class="mu">Drag players onto the pitch, or tap a player then a slot. Tap a filled slot to send the player back to the list.</p>'}</div>
  <div class="card"><b>Not in lineup (${bench.length})</b>${bench.map(p=>`<div class="chip ${S.sel===p.id?'sel':''}" ${ro?'':`draggable="true" ondragstart="A.drag(event,'${p.id}')" onclick="A.pick('${p.id}')"`}><b>${esc(p.name)}</b> · ${esc(p.pos)}<br><span class="mu">${p.price}M/season · ${p.left} season${p.left>1?'s':''} left</span></div>`).join('')||'<p class="mu">'+(owned(u.id).length?'Everyone is in the lineup.':'No players yet')+'</p>'}</div></div>`}
function homeView(){const m=me(),n=S.matches.filter(x=>x.season===season()&&x.status==='approved').length;
  return`<div class="hero"><div><div class="eyebrow">Current competition</div><h1>${esc(sname())}</h1><div class="chips"><span>${typ()==='cup'?'Cup · groups + knockouts':'League'}</span><span>${legs()===2?'Two legs':'Single leg'}</span><span>${S.users.length} players</span></div></div>
  <div class="hst"><div><small>Your balance</small><b>${m?.balance??0}M</b></div><div><small>Squad</small><b>${owned(S.user.uid).length}</b></div><div><small>Matches played</small><b>${n}</b></div></div></div>
  ${squadView()}<div class="sec"><h2>Everyone</h2></div><div class="card"><table><tr><th>Player</th><th>Balance</th><th>Squad</th><th></th></tr>${S.users.map(u=>`<tr><td class="pn">${av(u.id)}${nm(u.id)}</td><td>${u.balance}M</td><td>${owned(u.id).length}</td><td><button onclick="A.view('${u.id}')">View squad</button></td></tr>`).join('')}</table></div>`}
const tm=(id,sc,win)=>`<div class="tm ${win?'win':''} ${id?'':'tbd'}"><span class="pn">${id?av(id)+nm(id):'To be decided'}</span><b>${sc??''}</b></div>`;
function tieC(title,st,[x,y],w,s){const a=agg(s,st,x,y);return`<div class="tie"><div class="tl">${title}</div>${tm(x,a?.gx,w&&w===x)}${tm(y,a?.gy,w&&w===y)}${a&&a.gx===a.gy&&w?'<div class="mu">Won on penalties</div>':''}</div>`}
function bracketUI(s){const b=bracket(s),g=S.sm.groups||{};
  return`<div class="br"><div class="card"><h3>Group A</h3>${tbl(b.tA,2)}</div>
  <div class="mid"><div class="rnd">Semi-finals</div>${tieC('Semi-final 1 · A1 v B2','SF1',b.s1,b.w1,s)}${tieC('Semi-final 2 · B1 v A2','SF2',b.s2,b.w2,s)}<div class="arrow">↓</div><div class="rnd">Final</div>${tieC('Final','F',[b.w1,b.w2],b.wf,s)}
  <div class="champ">${b.wf?'🏆 '+av(b.wf)+nm(b.wf):'🏆 Champion to be decided'}</div></div>
  <div class="card"><h3>Group B</h3>${tbl(b.tB,2)}</div></div>`}
function fixtures(){const sets=typ()==='cup'?Object.entries(S.sm.groups||{}).map(([k,v])=>[k,v]):[['L',S.users.map(u=>u.id)]],rows=[];
  sets.forEach(([st,ids])=>{for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const n=S.matches.filter(m=>m.season===season()&&(m.stage||'L')===st&&m.status==='approved'&&((m.home===ids[i]&&m.away===ids[j])||(m.home===ids[j]&&m.away===ids[i]))).length;
    rows.push(`<tr><td>${st==='L'?'':SL[st]}</td><td>${nm(ids[i])} v ${nm(ids[j])}</td><td><span class="badge ${n>=legs()?'ok':''}">${n>=legs()?'Completed':n+' of '+legs()+' played'}</span></td></tr>`)}});
  return rows.length?`<div class="card"><b>Fixtures <span class="mu">· play in any order, any time</span></b><table>${rows.join('')}</table></div>`:''}
function leagueView(){const s=S.ls||season(),cur=s===season(),at=S.arch.find(a=>a.n===s),cup=cur?typ()==='cup':at?.type==='cup';
  const ms=S.matches.filter(m=>m.season===s&&m.status==='approved').sort((a,b)=>b.ts-a.ts),pend=S.matches.filter(m=>m.status==='pending'&&m.by===S.user.uid);
  const top=cup?(cur?bracketUI(s):`<div class="card"><h3>Group stage final standings</h3>${tbl(at.table)}</div>`):`<div class="card">${tbl(table(s,'L'))}</div>`;
  return`<select onchange="A.ls(+this.value)">${[...Array(season())].map((_,i)=>`<option value="${i+1}" ${i+1===s?'selected':''}>${i+1===season()?sname():S.arch.find(a=>a.n===i+1)?.name||'Season '+(i+1)}</option>`).join('')}</select><div style="height:16px"></div>${top}${cur?fixtures():''}
  <div class="card"><b>Results</b><table>${ms.map(m=>`<tr><td>${nm(m.home)}</td><td><b>${m.hs} - ${m.as}</b></td><td>${nm(m.away)}</td><td class="mu">${SL[m.stage||'L']}</td></tr>`).join('')||'<tr><td class="mu">No approved matches yet</td></tr>'}</table></div>
  ${cur?`<div class="card"><b>Submit your result <span class="mu">· admin must approve</span></b><div class="row">${typ()==='cup'?'<select id="st">'+stOpts()+'</select>':''}<select id="op">${S.users.filter(u=>u.id!==S.user.uid).map(u=>`<option value="${u.id}">vs ${esc(u.name)}</option>`).join('')}</select><input id="ms" type="number" min="0" placeholder="Your goals"><input id="os" type="number" min="0" placeholder="Their goals">${typ()==='cup'?'<select id="pw2"><option value="">No penalties</option><option value="me">I won on penalties</option><option value="opp">They won on penalties</option></select>':''}<button class="p" onclick="A.submit()">Submit</button></div>
  ${pend.length?'<p class="mu">Awaiting approval: '+pend.map(m=>`<span class="badge">${nm(m.home)} ${m.hs}-${m.as} ${nm(m.away)}</span>`).join(' ')+'</p>':''}</div>`:''}`}
const winners=t=>{const a=S.arch.filter(x=>t==='cup'?x.type==='cup':x.type!=='cup'),c={};a.forEach(x=>c[x.firstId]=(c[x.firstId]||0)+1);const ic=t==='cup'?'🏆':'🏅';
  return a.length?`<div class="card"><b>Most titles</b><table>${Object.entries(c).sort((x,y)=>y[1]-x[1]).map(([id,n])=>`<tr><td class="pn">${av(id)}${nm(id)}</td><td>${ic.repeat(Math.min(n,6))} <b>${n}</b></td></tr>`).join('')}</table></div>
  <div class="card"><b>Honours</b><table><tr><th>Season</th><th>Winner</th><th>Runner-up</th></tr>${a.map(x=>`<tr><td>${esc(x.name||'Season '+x.n)}</td><td class="pn">${ic} ${av(x.firstId)}${esc(x.first)}</td><td>${esc(x.second)}</td></tr>`).join('')}</table></div>`:'<div class="card mu">No '+(t==='cup'?'cup':'league')+' winners yet. Finished seasons will appear here.</div>'};
function archiveView(){return S.arch.map(a=>`<div class="card"><h3>${esc(a.name||'Season '+a.n)} · ${a.type==='cup'?'🏆':'🏅'} ${esc(a.first)} · runner-up ${esc(a.second)}</h3>${tbl(a.table)}<button onclick="A.open(${a.n})">View matches</button>
  <details><summary class="mu">Squads that season</summary>${Object.entries(a.squads||{}).map(([u,l])=>`<p><b>${esc(u)}:</b> ${l.map(esc).join(', ')||'-'}</p>`).join('')}</details></div>`).join('')||'<div class="card mu">No finished seasons yet</div>'}
function poolView(){const pool=S.players.filter(p=>!p.owner);return`<div class="card"><div class="row"><div><b>${pool.length} players available</b><div class="mu">Base price shown per season</div></div><button class="p" onclick="A.copy()">Copy available pool</button></div></div><div class="card"><table><tr><th>Player</th><th>Pos</th><th>Base</th></tr>${pool.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.pos)}</td><td>${p.base??0}M</td></tr>`).join('')}</table></div>
  <div class="card"><b>Multi-season contracts</b><table>${S.players.filter(p=>p.owner&&p.left>1).map(p=>`<tr><td>${esc(p.name)}</td><td>${nm(p.owner)}</td><td>${p.left} seasons left</td></tr>`).join('')||'<tr><td class="mu">None</td></tr>'}</table></div>`}
function adminView(){const us=S.users.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join(''),pend=S.matches.filter(m=>m.status==='pending'),g=S.sm.groups||{},ty=typ(),lg=legs();
  const sel=(v,o)=>o.map(([k,l])=>`<option value="${k}" ${k==v?'selected':''}>${l}</option>`).join('');
  return`<div class="card"><b>Log auction result</b><div class="row"><div class="sel"><input id="q" value="${esc(S.apq||'')}" oninput="A.search(this.value)" autocomplete="off" placeholder="Search player name…"><div id="res" class="res"></div></div>
  <select id="ow">${us}</select><input id="pr" type="number" min="0" placeholder="Price per season (M)" oninput="A.tot()"><select id="yrs" onchange="A.tot()">${[...Array(MAX_SEASONS)].map((_,i)=>`<option value="${i+1}">${i+1} season${i?'s':''}</option>`).join('')}</select><button class="p" onclick="A.assign()">Assign &amp; deduct</button></div><p class="mu" id="tot">Total deduction: price × seasons</p></div>
  <div class="card"><b>Pending results (${pend.length})</b><table>${pend.map(m=>`<tr><td>${nm(m.home)} <b>${m.hs}-${m.as}</b> ${nm(m.away)}</td><td class="mu">${SL[m.stage||'L']}</td><td><button class="p" onclick="A.approve('${m.id}')">Approve</button> <button onclick="A.del('${m.id}')">Reject</button></td></tr>`).join('')||'<tr><td class="mu">Nothing waiting</td></tr>'}</table></div>
  <div class="card"><b>Add result directly</b><div class="row"><select id="mst">${stOpts()}</select><select id="mh">${us}</select><input id="mhs" type="number" min="0" placeholder="Goals"><input id="mas" type="number" min="0" placeholder="Goals"><select id="ma">${us}</select><button class="p" onclick="A.adminMatch()">Add</button></div>
  <details><summary class="mu">Delete a match</summary><table>${S.matches.filter(m=>m.season===season()).map(m=>`<tr><td>${nm(m.home)} ${m.hs}-${m.as} ${nm(m.away)} (${SL[m.stage||'L']}, ${m.status})</td><td><button onclick="A.del('${m.id}')">Delete</button></td></tr>`).join('')}</table></details></div>
  <div class="card"><b>Season settings</b><div class="row"><input id="sn" value="${esc(sname())}" placeholder="Season / cup name"><select id="stp">${sel(ty,[['league','League'],['cup','Cup (2 groups + knockouts)']])}</select><select id="slg">${sel(lg,[[1,'Single leg'],[2,'Two legs']])}</select><button class="p" onclick="A.saveSet()">Save</button></div>
  ${ty==='cup'?`<div class="row" style="margin-top:12px"><button onclick="A.draw()">Draw groups randomly</button></div><table>${S.users.map(u=>`<tr><td>${esc(u.name)}</td><td><select onchange="A.setGrp('${u.id}',this.value)"><option value="">No group</option><option value="A" ${g.A?.includes(u.id)?'selected':''}>Group A</option><option value="B" ${g.B?.includes(u.id)?'selected':''}>Group B</option></select></td></tr>`).join('')}</table>`:''}</div>
  <div class="card"><b>Owned players</b><table>${S.players.filter(p=>p.owner).map(p=>`<tr><td>${esc(p.name)}</td><td>${nm(p.owner)}</td><td>${p.price}M × ${p.left}</td><td><button onclick="A.release('${p.id}',confirm('Refund remaining seasons (${p.price*p.left}M) to the owner? OK = yes'))">Release</button></td></tr>`).join('')}</table></div>
  <div class="card"><b>Import players (name, position, base price in M)</b><textarea id="csv" rows="5" placeholder="Messi,RWF,5"></textarea><div style="height:10px"></div><button class="p" onclick="A.importCsv()">Import</button></div>
  <div class="card"><b>End season</b><p class="mu">The champion and runner-up are worked out automatically (league table, or the cup final). Everything is archived.</p>
  ${S.es?`<div class="row"><select id="nt"><option value="league">Next: League</option><option value="cup">Next: Cup (random 2 groups)</option></select><select id="nl"><option value="1">Single leg</option><option value="2">Two legs</option></select><button class="p" onclick="A.endSeason()">Confirm &amp; start next</button><button onclick="A.esCancel()">Cancel</button></div>`:'<button class="p" onclick="A.esOpen()">End season &amp; start next</button>'}</div>`}
function render(){const nav=$('#nav'),app=$('#app');
  if(!S.user){nav.innerHTML='';$('#who').innerHTML='';app.innerHTML=`<div class="card auth"><h2>Welcome to Abar The Liga</h2><p class="mu">Log in, or sign up with a display name, email and password.</p><input id="nm" placeholder="Display name (sign up only)"><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><div class="row"><button class="p" onclick="A.login()">Login</button><button onclick="A.signup()">Sign up</button></div></div>`;return}
  const T=[['home','Home'],['league','League'],['pool','Pool'],['lw','League Winners'],['cw','Cup Winners'],['archive','Archive'],...(isAdmin()?[['admin','Admin']]:[])];
  nav.innerHTML=T.map(([k,n])=>`<button class="${S.tab===k?'on':''}" onclick="A.tab('${k}')">${n}</button>`).join('');
  $('#who').innerHTML=`<span class="uname">${esc(me()?.name||'')}</span><button onclick="A.out()">Log out</button>`;
  const ae=document.activeElement?.id;if(ae&&['q','csv','pr','ms','os','mhs','mas','sn'].includes(ae))return;
  const TT={league:'League & fixtures',pool:'Player pool',lw:'League winners 🏅',cw:'Cup winners 🏆',archive:'Archive',admin:'Administration'};
  app.innerHTML=(S.tab==='home'?'':`<h1 class="pt">${TT[S.tab]}</h1>`)+{home:homeView,league:leagueView,pool:poolView,lw:()=>winners('league'),cw:()=>winners('cup'),archive:archiveView,admin:adminView}[S.tab]();}
render();
