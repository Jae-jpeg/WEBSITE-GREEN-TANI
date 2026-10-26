(() => {
'use strict';
const KEY='greentani_products_v2', HIST='greentani_stock_history_v1', ORD='greentani_orders_v1', SESSION='greentani_admin_session_v2';
const ACCOUNTS=[
{username:'operasional',password:'operasional123',role:'operasional',name:'Admin Operasional',title:'Pengelola produk & pesanan',eyebrow:'PANEL OPERASIONAL',welcome:'Selamat bekerja, Admin Operasional 👋',intro:'Kelola katalog produk dan pantau pesanan pelanggan agar layanan tetap lancar.'},
{username:'gudang',password:'gudang123',role:'gudang',name:'Admin Gudang',title:'Pengelola stok & inventaris',eyebrow:'PANEL GUDANG',welcome:'Selamat bekerja, Admin Gudang 👋',intro:'Pantau inventaris dan jaga ketersediaan produk tetap terkendali.'}
];
const ACCESS={operasional:['overview','products','orders'],gudang:['overview','stock','stockin','stockout','stockadjust']};
function getSession(){try{const s=JSON.parse(sessionStorage.getItem(SESSION));return s&&ACCESS[s.role]?s:null}catch{return null}}
let ME=null; const can=v=>!!ME&&ACCESS[ME.role].includes(v);
const seed=window.GT?GT.SEED:[];
const $=id=>document.getElementById(id); const money=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const read=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key));return Array.isArray(x)?x:fallback}catch{return fallback}};
const save=(key,val)=>localStorage.setItem(key,JSON.stringify(val));
function products(){let x=read(KEY,null);if(!x){x=seed;save(KEY,x)}return x}
function readHistory(){return read(HIST,[])} function orders(){return read(ORD,[])}
function status(p){if(Number(p.stock)<=0)return ['Habis','out'];if(Number(p.stock)<=20)return ['Menipis','low'];return ['Tersedia','available']}
function image(p){return p.image||'../Gambar/logo.png'}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function productCell(p){return `<div class="table-product"><img class="product-thumb" src="${safe(image(p))}" alt="" onerror="this.src='../Gambar/logo.png'"><strong>${safe(p.name)}</strong></div>`}
function statusPill(p){let [label,cls]=status(p);return `<span class="status ${cls}">${label}</span>`}
function render(){stockExtras();const ps=products(), low=ps.filter(p=>p.stock>0&&p.stock<=20), out=ps.filter(p=>p.stock<=0), os=orders(); if($('statProducts'))$('statProducts').textContent=ps.length;if($('statLow'))$('statLow').textContent=low.length;if($('statOut'))$('statOut').textContent=out.length;if($('statOrders'))$('statOrders').textContent=os.length;const todayStr=new Date().toLocaleDateString('id-ID');if($('statWaiting'))$('statWaiting').textContent=os.filter(o=>o.status==='Menunggu').length;if($('statDone'))$('statDone').textContent=os.filter(o=>o.status==='Selesai').length;if($('statMoves'))$('statMoves').textContent=readHistory().filter(x=>String(x.time).split(',')[0].trim()===todayStr).length;
if($('recentOrders')){const cls={Menunggu:'pending',Diproses:'processing',Selesai:'completed',Dibatalkan:'out'};$('recentOrders').innerHTML=os.length?os.slice(0,5).map(o=>`<div class="attention-row"><div class="product-info" style="flex:1"><strong>${safe(o.id)} · ${safe(o.customer||'Pelanggan demo')}</strong><small>${safe(o.summary||'Pemesanan produk')}</small></div><div style="text-align:right"><div class="attention-qty">${money(o.total||0)}</div><span class="status ${cls[o.status]||'pending'}">${safe(o.status||'Menunggu')}</span></div></div>`).join(''):'<p class="empty-inline">Belum ada pesanan. Buka Pesanan untuk memuat data demo.</p>'}
if($('recentHistory')){const h=readHistory().slice(0,5);$('recentHistory').innerHTML=h.map(x=>`<tr><td>${safe(x.time)}</td><td>${safe(x.name)}</td><td><strong style="color:${x.delta>=0?'#4b863c':'#bf4545'}">${x.delta>0?'+':''}${x.delta} ${safe(x.unit)}</strong></td><td>${safe(x.reason)}</td></tr>`).join('');if($('emptyRecentHistory'))$('emptyRecentHistory').hidden=h.length>0}
if($('orderNavCount'))$('orderNavCount').textContent=os.filter(o=>!['Selesai','Dibatalkan'].includes(o.status)).length;
if($('attentionList')){let attention=ps.filter(p=>p.stock<=20);$('attentionList').innerHTML=attention.length?attention.map(p=>`<div class="attention-row"><img class="product-thumb" src="${safe(image(p))}" alt="" onerror="this.src='../Gambar/logo.png'"><div class="product-info"><strong>${safe(p.name)}</strong><small>${safe(p.category)}</small></div><div><div class="attention-qty">${p.stock} ${safe(p.unit)}</div>${statusPill(p)}</div></div>`).join(''):'<p class="empty-inline">Semua stok dalam kondisi aman. Mantap!</p>'}
if($('recentTable'))$('recentTable').innerHTML=ps.slice(0,5).map(p=>`<tr><td>${productCell(p)}</td><td class="money">${money(p.price)}</td><td>${p.stock} ${safe(p.unit)}</td><td>${statusPill(p)}</td></tr>`).join('');
if($('productsTable')){let q=($('productSearch').value||'').toLowerCase(), cat=$('categoryFilter').value;let shown=ps.filter(p=>p.name.toLowerCase().includes(q)&&(cat==='all'||p.category===cat));$('productsTable').innerHTML=shown.map(p=>`<tr><td>${productCell(p)}</td><td>${safe(p.category)}</td><td class="money">${money(p.price)} / ${safe(p.unit)}</td><td>${p.stock} ${safe(p.unit)}</td><td>${statusPill(p)}</td><td><div class="action-group"><button class="mini-btn" data-edit="${safe(p.id)}">Edit</button><button class="mini-btn danger" data-delete="${safe(p.id)}">Hapus</button></div></td></tr>`).join('');$('emptyProducts').hidden=shown.length>0}
if($('stockTable')){let q=($('stockSearch').value||'').toLowerCase();let shown=ps.filter(p=>p.name.toLowerCase().includes(q));$('stockTable').innerHTML=shown.map(p=>`<tr><td>${productCell(p)}</td><td><span class="stock-value ${p.stock<=0?'out-text':p.stock<=20?'low-text':''}">${p.stock} ${safe(p.unit)}</span></td><td>${statusPill(p)}</td><td><div class="stock-go"><button class="in" data-gostock="in" data-pid="${safe(p.id)}">+ Masuk</button><button class="out" data-gostock="out" data-pid="${safe(p.id)}" ${Number(p.stock)<=0?'disabled':''}>− Keluar</button><button data-gostock="adjust" data-pid="${safe(p.id)}">Koreksi</button></div></td></tr>`).join('')}
if($('historyTable')){let h=readHistory();$('historyTable').innerHTML=h.slice(0,30).map(x=>`<tr><td>${safe(x.time)}</td><td>${typeBadge(x)}</td><td>${safe(x.name)}</td><td><strong style="color:${x.delta>=0?'#4b863c':'#bf4545'}">${x.delta>0?'+':''}${x.delta} ${safe(x.unit)}</strong></td><td>${safe(x.reason)}</td><td>${safe(x.by||'—')}</td></tr>`).join('');$('emptyHistory').hidden=h.length>0}
if($('ordersTable')){let os2=orders();$('ordersTable').innerHTML=os2.map(o=>`<tr><td><strong>${safe(o.id)}</strong><br><small>${safe(o.date||'')}</small></td><td>${safe(o.customer||'Pelanggan demo')}${o.telepon?'<br><small>'+safe(o.telepon)+'</small>':''}</td><td>${safe(o.summary||'Pemesanan produk')}${o.kota||o.pengiriman?'<br><small>'+safe([o.kota,o.pengiriman,o.pembayaran].filter(Boolean).join(' · '))+'</small>':''}</td><td class="money">${money(o.total||0)}</td><td><select class="order-status" data-order="${safe(o.id)}"><option ${o.status==='Menunggu'?'selected':''}>Menunggu</option><option ${o.status==='Diproses'?'selected':''}>Diproses</option><option ${o.status==='Selesai'?'selected':''}>Selesai</option><option ${o.status==='Dibatalkan'?'selected':''}>Dibatalkan</option></select></td></tr>`).join('');$('emptyOrders').hidden=os2.length>0}
}
function toast(msg,error=false){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.toggle('error',error);t.classList.add('show');clearTimeout(window.__gtToast);window.__gtToast=setTimeout(()=>t.classList.remove('show'),2600)}
function view(name){if(!can(name))name='overview';document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));const titles={overview:'Ringkasan',products:'Manajemen produk',stock:'Manajemen stok',stockin:'Barang masuk',stockout:'Barang keluar',stockadjust:'Penyesuaian stok',orders:'Manajemen pesanan'};$('pageTitle').textContent=titles[name]||'Ringkasan';window.history.replaceState(null,'','#'+name);if($('sidebar'))$('sidebar').classList.remove('open');render()}
function applyRole(){
document.querySelectorAll('[data-roles]').forEach(el=>{el.hidden=!el.dataset.roles.split(' ').includes(ME.role)});
document.querySelectorAll('[data-view],[data-go]').forEach(el=>{if(!can(el.dataset.view||el.dataset.go))el.hidden=true});
const set=(id,t)=>{if($(id))$(id).textContent=t};
set('profileName',ME.name);set('profileTitle',ME.title);set('profileAvatar',ME.name.replace('Admin ','').charAt(0));set('topAvatar',ME.name.replace('Admin ','').charAt(0));set('topEyebrow','GREEN TANI / '+ME.role.toUpperCase());set('welcomeEyebrow',ME.eyebrow);set('welcomeTitle',ME.welcome);set('welcomeText',ME.intro);
document.title=ME.name+' — Green Tani'}

/* ── Formulir barang masuk / keluar / penyesuaian + konfirmasi ── */
const SF={
 in:{view:'stockin',label:'Barang masuk',sign:1,badge:'available',reasons:['Pembelian dari supplier','Retur dari pelanggan','Produksi / repack','Transfer antar gudang','Lainnya']},
 out:{view:'stockout',label:'Barang keluar',sign:-1,badge:'out',reasons:['Penjualan langsung (di luar website)','Barang rusak','Barang hilang','Kedaluwarsa','Sampel / promosi','Lainnya']},
 adjust:{view:'stockadjust',label:'Penyesuaian stok',sign:0,badge:'low',reasons:['Hasil stok opname (hitung fisik)','Koreksi kesalahan input sebelumnya','Lainnya']}
};
const r2=n=>Math.round(Number(n)*100)/100, fmt=n=>Number(n).toLocaleString('id-ID'), sfEl=(m,k)=>$('sf-'+m+'-'+k);
let sfPending=null;
function typeBadge(x){const t=x.type||(/^Pesanan/.test(x.reason||'')?'order':x.delta>=0?'in':'out');const map={in:['available','Masuk'],out:['out','Keluar'],adjust:['low','Penyesuaian'],order:['processing','Pesanan']};const [c,l]=map[t]||map.in;return `<span class="status ${c}">${l}</span>`}
function stockExtras(){
 const ps=products();
 Object.keys(SF).forEach(m=>{
  const sel=sfEl(m,'product');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">-- Pilih produk --</option>'+ps.map(p=>`<option value="${safe(p.id)}"${m==='out'&&Number(p.stock)<=0?' disabled':''}>${safe(p.name)} — stok ${fmt(p.stock)} ${safe(p.unit)}</option>`).join('');
  sel.value=ps.some(p=>p.id===cur)?cur:'';
  const rs=sfEl(m,'reason');if(rs&&!rs.options.length)rs.innerHTML='<option value="">-- Pilih alasan --</option>'+SF[m].reasons.map(x=>`<option>${safe(x)}</option>`).join('');
  const rb=sfEl(m,'recent');
  if(rb){const rows=readHistory().filter(x=>x.type===m).slice(0,5);rb.innerHTML=rows.length?rows.map(x=>`<tr><td>${safe(x.time)}</td><td>${safe(x.name)}</td><td><strong style="color:${x.delta>=0?'#4b863c':'#bf4545'}">${x.delta>0?'+':''}${fmt(x.delta)} ${safe(x.unit)}</strong></td><td>${safe(x.reason)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty-inline">Belum ada catatan.</td></tr>'}
  sfUpdate(m);
 });
}
function sfCalc(m){
 const p=products().find(x=>x.id===sfEl(m,'product').value),raw=sfEl(m,'qty').value.trim(),q=Number(raw);
 if(!p)return{ok:false,quiet:true,msg:'Pilih produk terlebih dahulu.'};
 const before=r2(p.stock);
 if(raw==='')return{ok:false,quiet:true,p,before,msg:'Masukkan jumlah.'};
 if(!Number.isFinite(q)||q<0||q>1000000)return{ok:false,p,before,msg:'Jumlah tidak valid.'};
 let delta,after;
 if(m==='adjust'){after=r2(q);delta=r2(after-before);if(delta===0)return{ok:false,p,before,msg:'Hasil hitung fisik sama dengan stok sistem, tidak ada yang perlu disesuaikan.'}}
 else{if(q<=0)return{ok:false,p,before,msg:'Jumlah harus lebih dari 0.'};delta=r2(SF[m].sign*q);after=r2(before+delta);if(after<0)return{ok:false,p,before,msg:`Jumlah keluar (${fmt(q)}) melebihi stok tersedia (${fmt(before)} ${p.unit}).`}}
 return{ok:true,p,q,before,after,delta};
}
function sfUpdate(m){
 const box=sfEl(m,'preview'),btn=sfEl(m,'submit');if(!box)return;
 const c=sfCalc(m);
 if(c.ok){box.className='sf-preview';box.innerHTML=`Stok <b>${safe(c.p.name)}</b>: ${fmt(c.before)} → <strong>${fmt(c.after)} ${safe(c.p.unit)}</strong> <span>(${c.delta>0?'+':''}${fmt(c.delta)})</span>`}
 else{box.className='sf-preview'+(c.quiet?'':' bad');box.textContent=c.p&&c.quiet?`Stok saat ini: ${fmt(c.before)} ${c.p.unit}. ${c.msg}`:c.msg}
 if(btn)btn.disabled=!c.ok;
}
function sfWarnings(m,c){
 const w=[],u=' '+c.p.unit;
 if(m==='in'&&(c.q>=1000||(c.before>0&&c.q>=100&&c.q>=c.before*5)))w.push(`Jumlah masuk ${fmt(c.q)}${u} tergolong sangat besar. Pastikan tidak ada angka nol yang berlebih.`);
 if(m==='out'){if(c.after===0)w.push('Stok akan menjadi 0 dan produk berstatus Habis.');else if(c.q>=c.before*0.5)w.push(`Anda mengeluarkan lebih dari separuh stok (${fmt(c.q)} dari ${fmt(c.before)}${u}).`)}
 if(m==='adjust'){if(c.after===0)w.push('Stok akan diatur menjadi 0 dan produk berstatus Habis.');if(c.before>0&&Math.abs(c.delta)>=c.before*0.3)w.push(`Selisih penyesuaian besar (${c.delta>0?'+':''}${fmt(c.delta)}${u}, ${Math.round(Math.abs(c.delta)/c.before*100)}% dari stok sistem).`)}
 const dup=readHistory().find(x=>x.id===c.p.id&&r2(x.delta)===c.delta&&x.ts&&Date.now()-x.ts<120000);
 if(dup)w.push(`Input yang sama (produk dan jumlah) baru dicatat ${Math.max(1,Math.round((Date.now()-dup.ts)/1000))} detik lalu. Pastikan ini bukan input ganda.`);
 return w;
}
function sfReview(m){
 if(!can(SF[m].view))return;
 const c=sfCalc(m);if(!c.ok){sfUpdate(m);return}
 const reason=sfEl(m,'reason').value,note=sfEl(m,'note').value.trim(),doc=sfEl(m,'doc')?sfEl(m,'doc').value.trim():'';
 if(!reason){toast('Pilih alasan terlebih dahulu.',true);sfEl(m,'reason').focus();return}
 if(reason==='Lainnya'&&!note){toast('Alasan “Lainnya” wajib dijelaskan pada catatan.',true);sfEl(m,'note').focus();return}
 const cfg=SF[m],warns=sfWarnings(m,c),u=' '+safe(c.p.unit);
 sfPending={m,pid:c.p.id,after:c.after,delta:c.delta,reason,note,doc};
 const qty=m==='adjust'?`Hasil hitung fisik ${fmt(c.after)}${u} <small>(selisih ${c.delta>0?'+':''}${fmt(c.delta)})</small>`:`${m==='in'?'+':'−'}${fmt(c.q)}${u}`;
 $('confirmEyebrow').textContent=cfg.label.toUpperCase();
 $('confirmList').innerHTML=[['Jenis',`<span class="status ${cfg.badge}">${cfg.label}</span>`],['Produk',safe(c.p.name)],['Jumlah',`<b class="confirm-big">${qty}</b>`],['Stok sebelum',fmt(c.before)+u],['Stok sesudah',`<b class="confirm-big">${fmt(c.after)}${u}</b>`],['Alasan',safe(reason)],['No. dokumen',doc?safe(doc):'—'],['Catatan',note?safe(note):'—'],['Petugas',safe(ME.name)]].map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
 $('confirmWarn').innerHTML=warns.map(x=>`<div class="confirm-warn">⚠ ${safe(x)}</div>`).join('');
 $('confirmCheckWrap').hidden=!warns.length;$('confirmCheck').checked=false;$('confirmOk').disabled=warns.length>0;
 $('confirmModal').hidden=false;$('confirmCancel').focus();
}
function closeConfirm(){$('confirmModal').hidden=true}
function sfApply(){
 const pe=sfPending;if(!pe||!can(SF[pe.m].view))return;
 const c=sfCalc(pe.m);
 if(!c.ok||c.p.id!==pe.pid||c.after!==pe.after||c.delta!==pe.delta){closeConfirm();sfUpdate(pe.m);toast('Stok berubah sejak Anda meninjau data. Periksa kembali.',true);return}
 const ps=products(),p=ps.find(x=>x.id===pe.pid);p.stock=pe.after;save(KEY,ps);
 addHistory(p,pe.delta,pe.reason+(pe.doc?' · '+pe.doc:'')+(pe.note?' — '+pe.note:''),{type:pe.m});
 closeConfirm();sfPending=null;
 ['product','qty','reason','doc','note'].forEach(k=>{const el=sfEl(pe.m,k);if(el)el.value=''});
 render();
 toast(`${SF[pe.m].label} tersimpan: ${p.name} ${pe.delta>0?'+':''}${fmt(pe.delta)} ${p.unit}. Stok sekarang ${fmt(p.stock)} ${p.unit}.`);
}
function wireStockForms(){
 Object.keys(SF).forEach(m=>{
  const f=$('sf-'+m);if(!f)return;
  ['product','qty','reason'].forEach(k=>['input','change'].forEach(ev=>sfEl(m,k).addEventListener(ev,()=>sfUpdate(m))));
  f.addEventListener('submit',e=>{e.preventDefault();sfReview(m)});
 });
 $('confirmCancel').addEventListener('click',closeConfirm);$('confirmClose').addEventListener('click',closeConfirm);
 $('confirmModal').addEventListener('click',e=>{if(e.target===$('confirmModal'))closeConfirm()});
 $('confirmCheck').addEventListener('change',()=>{$('confirmOk').disabled=!$('confirmCheck').checked});
 $('confirmOk').addEventListener('click',sfApply);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('confirmModal').hidden)closeConfirm()});
}

function openModal(p){$('productForm').reset();$('productId').value=p?.id||'';$('modalTitle').textContent=p?'Edit produk':'Tambah produk';$('productName').value=p?.name||'';$('productCategory').value=p?.category||'Pupuk';$('productUnit').value=p?.unit||'kg';$('productPrice').value=p?.price??'';$('productStock').value=p?.stock??0;$('productImage').value=p?.image||'';$('productDescription').value=p?.description||'';$('productModal').hidden=false;$('productName').focus()}
function closeModal(){$('productModal').hidden=true}
function addHistory(p,delta,reason,extra={}){const h=readHistory();h.unshift({time:new Date().toLocaleString('id-ID'),ts:Date.now(),id:p.id,name:p.name,delta,unit:p.unit,reason,by:(ME&&ME.name)||'Admin',...extra});save(HIST,h.slice(0,100))}
function setup(){if($('adminLogin')){$('adminLogin').addEventListener('submit',e=>{e.preventDefault();let u=$('username').value.trim(),p=$('password').value;const acc=ACCOUNTS.find(a=>a.username===u.toLowerCase()&&a.password===p);if(acc){const {password:_pw,...sess}=acc;sessionStorage.setItem(SESSION,JSON.stringify(sess));location.href='dashboard.html'}else $('loginMessage').textContent='Username atau password demo tidak sesuai.'});document.querySelectorAll('[data-fill]').forEach(b=>b.addEventListener('click',()=>{const a=ACCOUNTS.find(x=>x.username===b.dataset.fill);$('username').value=a.username;$('password').value=a.password;$('loginMessage').textContent=''}));return}
if(!$('view-overview'))return;ME=getSession();if(!ME){sessionStorage.removeItem(SESSION);location.replace('login.html');return}applyRole();
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{view(b.dataset.go);if(b.dataset.scroll&&$(b.dataset.scroll))$(b.dataset.scroll).scrollIntoView({behavior:'smooth',block:'start'})}));document.querySelectorAll('[data-action="add"]').forEach(b=>b.addEventListener('click',()=>openModal()));$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));$('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem(SESSION);location.href='login.html'});$('closeModal').addEventListener('click',closeModal);$('cancelModal').addEventListener('click',closeModal);$('productModal').addEventListener('click',e=>{if(e.target===$('productModal'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});$('productSearch').addEventListener('input',render);$('categoryFilter').addEventListener('change',render);$('stockSearch').addEventListener('input',render);
$('productForm').addEventListener('submit',e=>{e.preventDefault();let ps=products(),id=$('productId').value||('GT'+Date.now().toString().slice(-7));let existing=ps.find(p=>p.id===id);let item={id,name:$('productName').value.trim(),category:$('productCategory').value,unit:$('productUnit').value,price:Number($('productPrice').value),stock:existing?Number(existing.stock):0,image:$('productImage').value.trim()||'../Gambar/logo.png',description:$('productDescription').value.trim()};if(!can('products')||!item.name||item.price<0||!Number.isFinite(item.price)){toast('Periksa kembali data produk.',true);return}if(existing){let delta=item.stock-Number(existing.stock);ps=ps.map(p=>p.id===id?item:p);if(delta)addHistory(item,delta,'Edit data produk')}else{ps.unshift(item)}save(KEY,ps);closeModal();render();toast(existing?'Perubahan produk disimpan.':'Produk ditambahkan. Stok awal 0, menunggu diisi Admin Gudang.')});
document.addEventListener('click',e=>{let edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),gs=e.target.closest('[data-gostock]');if(edit&&can('products')){let p=products().find(x=>x.id===edit.dataset.edit);if(p)openModal(p)}if(del&&can('products')){let p=products().find(x=>x.id===del.dataset.delete);if(p&&confirm('Hapus produk “'+p.name+'” dari katalog demo?')){save(KEY,products().filter(x=>x.id!==p.id));toast('Produk dihapus.');render()}}if(gs&&SF[gs.dataset.gostock]&&can(SF[gs.dataset.gostock].view)){const mm=gs.dataset.gostock;view(SF[mm].view);const sel=sfEl(mm,'product');sel.value=gs.dataset.pid;sfUpdate(mm);sfEl(mm,'qty').focus()}});
wireStockForms();$('clearHistory').addEventListener('click',()=>{if(can('stock')&&confirm('Bersihkan semua riwayat perubahan stok?')){save(HIST,[]);render();toast('Riwayat dibersihkan.')}});$('loadSampleOrders').addEventListener('click',()=>{if(!can('orders'))return;if(orders().length){toast('Data pesanan sudah tersedia.');return}save(ORD,[{id:'GT-DEMO-001',date:new Date().toLocaleDateString('id-ID'),sumber:'demo',customer:'Andi Saputra',summary:'Natur T16 × 2 kg',total:170000,status:'Menunggu'},{id:'GT-DEMO-002',date:new Date().toLocaleDateString('id-ID'),sumber:'demo',customer:'Sari Lestari',summary:'Natur Urea × 1 kg',total:120000,status:'Diproses'}]);render();toast('Data pesanan demo dimuat.')});$('ordersTable').addEventListener('change',e=>{let s=e.target.closest('[data-order]');if(!s||!can('orders'))return;let os=orders();let o=os.find(x=>x.id===s.dataset.order);if(o){const res=window.GT?GT.applyStatus(o,s.value):{ok:true};if(!res.ok){toast(res.msg,true);render();return}o.status=s.value;save(ORD,os);render();toast(s.value==='Dibatalkan'&&o.produkId?'Pesanan dibatalkan, stok dikembalikan.':'Status pesanan diperbarui.')}});
window.addEventListener('hashchange',()=>view(location.hash.slice(1)||'overview'));let initial=location.hash.slice(1);view(['overview','products','stock','orders'].includes(initial)?initial:'overview');render();}
document.addEventListener('DOMContentLoaded',setup);
})();
