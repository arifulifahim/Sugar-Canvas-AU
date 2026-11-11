
const KEY='sugarCanvasPhoneV1';
function nowIso(){return new Date().toISOString()}
function todayIso(){return new Date().toISOString().slice(0,10)}
function money(n){return '$'+Number(n||0).toFixed(2)}
function titleItem(v){return String(v||'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAnd\b/g,'and').replace(/\bOf\b/g,'of')}
function uid(){return 'ph_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch(e){return fresh()}}
function fresh(){return {device_id:uid(),last_sync:'Never',recipes:[],packaging:[],customers:[],orders:[],donut_menu:{bomboloni:{4:22,6:30,8:38},ring_glazed:{4:16,6:20,8:27},ring_assorted:{4:19,6:26,8:34}},changes:{customers:{},orders:{}},cakeDraft:{addons:[],customAddons:[]},lan:{server:'',token:'',device_id:'',device_name:''}}}
let S=load();if(!S.cakeDraft)S.cakeDraft={addons:[],customAddons:[]};if(!Number(S.cakeDraft.profitPct)||Number(S.cakeDraft.profitPct)<80)S.cakeDraft.profitPct=80;
function save(){localStorage.setItem(KEY,JSON.stringify(S));renderAll()}
function normaliseLanServer(v){let s=String(v||'').trim().replace(/\/$/,'');if(!s)return '';if(!/^https?:\/\//i.test(s))s='http://'+s;return s}
function b64urlJson(obj){const bytes=new TextEncoder().encode(JSON.stringify(obj));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decodeB64urlJson(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const bytes=new Uint8Array([...bin].map(c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(bytes))}
async function hmacHex(secret,msg){const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(msg));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function applyLaptopSnapshot(p,clearChanges=true){if(!p||p.schema!=='sugar_canvas_phone_sync')throw new Error('Wrong laptop snapshot');S.recipes=p.recipes||[];S.packaging=p.packaging||[];S.donut_menu=p.donut_menu||S.donut_menu;
  const changedCustomers=new Set(Object.keys(S.changes.customers||{}));const changedOrders=new Set(Object.keys(S.changes.orders||{}));
  const byCid=new Map(S.customers.map(c=>[c.phone_sync_id||c.id,c]));(p.customers||[]).forEach(c=>{const id=c.phone_sync_id||c.id;if(clearChanges||!changedCustomers.has(id))byCid.set(id,c)});S.customers=[...byCid.values()];
  const byOid=new Map(S.orders.map(o=>[o.phone_sync_id||o.id||o.order_no,o]));(p.orders||[]).forEach(o=>{const id=o.phone_sync_id||o.id||o.order_no;if(clearChanges||!changedOrders.has(id))byOid.set(id,o)});S.orders=[...byOid.values()];
  if(clearChanges)S.changes={customers:{},orders:{}};S.last_sync=new Date().toLocaleString();prune();}
function currentReturnUrl(){return location.origin+location.pathname}
function handleLanReturn(){const raw=location.hash||'';if(!raw.startsWith('#lanPair=')&&!raw.startsWith('#lanSync='))return false;try{const pair=raw.startsWith('#lanPair=');const value=raw.substring(pair?9:9);const data=decodeB64urlJson(value);if(!data.ok)throw new Error('Sync failed');if(pair){S.lan={server:data.server||'',token:data.token||'',device_id:data.device_id||S.device_id,device_name:S.lan?.device_name||'Phone'};applyLaptopSnapshot(data.snapshot,true);alert('Phone paired successfully. Future Wi-Fi syncs will not need the pairing code.')}else{applyLaptopSnapshot(data.snapshot,true);alert('Sugar Canvas synced successfully.');}history.replaceState(null,'',location.pathname+location.search);localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){history.replaceState(null,'',location.pathname+location.search);alert('Could not finish Wi-Fi sync: '+e.message);return false}}

function markCustomer(c){S.changes.customers[c.phone_sync_id||c.id]=c}
function markOrder(o){S.changes.orders[o.phone_sync_id]=o}
function prune(){
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
  S.orders=S.orders.filter(o=>{
    const d=new Date(o.created||o.date||0); const del=new Date(o.date||0);
    const st=String(o.workflow_status||o.status||'').toLowerCase();
    const active=!['completed','cancelled','finalised'].includes(st);
    return active || del>=new Date(new Date().toDateString()) || d>=cutoff || del>=cutoff;
  });
}
function go(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);renderAll()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)})
function customerOptions(sel){
  const old=sel.value; sel.innerHTML='<option value="">Select customer</option>';
  [...S.customers].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name;sel.appendChild(o)});
  if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function recipeOptions(){
  const sel=document.getElementById('cakeRecipe'),old=sel.value;sel.innerHTML='<option value="">Select recipe</option>';
  S.recipes.filter(r=>r.type==='Cake').sort((a,b)=>a.name.localeCompare(b.name)).forEach(r=>{let o=document.createElement('option');o.value=r.id;o.textContent=titleItem(r.name);sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function packagingOptions(){
  const sel=document.getElementById('cakePackaging'),old=sel.value;sel.innerHTML='<option value="">None</option>';
  S.packaging.forEach(p=>{let o=document.createElement('option');o.value=p.id;o.textContent=`${titleItem(p.name)} (${money(p.total_cost)})`;sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;
}

function addonCostFor(recipe,w,q){
  return Number(recipe?.base_cost||0)*(Number(w||500)/Number(recipe?.base_weight_g||500))*Number(q||1)
}
function getSelectedAddonRows(){
  const w=Number(document.getElementById('cakeWeight').value||500);
  const q=Number(document.getElementById('cakeQty').value||1);
  const recipeRows=(S.cakeDraft.addons||[]).map(id=>{
    const r=S.recipes.find(x=>x.id===id);
    if(!r)return null;
    const cost=addonCostFor(r,w,q);
    return {id:r.id,item:r.name,recipe:r.name,item_type:'Add-On',quantity:q,target_weight_g:w,base_cost:cost,cost:cost,manual:false};
  }).filter(Boolean);
  const custom=(S.cakeDraft.customAddons||[]).map(x=>({id:x.id,item:x.name,item_type:'Add-On',quantity:1,target_weight_g:w,base_cost:Number(x.cost||0),cost:Number(x.cost||0),manual:true}));
  return [...recipeRows,...custom];
}
function renderAddonChoices(){
  const box=document.getElementById('cakeAddonList'); if(!box)return;
  const w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const addons=S.recipes.filter(r=>r.type==='Add-On').sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  box.innerHTML='';
  if(!addons.length){
    box.innerHTML='<div class="small">No Add-On recipes synced yet. Create them on the laptop with Recipe Type = Add-On, then sync.</div>';
  }else{
    addons.forEach(r=>{
      const selected=(S.cakeDraft.addons||[]).includes(r.id);
      const b=document.createElement('button');b.type='button';b.className='addon-chip'+(selected?' selected':'');
      b.innerHTML=`${titleItem(r.name)}<span class="addon-price">${money(addonCostFor(r,w,q))} cost</span>`;
      b.onclick=()=>{
        const set=new Set(S.cakeDraft.addons||[]);
        if(set.has(r.id))set.delete(r.id);else set.add(r.id);
        S.cakeDraft.addons=[...set];localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();cakeCalc();
      };
      box.appendChild(b);
    });
  }
  const selectedBox=document.getElementById('selectedAddons');selectedBox.innerHTML='';
  getSelectedAddonRows().forEach(a=>{
    const row=document.createElement('div');row.className='selected-addon-row';
    row.innerHTML=`<div><b>${titleItem(a.item)}</b><div class="small">${a.manual?'Manual Custom Add-On Cost':`${Math.round(a.target_weight_g)}g cake`}</div></div><div><b>${money(a.base_cost)}</b> <button class="remove-mini" type="button">×</button></div>`;
    row.querySelector('button').onclick=()=>{
      if(a.manual)S.cakeDraft.customAddons=(S.cakeDraft.customAddons||[]).filter(x=>x.id!==a.id);
      else S.cakeDraft.addons=(S.cakeDraft.addons||[]).filter(id=>id!==a.id);
      localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();cakeCalc();
    };
    selectedBox.appendChild(row);
  });
}
function normaliseProfitPct(){
  const input=document.getElementById('cakeProfitPct');
  let pct=Number(input.value||80);
  if(!Number.isFinite(pct)||pct<80)pct=80;
  input.value=String(pct);
  S.cakeDraft.profitPct=pct;
  localStorage.setItem(KEY,JSON.stringify(S));
  return pct;
}
function roundSellingUp(n){return Math.ceil(Number(n||0));}

function cakeCalc(){
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  const w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const p=S.packaging.find(x=>x.id===document.getElementById('cakePackaging').value);
  const pack=Number(p?.total_cost||0);
  const customizationCost=Math.max(0,Number(document.getElementById('cakeCustomizationCost').value||0));
  const addonRows=getSelectedAddonRows();
  const addonCost=addonRows.reduce((a,x)=>a+Number(x.base_cost||0),0);
  const pct=normaliseProfitPct();
  const recipeCost=r ? Number(r.base_cost||0)*(w/Number(r.base_weight_g||500))*q : 0;
  const cost=recipeCost+addonCost+pack+customizationCost;
  const selling=roundSellingUp(cost*(1+pct/100));
  document.getElementById('cakeCost').textContent=money(cost);
  document.getElementById('cakeAddonTotal').textContent=money(addonCost);
  document.getElementById('cakeSellingPrice').textContent='$'+selling.toFixed(0);
  return {cost,selling,profitPct:pct,pack,recipe:r,packaging:p,recipeCost,addonRows,addonCost,customizationCost};
}

['cakeRecipe','cakeWeight','cakeQty','cakePackaging','cakeCustomizationCost'].forEach(id=>
  document.getElementById(id).addEventListener('input',()=>{renderAddonChoices();cakeCalc()})
);
document.getElementById('cakeProfitPct').addEventListener('input',()=>{cakeCalc()});
document.getElementById('cakeProfitPct').addEventListener('change',()=>{normaliseProfitPct();cakeCalc()});

document.getElementById('addCustomAddon').onclick=()=>{
  const name=prompt('Custom add-on description, for example Fresh Flowers or Special Topper');
  if(!name)return;
  const raw=prompt('What does this add-on COST you? ($)');
  if(raw===null)return;
  const cost=Number(String(raw).replace('$','').replace(',',''));
  if(!Number.isFinite(cost)||cost<0){alert('Enter a valid cost.');return}
  S.cakeDraft.customAddons=S.cakeDraft.customAddons||[];
  S.cakeDraft.customAddons.push({id:uid(),name:name.trim(),cost});
  localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();cakeCalc();
};

function buildCakeReceipt(){
  const customer=document.getElementById('cakeCustomer').value;
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  if(!customer||!r){alert('Choose customer and cake first.');return null}
  const calc=cakeCalc(),w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const lines=[{name:`${titleItem(r.name)} • ${Math.round(w)}g`,cost:calc.recipeCost,kind:'Cake Cost'}];
  calc.addonRows.forEach(a=>lines.push({name:titleItem(a.item),cost:Number(a.base_cost||0),kind:'Add-On Cost'}));
  if(calc.packaging&&calc.pack>0)lines.push({name:titleItem(calc.packaging.name),cost:calc.pack,kind:'Packaging Cost'});
  if(calc.customizationCost>0)lines.push({name:'Customization',cost:calc.customizationCost,kind:'Customization Cost'});
  return {customer,r,calc,w,q,lines,totalCost:calc.cost,selling:calc.selling,profitPct:calc.profitPct};
}

function renderCakeReview(){
  const data=buildCakeReceipt();if(!data)return false;
  const box=document.getElementById('cakeReceiptLines');box.innerHTML='';
  data.lines.forEach(x=>{
    const row=document.createElement('div');row.className='receipt-line';
    row.innerHTML=`<span>${x.name}<div class="item-sub">${x.kind}</div></span><b>${money(x.cost)}</b>`;
    box.appendChild(row);
  });
  document.getElementById('reviewTotalCost').textContent=money(data.totalCost);
  document.getElementById('reviewProfitPct').textContent=Number(data.profitPct).toFixed(0)+'%';
  document.getElementById('reviewSellingPrice').textContent='$'+Number(data.selling).toFixed(0);
  const finalInput=document.getElementById('cakeFinalPrice');
  if(!finalInput.dataset.manual||!finalInput.value)finalInput.value=Number(data.selling).toFixed(0);
  updateReviewProfit();
  return true;
}

function updateReviewProfit(){
  const calc=cakeCalc();
  const final=Number(document.getElementById('cakeFinalPrice').value||0);
  document.getElementById('reviewProfit').textContent=money(final-Number(calc.cost||0));
}

document.getElementById('cakeFinalPrice').addEventListener('input',e=>{e.target.dataset.manual='1';updateReviewProfit()});
document.getElementById('reviewCakePrice').onclick=()=>{if(renderCakeReview())go('cakeReview')};

function addCustomer(){
  const name=prompt('Customer name');if(!name)return null;const phone=prompt('Phone number (optional)')||'';const address=prompt('Address (optional)')||'';
  const c={id:uid(),phone_sync_id:uid(),name:name.trim(),phone,address,social:'',modified_at:nowIso()};S.customers.push(c);markCustomer(c);save();return c;
}
document.getElementById('addCustomerBtn').onclick=addCustomer;document.getElementById('cakeAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('cakeCustomer').value=c.name};document.getElementById('donutAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('donutCustomer').value=c.name};
function saveCake(status){
  const customer=document.getElementById('cakeCustomer').value;
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  if(!customer||!r){alert('Choose customer and cake.');return}
  const calc=cakeCalc(),w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const price=Number(document.getElementById('cakeFinalPrice').value||calc.selling);
  const dep=Number(document.getElementById('cakeDeposit').value||0);
  const cakeLine={item:r.name,recipe:r.name,item_type:'Cake',quantity:q,target_weight_g:w,base_cost:calc.recipeCost,packaging_type:'',packaging_cost:0,customisation:0,price:0};
  const addonLines=calc.addonRows.map(a=>({item:a.item,recipe:a.recipe||'',recipe_id:a.id||'',item_type:'Add-On',quantity:a.quantity||1,target_weight_g:w,base_cost:Number(a.base_cost||0),packaging_type:'None',packaging_cost:0,customisation:0,price:0,manual_custom_addon:!!a.manual}));
  const receipt=buildCakeReceipt();
  const o={phone_sync_id:uid(),customer,item:r.name,recipe:r.name,quantity:q,target_weight_g:w,date:document.getElementById('cakeDate').value||todayIso(),base_cost:calc.cost,cost:calc.cost,packaging_type:calc.packaging?.name||'',packaging_cost:calc.pack,customisation:calc.customizationCost,addon_cost:calc.addonCost,profit_percent:calc.profitPct,calculated_selling_price:calc.selling,price,deposit:dep,status,workflow_status:status==='Confirmed'?'Confirmed':'',note:document.getElementById('cakeNote').value,created:todayIso(),modified_at:nowIso(),price_breakdown:receipt?.lines||[],items:[cakeLine,...addonLines]};
  S.orders.unshift(o);markOrder(o);
  S.cakeDraft={addons:[],customAddons:[],profitPct:calc.profitPct};
  document.getElementById('cakeCustomizationCost').value='0';
  document.getElementById('cakeFinalPrice').dataset.manual='';
  localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();save();
  alert(status==='Quotation'?'Quote saved on phone.':'Order confirmed and saved on phone.');
  go('orders');
}
document.getElementById('saveCakeQuote').onclick=()=>saveCake('Quotation');document.getElementById('confirmCakeOrder').onclick=()=>saveCake('Confirmed');
function donutCalc(){const k=document.getElementById('donutKind').value,q=document.getElementById('donutQty').value,p=Number(S.donut_menu?.[k]?.[q]||0);document.getElementById('donutPrice').textContent=money(p);return p}
['donutKind','donutQty'].forEach(id=>document.getElementById(id).addEventListener('change',donutCalc));
function saveDonut(status){const customer=document.getElementById('donutCustomer').value;if(!customer){alert('Choose customer.');return}const kind=document.getElementById('donutKind').value,q=Number(document.getElementById('donutQty').value),price=donutCalc(),names={bomboloni:'Bomboloni Assorted',ring_glazed:'Original Glazed Ring Donuts',ring_assorted:'Ring Donut Assorted'},dep=Number(document.getElementById('donutDeposit').value||0);
  const o={phone_sync_id:uid(),customer,item:`${names[kind]} - ${q} pcs`,recipe:'',quantity:q,target_weight_g:0,date:document.getElementById('donutDate').value||todayIso(),base_cost:0,cost:0,packaging_type:'Donut box',packaging_cost:0,customisation:0,price,deposit:dep,status,workflow_status:status==='Confirmed'?'Confirmed':'',note:document.getElementById('donutFlavours').value,created:todayIso(),modified_at:nowIso(),items:[]};
  S.orders.unshift(o);markOrder(o);save();alert(status==='Quotation'?'Donut quote saved.':'Donut order confirmed.');go('orders');
}
document.getElementById('saveDonutQuote').onclick=()=>saveDonut('Quotation');document.getElementById('confirmDonutOrder').onclick=()=>saveDonut('Confirmed');
function renderOrders(){const list=document.getElementById('ordersList'),q=(document.getElementById('orderSearch').value||'').toLowerCase(),f=document.getElementById('orderFilter').value;list.innerHTML='';let rows=[...S.orders].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  rows=rows.filter(o=>{const st=String(o.workflow_status||o.status||'').toLowerCase();const active=!['completed','cancelled','finalised'].includes(st);if(f==='active'&&!active)return false;if(f==='quotation'&&st!=='quotation')return false;if(f==='completed'&&!['completed','finalised'].includes(st))return false;return `${o.customer} ${o.item} ${o.order_no||''}`.toLowerCase().includes(q)});
  if(!rows.length){list.innerHTML='<div class="card muted">No orders found.</div>';return}
  rows.forEach(o=>{const d=document.createElement('div');d.className='list-item';d.innerHTML=`<div class="list-top"><b>${o.customer||'Customer'}</b><span class="status">${o.workflow_status||o.status||''}</span></div><div>${titleItem(o.item||'Order')}</div><div class="small">${o.date||''} • ${o.order_no||'Phone order'}</div><div class="list-top"><span class="small">${o.note||''}</span><span class="money">${money(o.price)}</span></div>`;list.appendChild(d)})
}
document.getElementById('orderSearch').oninput=renderOrders;document.getElementById('orderFilter').onchange=renderOrders;
function renderCustomers(){const list=document.getElementById('customersList');list.innerHTML='';[...S.customers].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(c=>{const d=document.createElement('div');d.className='list-item';d.innerHTML=`<b>${c.name}</b><div class="small">${c.phone||''}</div><div class="small">${c.address||''}</div>`;list.appendChild(d)});if(!S.customers.length)list.innerHTML='<div class="card muted">No customers yet.</div>'}
function renderHome(){const active=S.orders.filter(o=>!['completed','cancelled','finalised'].includes(String(o.workflow_status||o.status||'').toLowerCase())).length,quotes=S.orders.filter(o=>String(o.status||'').toLowerCase()==='quotation').length,changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length;document.getElementById('homeSummary').innerHTML=`<div class="list-item"><span>Active orders</span><b>${active}</b></div><div class="list-item"><span>Quotes</span><b>${quotes}</b></div><div class="list-item"><span>Changes waiting for laptop</span><b>${changes}</b></div>`}
function renderSync(){const changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length;const paired=!!(S.lan&&S.lan.token&&S.lan.server);document.getElementById('wifiNotPaired').hidden=paired;document.getElementById('wifiPaired').hidden=!paired;if(paired){document.getElementById('pairedLaptop').textContent='Paired laptop: '+S.lan.server;document.getElementById('pairedServer').value=S.lan.server}else{document.getElementById('lanServer').value=S.lan?.server||'';document.getElementById('lanDeviceName').value=S.lan?.device_name||''}
  document.getElementById('syncStatus').innerHTML=`<p><b>Last successful sync:</b> ${S.last_sync}</p><p><b>Changes waiting for laptop:</b> ${changes}</p><p><b>Phone history:</b> last 30 days + active/future orders</p><p><b>Connection:</b> ${paired?'Paired — no code needed':'Not paired yet'}</p>`;document.getElementById('syncBadge').textContent=changes?`${changes} waiting`:(paired?'Paired':'Offline ready')}
function renderAll(){customerOptions(document.getElementById('cakeCustomer'));customerOptions(document.getElementById('donutCustomer'));recipeOptions();packagingOptions();renderAddonChoices();cakeCalc();donutCalc();renderOrders();renderCustomers();renderHome();renderSync()}
document.getElementById('importLaptop').addEventListener('change',async e=>{
  const f=e.target.files[0];
  if(!f)return;
  try{
    const p=JSON.parse(await f.text());
    applyLaptopSnapshot(p,false);
    S.last_sync=new Date().toLocaleString();
    prune();
    save();
    alert('Laptop data imported successfully.');
    e.target.value='';
  }catch(err){alert('Could not import: '+err.message)}
});

document.getElementById('pairPhone').onclick=()=>{
  const server=normaliseLanServer(document.getElementById('lanServer').value);
  const code=String(document.getElementById('lanCode').value||'').trim();
  const name=String(document.getElementById('lanDeviceName').value||'Sugar Canvas Phone').trim();
  if(!server){alert('Enter the Laptop address shown in Sugar Canvas Settings.');return}
  if(!/^\d{6}$/.test(code)){alert('Enter the 6-digit pairing code shown on the laptop.');return}
  S.lan=S.lan||{};
  S.lan.server=server;
  S.lan.device_name=name;
  localStorage.setItem(KEY,JSON.stringify(S));
  const u=server+'/pair?code='+encodeURIComponent(code)+'&device_id='+encodeURIComponent(S.device_id)+'&device_name='+encodeURIComponent(name)+'&return='+encodeURIComponent(currentReturnUrl());
  location.href=u;
};

document.getElementById('saveLanAddress').onclick=()=>{
  const s=normaliseLanServer(document.getElementById('pairedServer').value);
  if(!s){alert('Enter a valid laptop address.');return}
  S.lan.server=s;
  save();
  alert('Laptop address updated. Pairing is still remembered.');
};

document.getElementById('forgetLaptop').onclick=()=>{
  if(!confirm('Forget this laptop on the phone? You will need the pairing code again.'))return;
  S.lan={server:'',token:'',device_id:'',device_name:''};
  save();
};

document.getElementById('syncNow').onclick=async()=>{
  try{
    if(!(S.lan&&S.lan.token&&S.lan.server)){alert('Pair this phone first.');return}
    const payload={schema:'sugar_canvas_phone_changes',version:4,generated_at:nowIso(),device_id:S.device_id,customers:Object.values(S.changes.customers),orders:Object.values(S.changes.orders)};
    const enc=b64urlJson(payload);
    if(enc.length>70000){alert('There are too many unsynced changes for Wi-Fi bridge sync. Use Backup File Sync once, then continue with Wi-Fi sync.');return}
    const ts=Math.floor(Date.now()/1000).toString();
    const sig=await hmacHex(S.lan.token,ts+'.'+enc);
    const u=S.lan.server+'/sync?device_id='+encodeURIComponent(S.device_id)+'&ts='+encodeURIComponent(ts)+'&payload='+encodeURIComponent(enc)+'&sig='+encodeURIComponent(sig)+'&return='+encodeURIComponent(currentReturnUrl());
    location.href=u;
  }catch(err){alert('Could not start Wi-Fi sync: '+err.message)}
};

document.getElementById('exportLaptop').onclick=()=>{
  const payload={schema:'sugar_canvas_phone_changes',version:4,generated_at:nowIso(),device_id:S.device_id,customers:Object.values(S.changes.customers),orders:Object.values(S.changes.orders)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`sugar_canvas_phone_changes_${todayIso()}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  alert('Changes file created. Send it to the laptop and use Sugar Canvas → Settings → Import from Phone.');
};

handleLanReturn();
document.getElementById('cakeDate').value=todayIso();
document.getElementById('donutDate').value=todayIso();
prune();
save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
