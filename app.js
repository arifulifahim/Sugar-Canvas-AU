
const KEY='sugarCanvasPhoneV1';
function nowIso(){return new Date().toISOString()}
function todayIso(){return new Date().toISOString().slice(0,10)}
function money(n){return '$'+Number(n||0).toFixed(2)}
function uid(){return 'ph_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch(e){return fresh()}}
function fresh(){return {device_id:uid(),last_sync:'Never',recipes:[],packaging:[],customers:[],orders:[],donut_menu:{bomboloni:{4:22,6:30,8:38},ring_glazed:{4:16,6:20,8:27},ring_assorted:{4:19,6:26,8:34}},changes:{customers:{},orders:{}}}}
let S=load();
function save(){localStorage.setItem(KEY,JSON.stringify(S));renderAll()}
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
  S.recipes.filter(r=>r.type==='Cake').sort((a,b)=>a.name.localeCompare(b.name)).forEach(r=>{let o=document.createElement('option');o.value=r.id;o.textContent=r.name;sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function packagingOptions(){
  const sel=document.getElementById('cakePackaging'),old=sel.value;sel.innerHTML='<option value="">None</option>';
  S.packaging.forEach(p=>{let o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} (${money(p.total_cost)})`;sel.appendChild(o)});if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function cakeCalc(){
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  const w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1),custom=Number(document.getElementById('cakeCustom').value||0);
  const p=S.packaging.find(x=>x.id===document.getElementById('cakePackaging').value); const pack=Number(p?.total_cost||0);
  if(!r){document.getElementById('cakeCost').textContent='$0.00';document.getElementById('cakeSuggested').textContent='$0.00';return {cost:0,suggested:0,pack:0}}
  const scaled=Number(r.base_cost||0)*(w/Number(r.base_weight_g||500))*q;
  const cost=scaled+pack; const suggested=(scaled*2)+pack+custom;
  document.getElementById('cakeCost').textContent=money(cost);document.getElementById('cakeSuggested').textContent=money(suggested);
  const fp=document.getElementById('cakeFinalPrice'); if(!fp.dataset.manual)fp.value=suggested.toFixed(2);
  return {cost,suggested,pack,recipe:r,packaging:p}
}
['cakeRecipe','cakeWeight','cakeQty','cakePackaging','cakeCustom'].forEach(id=>document.getElementById(id).addEventListener('input',cakeCalc));
document.getElementById('cakeFinalPrice').addEventListener('input',e=>e.target.dataset.manual='1');
function addCustomer(){
  const name=prompt('Customer name');if(!name)return null;const phone=prompt('Phone number (optional)')||'';const address=prompt('Address (optional)')||'';
  const c={id:uid(),phone_sync_id:uid(),name:name.trim(),phone,address,social:'',modified_at:nowIso()};S.customers.push(c);markCustomer(c);save();return c;
}
document.getElementById('addCustomerBtn').onclick=addCustomer;document.getElementById('cakeAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('cakeCustomer').value=c.name};document.getElementById('donutAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('donutCustomer').value=c.name};
function saveCake(status){
  const customer=document.getElementById('cakeCustomer').value,r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);if(!customer||!r){alert('Choose customer and recipe.');return}
  const calc=cakeCalc(),w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1),custom=Number(document.getElementById('cakeCustom').value||0),price=Number(document.getElementById('cakeFinalPrice').value||calc.suggested),dep=Number(document.getElementById('cakeDeposit').value||0);
  const o={phone_sync_id:uid(),customer,item:r.name,recipe:r.name,quantity:q,target_weight_g:w,date:document.getElementById('cakeDate').value||todayIso(),base_cost:calc.cost,cost:calc.cost,packaging_type:calc.packaging?.name||'',packaging_cost:calc.pack,customisation:custom,price,deposit:dep,status,workflow_status:status==='Confirmed'?'Confirmed':'',note:document.getElementById('cakeNote').value,created:todayIso(),modified_at:nowIso(),items:[{item:r.name,recipe:r.name,quantity:q,target_weight_g:w,base_cost:calc.cost,packaging_cost:calc.pack,customisation:custom,price}]};
  S.orders.unshift(o);markOrder(o);save();alert(status==='Quotation'?'Quote saved on phone.':'Order confirmed and saved on phone.');go('orders');
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
  rows.forEach(o=>{const d=document.createElement('div');d.className='list-item';d.innerHTML=`<div class="list-top"><b>${o.customer||'Customer'}</b><span class="status">${o.workflow_status||o.status||''}</span></div><div>${o.item||'Order'}</div><div class="small">${o.date||''} • ${o.order_no||'Phone order'}</div><div class="list-top"><span class="small">${o.note||''}</span><span class="money">${money(o.price)}</span></div>`;list.appendChild(d)})
}
document.getElementById('orderSearch').oninput=renderOrders;document.getElementById('orderFilter').onchange=renderOrders;
function renderCustomers(){const list=document.getElementById('customersList');list.innerHTML='';[...S.customers].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(c=>{const d=document.createElement('div');d.className='list-item';d.innerHTML=`<b>${c.name}</b><div class="small">${c.phone||''}</div><div class="small">${c.address||''}</div>`;list.appendChild(d)});if(!S.customers.length)list.innerHTML='<div class="card muted">No customers yet.</div>'}
function renderHome(){const active=S.orders.filter(o=>!['completed','cancelled','finalised'].includes(String(o.workflow_status||o.status||'').toLowerCase())).length,quotes=S.orders.filter(o=>String(o.status||'').toLowerCase()==='quotation').length,changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length;document.getElementById('homeSummary').innerHTML=`<div class="list-item"><span>Active orders</span><b>${active}</b></div><div class="list-item"><span>Quotes</span><b>${quotes}</b></div><div class="list-item"><span>Changes waiting for laptop</span><b>${changes}</b></div>`}
function renderSync(){const changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length;document.getElementById('syncStatus').innerHTML=`<p><b>Last laptop import:</b> ${S.last_sync}</p><p><b>Changes waiting:</b> ${changes}</p><p><b>Phone history:</b> last 30 days + active/future orders</p>`;document.getElementById('syncBadge').textContent=changes?`${changes} waiting`:'Up to date'}
function renderAll(){customerOptions(document.getElementById('cakeCustomer'));customerOptions(document.getElementById('donutCustomer'));recipeOptions();packagingOptions();cakeCalc();donutCalc();renderOrders();renderCustomers();renderHome();renderSync()}
document.getElementById('importLaptop').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());if(p.schema!=='sugar_canvas_phone_sync')throw new Error('Wrong sync file');
  S.recipes=p.recipes||[];S.packaging=p.packaging||[];S.donut_menu=p.donut_menu||S.donut_menu;
  const byCid=new Map(S.customers.map(c=>[c.phone_sync_id||c.id,c]));(p.customers||[]).forEach(c=>{const id=c.phone_sync_id||c.id;if(!S.changes.customers[id])byCid.set(id,c)});S.customers=[...byCid.values()];
  const byOid=new Map(S.orders.map(o=>[o.phone_sync_id||o.id||o.order_no,o]));(p.orders||[]).forEach(o=>{const id=o.phone_sync_id||o.id||o.order_no;if(!S.changes.orders[id])byOid.set(id,o)});S.orders=[...byOid.values()];S.last_sync=new Date().toLocaleString();prune();save();alert('Laptop data imported successfully.');e.target.value=''}catch(err){alert('Could not import: '+err.message)}});
document.getElementById('exportLaptop').onclick=()=>{const payload={schema:'sugar_canvas_phone_changes',version:1,generated_at:nowIso(),device_id:S.device_id,customers:Object.values(S.changes.customers),orders:Object.values(S.changes.orders)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sugar_canvas_phone_changes_${todayIso()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);alert('Changes file created. Send it to the laptop and use Sugar Canvas → Settings → Import from Phone.')}
document.getElementById('cakeDate').value=todayIso();document.getElementById('donutDate').value=todayIso();prune();save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
