import {cfg,ADMINS,START,WIN_BONUS,SECOND_BONUS,MAX_SEASONS,MIN_STEP,FORMATIONS} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,setDoc,updateDoc,writeBatch,runTransaction,addDoc,deleteDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const fb=initializeApp(cfg),auth=getAuth(fb),db=getFirestore(fb);
const S={matches:[],arch:[],ls:0,user:null,users:[],players:[],auc:{},season:1,tab:'home',view:null,sel:null,fm:null};
const $=s=>document.querySelector(s),esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const me=()=>S.users.find(u=>u.id===S.user?.uid), isAdmin=()=>ADMINS.includes(S.user?.email);
const pl=id=>S.players.find(p=>p.id===id), owned=uid=>S.players.filter(p=>p.owner===uid);
const A=window.A={};
// ---------- auth ----------
A.login=async()=>{try{await signInWithEmailAndPassword(auth,$('#em').value,$('#pw').value)}catch(e){alert(e.message)}};
A.signup=async()=>{const em=$('#em').value,pw=$('#pw').value;S.pn=$('#nm').value||em.split('@')[0];try{await createUserWithEmailAndPassword(auth,em,pw)}catch(e){alert(e.message)}};
A.out=()=>signOut(auth);
onAuthStateChanged(auth,u=>{S.user=u;if(u)listen();render()});
let on=false;function listen(){if(on)return;on=true;
  onSnapshot(collection(db,'users'),s=>{S.users=s.docs.map(d=>({id:d.id,...d.data()}));
    if(S.user&&!s.metadata.fromCache&&!me()&&!S.mk){S.mk=1;setDoc(doc(db,'users',S.user.uid),{name:S.pn||S.user.email.split('@')[0],email:S.user.email,balance:START,lineup:[],formation:'4-3-3'})}render()});
  onSnapshot(collection(db,'players'),s=>{S.players=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name));render()});
  onSnapshot(doc(db,'auction','current'),s=>{S.auc=s.data()||{};render()});
  onSnapshot(collection(db,'matches'),s=>{S.matches=s.docs.map(d=>({id:d.id,...d.data()}));render()});
  onSnapshot(collection(db,'archive'),s=>{S.arch=s.docs.map(d=>d.data()).sort((a,b)=>b.n-a.n);render()});
  onSnapshot(doc(db,'meta','season'),s=>{S.season=s.data()?.n||1;render()});}
// ---------- finance (admin logs auction results from Discord) ----------
A.assign=async()=>{const pid=S.apid,uid=$('#ow').value,pr=+$('#pr').value,yrs=+$('#yrs').value,u=S.users.find(x=>x.id===uid);
  if(!pid||!u||!(pr>=0))return alert('Fill all fields');if(pr>u.balance)return alert('Not enough balance');
  const b=writeBatch(db);b.update(doc(db,'players',pid),{owner:uid,price:pr,left:yrs});b.update(doc(db,'users',uid),{balance:u.balance-pr});await b.commit();S.apid='';S.apq=''};
A.release=async(pid,refund)=>{const p=pl(pid),u=S.users.find(x=>x.id===p.owner),b=writeBatch(db);
  b.update(doc(db,'players',pid),{owner:null,price:0,left:0});if(refund&&u)b.update(doc(db,'users',u.id),{balance:u.balance+p.price});await b.commit()};
// ---------- matches ----------
A.submit=async()=>{const o=$('#op').value,a=$('#ms').value,c=$('#os').value;if(!o||a===''||c==='')return alert('Fill scores');
  await addDoc(collection(db,'matches'),{season:S.season,home:S.user.uid,away:o,hs:+a,as:+c,status:'pending',by:S.user.uid,ts:Date.now()});alert('Sent to admin for approval')};
A.adminMatch=async()=>{const h=$('#mh').value,a=$('#ma').value;if(h===a||$('#mhs').value===''||$('#mas').value==='')return alert('Check fields');
  await addDoc(collection(db,'matches'),{season:S.season,home:h,away:a,hs:+$('#mhs').value,as:+$('#mas').value,status:'approved',by:S.user.uid,ts:Date.now()})};
A.approve=id=>updateDoc(doc(db,'matches',id),{status:'approved'});
A.del=id=>confirm('Delete this match?')&&deleteDoc(doc(db,'matches',id));
A.ls=v=>{S.ls=v;render()};A.open=n=>{S.ls=n;S.tab='league';render()};
const table=s=>{const t={};S.users.forEach(u=>t[u.id]={n:u.name,P:0,W:0,D:0,L:0,F:0,A:0,Pts:0});
  S.matches.filter(m=>m.season===s&&m.status==='approved').forEach(m=>{const h=t[m.home],a=t[m.away];if(!h||!a)return;h.P++;a.P++;h.F+=m.hs;h.A+=m.as;a.F+=m.as;a.A+=m.hs;
    if(m.hs>m.as){h.W++;a.L++;h.Pts+=3}else if(m.hs<m.as){a.W++;h.L++;a.Pts+=3}else{h.D++;a.D++;h.Pts++;a.Pts++}});
  return Object.entries(t).map(([id,x])=>({id,...x})).sort((a,b)=>b.Pts-a.Pts||(b.F-b.A)-(a.F-a.A)||b.F-a.F)};
// ---------- admin ----------
A.importCsv=async()=>{const rows=$('#csv').value.split('\n').map(r=>r.split(',').map(x=>x.trim())).filter(r=>r[0]&&r[0].toLowerCase()!=='name');
  for(let i=0;i<rows.length;i+=400){const b=writeBatch(db);rows.slice(i,i+400).forEach(([n,pos,base])=>{const id=n.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    b.set(doc(db,'players',id),{name:n,pos:pos||'',base:+base||0,...(S.players.some(x=>x.id===id)?{}:{owner:null,price:0,left:0})},{merge:true})});await b.commit()}alert(rows.length+' players imported')};
A.search=v=>{S.apq=v;S.apid='';const q=v.toLowerCase().trim(),r=q?S.players.filter(p=>!p.owner&&p.name.toLowerCase().includes(q)).slice(0,8):[];
  $('#res').innerHTML=r.map(p=>`<div class="opt" onclick="A.choose('${p.id}')"><span>${esc(p.name)}</span><span class="mu">${esc(p.pos)} · ${p.base??0}M</span></div>`).join('')||(q?'<div class="opt mu">No available player found</div>':'')};
A.choose=id=>{const p=pl(id);S.apid=id;S.apq=p.name;$('#q').value=p.name;$('#res').innerHTML='';$('#pr').value=p.base??0};
A.endSeason=async()=>{const t=table(S.season);if(t.length<2||!S.matches.some(m=>m.season===S.season&&m.status==='approved'))return alert('No approved results yet, so there is no champion.');
  const w=t[0].id,s=t[1].id;if(!confirm('End season '+S.season+'?\n\nChampion: '+t[0].n+' (+'+WIN_BONUS+'M)\nRunner-up: '+t[1].n+' (+'+SECOND_BONUS+'M)\n\nEveryone gets +'+START+'M and a new season starts.'))return;
  const nm=id=>S.users.find(u=>u.id===id)?.name,b=writeBatch(db),sq={};S.users.forEach(u=>sq[u.name]=owned(u.id).map(p=>p.name));
  b.set(doc(db,'archive',String(S.season)),{n:S.season,first:nm(w),second:nm(s),table:table(S.season),squads:sq,ts:Date.now()});
  S.users.forEach(u=>b.update(doc(db,'users',u.id),{balance:u.balance+START+(u.id===w?WIN_BONUS:u.id===s?SECOND_BONUS:0)}));
  S.players.filter(p=>p.owner).forEach(p=>p.left-1<=0?b.update(doc(db,'players',p.id),{owner:null,price:0,left:0}):b.update(doc(db,'players',p.id),{left:p.left-1}));
  b.set(doc(db,'meta','season'),{n:S.season+1});await b.commit()};
// ---------- squad ----------
const slots=f=>FORMATIONS[f].flat();
A.pick=id=>{S.sel=S.sel===id?null:id;render()};
A.place=async i=>{const m=me(),id=S.sel;if(!id||S.view)return;const l=[...(m.lineup||[])];while(l.length<11)l.push(null);
  const old=l.indexOf(id);if(old>-1)l[old]=l[i];l[i]=id;S.sel=null;await updateDoc(doc(db,'users',m.id),{lineup:l})};
A.clear=async i=>{const m=me();if(S.view)return;const l=[...m.lineup];l[i]=null;await updateDoc(doc(db,'users',m.id),{lineup:l})};
A.setFm=async f=>{if(S.view)return;await updateDoc(doc(db,'users',me().id),{formation:f})};
A.drag=(e,id)=>{e.dataTransfer.setData('t',id)};A.drop=(e,i)=>{e.preventDefault();S.sel=e.dataTransfer.getData('t');A.place(i)};
A.view=id=>{S.view=id===S.user.uid?null:id;S.tab='squad';render()};
A.copy=()=>{navigator.clipboard.writeText(S.players.filter(p=>!p.owner).map(p=>[p.name,p.pos,p.base??0].join(',')).join('\n'));alert('Pool copied')};
A.tab=t=>{S.tab=t;if(t!=='squad')S.view=null;if(t!=='league')S.ls=0;render()};
// ---------- views ----------
function squadView(){const u=S.view?S.users.find(x=>x.id===S.view):me();if(!u)return'';const ro=!!S.view,f=u.formation||'4-3-3',l=u.lineup||[];let i=0;
  const pitch=FORMATIONS[f].map(r=>`<div class="line">${r.map(pos=>{const k=i++,p=pl(l[k]);return`<div class="slot ${p?'f':''}" ${ro?'':`ondragover="event.preventDefault()" ondrop="A.drop(event,${k})" onclick="A.place(${k})" ondblclick="A.clear(${k})"`}>${p?`<b>${esc(p.name)}</b>${p.base??0}M`:pos}</div>`}).join('')}</div>`).join('');
  const mine=owned(u.id);
  return`<h2>${esc(u.name)}'s squad ${ro?'<span class="mu">(public view)</span>':''}</h2><div class="sq"><div><select ${ro?'disabled':''} onchange="A.setFm(this.value)">${Object.keys(FORMATIONS).map(x=>`<option ${x===f?'selected':''}>${x}</option>`).join('')}</select><div class="pitch">${pitch}</div>${ro?'':'<p class="mu">Drag a player onto a slot (or tap player, then slot). Double-click a slot to clear.</p>'}</div>
  <div class="card"><b>Players (${mine.length})</b>${mine.map(p=>`<div class="chip ${S.sel===p.id?'sel':''}" ${ro?'':`draggable="true" ondragstart="A.drag(event,'${p.id}')" onclick="A.pick('${p.id}')"`}>${esc(p.name)} · ${p.pos} · ${p.base??0}M<br><span class="mu">${p.price}M · ${p.left} season(s) left</span></div>`).join('')||'<p class="mu">No players yet</p>'}</div></div>`}
const nm=id=>esc(S.users.find(u=>u.id===id)?.name||'?');
const tbl=t=>`<table><tr><th>#</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>${t.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.n)}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.F-r.A}</td><td><b>${r.Pts}</b></td></tr>`).join('')}</table>`;
const res=ms=>ms.map(m=>`<tr><td>${nm(m.home)}</td><td><b>${m.hs} - ${m.as}</b></td><td>${nm(m.away)}</td></tr>`).join('');
function homeView(){const m=me();return`<div class="card"><div class="mu">Season ${S.season} · Your balance</div><div class="big">${m?.balance??0}M</div></div>
  <div class="card"><b>Balances</b><table>${S.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${u.balance}M</td><td>${owned(u.id).length} players</td></tr>`).join('')}</table></div>`}
function leagueView(){const s=S.ls||S.season,ms=S.matches.filter(m=>m.season===s&&m.status==='approved').sort((a,b)=>b.ts-a.ts),pend=S.matches.filter(m=>m.status==='pending'&&m.by===S.user.uid);
  return`<select onchange="A.ls(+this.value)">${[...Array(S.season)].map((_,i)=>`<option value="${i+1}" ${i+1===s?'selected':''}>Season ${i+1}</option>`).join('')}</select>
  <div class="card">${tbl(table(s))}</div><div class="card"><b>Results</b><table>${res(ms)||'<tr><td class="mu">No approved matches</td></tr>'}</table></div>
  ${s===S.season?`<div class="card"><b>Submit your result</b> <span class="mu">(admin must approve)</span><div class="row"><select id="op">${S.users.filter(u=>u.id!==S.user.uid).map(u=>`<option value="${u.id}">vs ${esc(u.name)}</option>`).join('')}</select><input id="ms" type="number" min="0" placeholder="Your goals"><input id="os" type="number" min="0" placeholder="Their goals"><button class="p" onclick="A.submit()">Submit</button></div>
  ${pend.length?'<p class="mu">Awaiting approval: '+pend.map(m=>nm(m.home)+' '+m.hs+'-'+m.as+' '+nm(m.away)).join(', ')+'</p>':''}</div>`:''}`}
function archiveView(){return S.arch.map(a=>`<div class="card"><h3>Season ${a.n} · 🏆 ${esc(a.first)} · 🥈 ${esc(a.second)}</h3>${tbl(a.table)}<button onclick="A.open(${a.n})">View matches</button>
  <details><summary class="mu">Squads that season</summary>${Object.entries(a.squads||{}).map(([u,l])=>`<p><b>${esc(u)}:</b> ${l.map(esc).join(', ')||'-'}</p>`).join('')}</details></div>`).join('')||'<p class="mu">No finished seasons yet</p>'}
function poolView(){const pool=S.players.filter(p=>!p.owner);return`<div class="card"><button class="p" onclick="A.copy()">Copy available pool</button><p class="mu">${pool.length} available</p><table>${pool.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.pos}</td><td>${p.base??0}M</td></tr>`).join('')}</table></div>
  <div class="card"><b>Contracted (multi-season)</b><table>${S.players.filter(p=>p.owner&&p.left>1).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(S.users.find(u=>u.id===p.owner)?.name)}</td><td>${p.left} left</td></tr>`).join('')}</table></div>`}
function squadsList(){return`<div class="card">${S.users.map(u=>`<p><button onclick="A.view('${u.id}')">${esc(u.name)}</button> ${owned(u.id).length} players · ${u.balance}M</p>`).join('')}</div>`}
function adminView(){const op=S.players.filter(p=>!p.owner).map(p=>`<option value="${p.id}">${esc(p.name)} (${p.base??0}M)</option>`).join(''),us=S.users.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join(''),t=table(S.season),
  pend=S.matches.filter(m=>m.status==='pending'),sel=(i)=>S.users.map(u=>`<option value="${u.id}" ${u.id===t[i]?.id?'selected':''}>${esc(u.name)}</option>`).join('');
  return`<div class="card"><b>Log auction result</b><div class="row"><div class="sel"><input id="q" value="${esc(S.apq||'')}" oninput="A.search(this.value)" autocomplete="off" placeholder="Search player name…"><div id="res" class="res"></div></div><select id="ow">${us}</select><input id="pr" type="number" min="0" placeholder="Price (M)"><select id="yrs">${[...Array(MAX_SEASONS)].map((_,i)=>`<option value="${i+1}">${i+1} season${i?'s':''}</option>`).join('')}</select><button class="p" onclick="A.assign()">Assign &amp; deduct</button></div></div>
  <div class="card"><b>Owned players</b><table>${S.players.filter(p=>p.owner).map(p=>`<tr><td>${esc(p.name)}</td><td>${nm(p.owner)}</td><td>${p.price}M</td><td>${p.left}s</td><td><button onclick="A.release('${p.id}',confirm('Refund price to owner? (OK = yes)'))">Release</button></td></tr>`).join('')}</table></div>
  <div class="card"><b>Pending results (${pend.length})</b><table>${pend.map(m=>`<tr><td>${nm(m.home)} <b>${m.hs}-${m.as}</b> ${nm(m.away)}</td><td><button class="p" onclick="A.approve('${m.id}')">Approve</button> <button onclick="A.del('${m.id}')">Reject</button></td></tr>`).join('')}</table></div>
  <div class="card"><b>Add result directly</b><div class="row"><select id="mh">${us}</select><input id="mhs" type="number" min="0" placeholder="Goals"><input id="mas" type="number" min="0" placeholder="Goals"><select id="ma">${us}</select><button class="p" onclick="A.adminMatch()">Add</button></div>
  <details><summary class="mu">Delete a match</summary><table>${S.matches.filter(m=>m.season===S.season).map(m=>`<tr><td>${nm(m.home)} ${m.hs}-${m.as} ${nm(m.away)} (${m.status})</td><td><button onclick="A.del('${m.id}')">Delete</button></td></tr>`).join('')}</table></details></div>
  <div class="card"><b>Import players (name, position, base price in M)</b><textarea id="csv" rows="5" placeholder="Messi,RWF,5"></textarea><button class="p" onclick="A.importCsv()">Import</button></div>
  <div class="card"><b>End season ${S.season}</b><p class="mu">Champion and runner-up are taken from the league table. The season is saved to the archive, bonuses (+${WIN_BONUS}M / +${SECOND_BONUS}M) and +${START}M are added, contracts tick down, and the next season begins.</p><button class="p" onclick="A.endSeason()">End season &amp; start next</button></div>`}
function render(){const nav=$('#nav'),app=$('#app');
  if(!S.user){nav.innerHTML='';$('#who').innerHTML='';app.innerHTML=`<div class="card auth"><h2>Welcome to Abar The Liga</h2><p class="mu">Log in, or sign up with a display name, email and password.</p><input id="nm" placeholder="Display name (sign up only)"><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><div class="row"><button class="p" onclick="A.login()">Login</button><button onclick="A.signup()">Sign up</button></div></div>`;return}
  const T=[['home','Home'],['league','League'],['squad','My Squad'],['squads','All Squads'],['pool','Pool'],['archive','Archive'],...(isAdmin()?[['admin','Admin']]:[])];
  nav.innerHTML=T.map(([k,n])=>`<button class="${S.tab===k?'on':''}" onclick="A.tab('${k}')">${n}</button>`).join(''); $('#who').innerHTML=`<span class="mu" style="color:#aab6c6;margin-right:10px">${esc(me()?.name||'')}</span><button onclick="A.out()">Log out</button>`;
  const ae=document.activeElement?.id;if(ae&&['q','csv','pr','ms','os','mhs','mas'].includes(ae))return; // don't wipe inputs while typing
  const TT={home:'Overview',league:'League',squad:'Squad',squads:'Squads',pool:'Player pool',archive:'Archive',admin:'Administration'};
  app.innerHTML=`<h1 class="pt">${TT[S.tab]}</h1>`+{home:homeView,league:leagueView,archive:archiveView,squad:squadView,squads:squadsList,pool:poolView,admin:adminView}[S.tab]();}
render();
