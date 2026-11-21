
const KEY='sugarCanvasPhoneV1';
function nowIso(){return new Date().toISOString()}
function todayIso(){return new Date().toISOString().slice(0,10)}
function money(n){return '$'+Number(n||0).toFixed(2)}
function titleItem(v){return String(v||'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAnd\b/g,'and').replace(/\bOf\b/g,'of')}
function uid(){return 'ph_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch(e){return fresh()}}
function fresh(){return {device_id:uid(),last_sync:'Never',business:{name:'Sugar Canvas AU',abn:'',address:'',email:'',phone:'',facebook_url:'https://www.facebook.com/share/1E2qUGaMEP/',instagram_url:'https://www.instagram.com/sugarcanvas.au',gst_registered:false},recipes:[],ingredients:[],suppliers:[],purchases:[],packaging:[],customers:[],orders:[],donut_menu:{bomboloni:{4:22,6:30,8:38},ring_glazed:{4:16,6:20,8:27},ring_assorted:{4:19,6:26,8:34}},changes:{customers:{},orders:{},purchases:{}},cakeDraft:{addons:[],customAddons:[]},donutDraft:{customItems:[]},premium_donut_menu:{},lan:{server:'',token:'',device_id:'',device_name:''}}}
const APP_VERSION='25.0.0';
let S=load();if(!S.ingredients)S.ingredients=[];if(!S.suppliers)S.suppliers=[];if(!S.finance_payment_methods)S.finance_payment_methods=[{id:'',name:'Cash',type:'Cash'}];if(!S.purchases)S.purchases=[];if(!S.changes.purchases)S.changes.purchases={};if(!S.cakeDraft)S.cakeDraft={addons:[],customAddons:[]};if(!S.donutDraft)S.donutDraft={customItems:[]};if(!Array.isArray(S.donutDraft.customItems))S.donutDraft.customItems=[];if(!S.premium_donut_menu)S.premium_donut_menu={};if(!Number(S.cakeDraft.profitPct)||Number(S.cakeDraft.profitPct)<80)S.cakeDraft.profitPct=80;if(!('editingOrderId' in S))S.editingOrderId='';if(!('selectedOrderId' in S))S.selectedOrderId='';if(!('selectedRecipeId' in S))S.selectedRecipeId='';
function save(){localStorage.setItem(KEY,JSON.stringify(S));renderAll()}
function normaliseLanServer(v){let s=String(v||'').trim().replace(/\/$/,'');if(!s)return '';if(!/^https?:\/\//i.test(s))s='http://'+s;return s}
function b64urlJson(obj){const bytes=new TextEncoder().encode(JSON.stringify(obj));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decodeB64urlJson(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const bytes=new Uint8Array([...bin].map(c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(bytes))}
async function hmacHex(secret,msg){const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(msg));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function applyLaptopSnapshot(p,clearChanges=true){if(!p||p.schema!=='sugar_canvas_phone_sync')throw new Error('Wrong laptop snapshot');S.business=p.business||S.business||{};S.recipes=p.recipes||[];S.ingredients=p.ingredients||S.ingredients||[];S.suppliers=p.suppliers||[];S.finance_payment_methods=p.finance_payment_methods||S.finance_payment_methods||[{id:'',name:'Cash',type:'Cash'}];S.purchases=p.purchases||S.purchases||[];S.packaging=p.packaging||[];S.donut_menu=p.donut_menu||S.donut_menu;S.premium_donut_menu=p.premium_donut_menu||S.premium_donut_menu||{};
  const changedCustomers=new Set(Object.keys(S.changes.customers||{}));const changedOrders=new Set(Object.keys(S.changes.orders||{}));
  const byCid=new Map(S.customers.map(c=>[c.phone_sync_id||c.id,c]));(p.customers||[]).forEach(c=>{const id=c.phone_sync_id||c.id;if(clearChanges||!changedCustomers.has(id))byCid.set(id,c)});S.customers=[...byCid.values()];
  const byOid=new Map(S.orders.map(o=>[o.phone_sync_id||o.id||o.order_no,o]));(p.orders||[]).forEach(o=>{const id=o.phone_sync_id||o.id||o.order_no;if(clearChanges||!changedOrders.has(id))byOid.set(id,o)});S.orders=[...byOid.values()];
  if(clearChanges)S.changes={customers:{},orders:{},purchases:{}};S.last_sync=new Date().toLocaleString();prune();}
function currentReturnUrl(){return location.origin+location.pathname}
function handleLanReturn(){const raw=location.hash||'';if(!raw.startsWith('#lanPair=')&&!raw.startsWith('#lanSync='))return false;try{const pair=raw.startsWith('#lanPair=');const value=raw.substring(pair?9:9);const data=decodeB64urlJson(value);if(!data.ok)throw new Error('Sync failed');if(pair){S.lan={server:data.server||'',token:data.token||'',device_id:data.device_id||S.device_id,device_name:S.lan?.device_name||'Phone'};applyLaptopSnapshot(data.snapshot,true);alert('Phone paired successfully. Future Wi-Fi syncs will not need the pairing code.')}else{applyLaptopSnapshot(data.snapshot,true);alert('Sugar Canvas synced successfully.');}history.replaceState(null,'',location.pathname+location.search);localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){history.replaceState(null,'',location.pathname+location.search);alert('Could not finish Wi-Fi sync: '+e.message);return false}}

function markCustomer(c){S.changes.customers[c.phone_sync_id||c.id]=c}
function markOrder(o){
  const id=orderKey(o);
  if(!id)return;
  o.phone_sync_id=id;
  S.changes.orders[id]={...o,phone_sync_id:id};
}
function markPurchase(p){S.changes.purchases[p.phone_sync_id]=p}
function orderKey(o){return String(o?.phone_sync_id||o?.id||o?.order_no||'')}
function findOrder(id){return S.orders.find(o=>orderKey(o)===String(id||''))}
function isDonutOrder(o){return String(o?.product_type||'').toLowerCase()==='donut'||(/donut|bomboloni|ring/i.test(String(o?.item||'')) && !String(o?.recipe||'').trim())}
function setDeliveryFields(prefix,needed,charge){
  const sel=document.getElementById(prefix+'DeliveryNeeded');
  const input=document.getElementById(prefix+'DeliveryCharge');
  const wrap=document.getElementById(prefix+'DeliveryChargeWrap');
  if(!sel||!input||!wrap)return;
  sel.value=needed?'yes':'no';
  input.value=Number(charge||0);
  wrap.hidden=!needed;
}
function clearEditMode(){
  S.editingOrderId='';
  document.getElementById('cancelCakeEdit').hidden=true;
  document.getElementById('cancelDonutEdit').hidden=true;
  document.getElementById('saveCakeQuote').textContent='Save Quote';
  document.getElementById('confirmCakeOrder').textContent='Confirm Order';
  document.getElementById('saveDonutQuote').textContent='Save Quote';
  document.getElementById('confirmDonutOrder').textContent='Confirm Order';
}

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

function addonRawCostFor(recipe,w,q){
  return Number(recipe?.base_cost||0)*(Number(w||500)/Number(recipe?.base_weight_g||500))*Number(q||1);
}
function adjustedAddonCost(rawCost){
  const raw=Math.max(0,Number(rawCost||0));
  return (raw*1.5)+2;
}
function adjustedPackagingCost(rawCost){
  const raw=Math.max(0,Number(rawCost||0));
  return raw*1.5;
}

function minimumConfirmDeposit(total,cost){
  return Math.ceil(Math.max(0,Number(total||0)*0.25,Number(cost||0)));
}
function getSelectedAddonRows(){
  const w=Number(document.getElementById('cakeWeight').value||500);
  const q=Number(document.getElementById('cakeQty').value||1);
  const recipeRows=(S.cakeDraft.addons||[]).map(id=>{
    const r=S.recipes.find(x=>x.id===id);
    if(!r)return null;
    const rawCost=addonRawCostFor(r,w,q);
    const adjustedCost=adjustedAddonCost(rawCost);
    return {id:r.id,item:r.name,recipe:r.name,item_type:'Add-On',quantity:q,target_weight_g:w,raw_cost:rawCost,base_cost:adjustedCost,cost:adjustedCost,manual:false};
  }).filter(Boolean);
  const custom=(S.cakeDraft.customAddons||[]).map(x=>{
    const rawCost=Math.max(0,Number(x.cost||0));
    const adjustedCost=adjustedAddonCost(rawCost);
    return {id:x.id,item:x.name,item_type:'Add-On',quantity:1,target_weight_g:w,raw_cost:rawCost,base_cost:adjustedCost,cost:adjustedCost,manual:true};
  });
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
      const raw=addonRawCostFor(r,w,q), adjusted=adjustedAddonCost(raw);
      b.innerHTML=`${titleItem(r.name)}<span class="addon-price">${money(adjusted)} adjusted cost</span>`;
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
    row.innerHTML=`<div><b>${titleItem(a.item)}</b><div class="small">${a.manual?'Custom Add-On':`${Math.round(a.target_weight_g)}g cake`} • raw ${money(a.raw_cost)} + 50% + $2</div></div><div><b>${money(a.base_cost)}</b> <button class="remove-mini" type="button">×</button></div>`;
    row.querySelector('button').onclick=()=>{
      if(a.manual)S.cakeDraft.customAddons=(S.cakeDraft.customAddons||[]).filter(x=>x.id!==a.id);
      else S.cakeDraft.addons=(S.cakeDraft.addons||[]).filter(id=>id!==a.id);
      localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();cakeCalc();
    };
    selectedBox.appendChild(row);
  });
}
function getProfitPct({validate=false}={}){
  const input=document.getElementById('cakeProfitPct');
  const raw=String(input.value||'').trim();

  if(raw===''){
    if(validate){
      alert('Profit percentage cannot be blank. Minimum profit is 80%.');
      input.focus();
    }
    return null;
  }

  const pct=Number(raw);
  if(!Number.isFinite(pct)){
    if(validate){
      alert('Please enter a valid profit percentage.');
      input.focus();
      input.select();
    }
    return null;
  }

  if(pct<80){
    if(validate){
      alert('Minimum profit is 80%. Please enter 80% or more.');
      input.focus();
      input.select();
    }
    return null;
  }

  S.cakeDraft.profitPct=pct;
  localStorage.setItem(KEY,JSON.stringify(S));
  return pct;
}

function roundSellingUp(n){return Math.ceil(Number(n||0));}
function minimumSellingPrice80(totalCost){return roundSellingUp(Number(totalCost||0)*1.8);}

function getDeliveryCharge(prefix){
  const needed=document.getElementById(prefix+'DeliveryNeeded')?.value==='yes';
  if(!needed)return 0;
  return Math.max(0,Number(document.getElementById(prefix+'DeliveryCharge')?.value||0));
}
function updateDeliveryVisibility(prefix){
  const needed=document.getElementById(prefix+'DeliveryNeeded')?.value==='yes';
  const wrap=document.getElementById(prefix+'DeliveryChargeWrap');
  if(wrap)wrap.hidden=!needed;
  if(!needed){
    const input=document.getElementById(prefix+'DeliveryCharge');
    if(input)input.value='0';
  }
}
function cakeCalc(){
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  const w=Number(document.getElementById('cakeWeight').value||500);
  const q=Number(document.getElementById('cakeQty').value||1);
  const p=S.packaging.find(x=>x.id===document.getElementById('cakePackaging').value);

  const componentPack=Number(p?.box_price||0)+Number(p?.board_price||0);
  const rawPack=componentPack>0?componentPack:Number(p?.total_cost||0);
  const pack=adjustedPackagingCost(rawPack);
  const customizationCost=Math.max(0,Number(document.getElementById('cakeCustomizationCost').value||0));

  const addonRows=getSelectedAddonRows();
  const addonCost=addonRows.reduce((a,x)=>a+Number(x.base_cost||0),0);

  const recipeCost=r ? Number(r.base_cost||0)*(w/Number(r.base_weight_g||500))*q : 0;
  const cost=recipeCost+addonCost+pack+customizationCost;

  const pct=getProfitPct({validate:false});
  const selling=pct===null ? null : roundSellingUp(cost*(1+pct/100));
  const deliveryCharge=getDeliveryCharge('cake');
  const customerPrice=selling===null ? null : selling+deliveryCharge;

  document.getElementById('cakeCost').textContent=money(cost);
  document.getElementById('cakeAddonTotal').textContent=money(addonCost);
  document.getElementById('cakeSellingPrice').textContent=customerPrice===null?'—':'$'+Number(customerPrice).toFixed(0);

  return {
    cost,selling,customerPrice,deliveryCharge,profitPct:pct,
    rawPack,pack,recipe:r,packaging:p,recipeCost,
    addonRows,addonCost,customizationCost
  };
}

['cakeRecipe','cakeWeight','cakeQty','cakePackaging','cakeCustomizationCost','cakeDeliveryCharge'].forEach(id=>
  document.getElementById(id).addEventListener('input',()=>{renderAddonChoices();cakeCalc()})
);

document.getElementById('cakeProfitPct').addEventListener('input',()=>{cakeCalc()});
document.getElementById('cakeProfitPct').addEventListener('blur',()=>{
  const pct=getProfitPct({validate:true});
  if(pct!==null)cakeCalc();
});
document.getElementById('cakeDeliveryNeeded').addEventListener('change',()=>{updateDeliveryVisibility('cake');cakeCalc()});

document.getElementById('addCustomAddon').onclick=()=>{
  const name=prompt('Custom add-on description, for example Fresh Flowers or Special Topper');
  if(!name)return;
  const raw=prompt('What is the RAW cost of this add-on to you? The app will add 50% + $2. ($)');
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
  const pct=getProfitPct({validate:true});if(pct===null)return null;
  const calc=cakeCalc(),w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const lines=[{name:`${titleItem(r.name)} • ${Math.round(w)}g`,cost:calc.recipeCost,kind:'Cake Cost'}];
  calc.addonRows.forEach(a=>lines.push({
    name:titleItem(a.item),
    cost:Number(a.base_cost||0),
    kind:`Add-On Adjusted Cost • raw ${money(a.raw_cost)} + 50% + $2`
  }));
  if(calc.packaging&&calc.pack>0)lines.push({
    name:titleItem(calc.packaging.name),
    cost:calc.pack,
    kind:`Packaging Adjusted Cost • raw ${money(calc.rawPack)} + 50%`
  });
  if(calc.customizationCost>0)lines.push({name:'Customization',cost:calc.customizationCost,kind:'Customization Cost'});
  return {customer,r,calc,w,q,lines,totalCost:calc.cost,selling:calc.selling,customerPrice:calc.customerPrice,deliveryCharge:calc.deliveryCharge,profitPct:calc.profitPct};
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

function validateFinalCustomerPrice(){
  const calc=cakeCalc();
  const input=document.getElementById('cakeFinalPrice');
  const raw=String(input.value||'').trim();
  if(raw==='')return true;

  const final=Number(raw);
  if(!Number.isFinite(final)){
    alert('Please enter a valid final customer price.');
    input.focus();
    input.select();
    return false;
  }

  const minPrice=minimumSellingPrice80(calc.cost)+Number(calc.deliveryCharge||0);
  if(final<minPrice){
    alert(`This price is below the minimum 80% profit level. Minimum customer price for this cake is $${minPrice}.`);
    input.focus();
    input.select();
    return false;
  }
  return true;
}

document.getElementById('cakeFinalPrice').addEventListener('input',e=>{e.target.dataset.manual='1';updateReviewProfit()});
document.getElementById('cakeFinalPrice').addEventListener('blur',()=>{validateFinalCustomerPrice()});
document.getElementById('reviewCakePrice').onclick=()=>{
  const pct=getProfitPct({validate:true});
  if(pct===null)return;
  if(renderCakeReview())go('cakeReview');
};

function addCustomer(){
  const name=prompt('Customer name');if(!name)return null;const phone=prompt('Phone number (optional)')||'';const email=prompt('Email (optional)')||'';const address=prompt('Address (optional)')||'';
  const c={id:uid(),phone_sync_id:uid(),name:name.trim(),phone,email,address,social:'',modified_at:nowIso()};S.customers.push(c);markCustomer(c);save();return c;
}
document.getElementById('addCustomerBtn').onclick=addCustomer;document.getElementById('cakeAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('cakeCustomer').value=c.name};document.getElementById('donutAddCustomer').onclick=()=>{const c=addCustomer();if(c)document.getElementById('donutCustomer').value=c.name};
function saveCake(status){
  const customer=document.getElementById('cakeCustomer').value;
  const r=S.recipes.find(x=>x.id===document.getElementById('cakeRecipe').value);
  if(!customer||!r){alert('Choose customer and cake.');return}
  const pct=getProfitPct({validate:true});if(pct===null)return;
  if(!validateFinalCustomerPrice())return;
  const calc=cakeCalc(),w=Number(document.getElementById('cakeWeight').value||500),q=Number(document.getElementById('cakeQty').value||1);
  const price=Number(document.getElementById('cakeFinalPrice').value||calc.customerPrice);
  const dep=Number(document.getElementById('cakeDeposit').value||0);
  const minConfirm=minimumConfirmDeposit(price,calc.cost);
  if(status==='Confirmed' && dep+0.001<minConfirm){
    alert('This quotation cannot be confirmed yet.\n\nMinimum payment required: '+money(minConfirm)+'\n\nThe minimum is the higher of 25% of the order total or the order cost price, rounded up to a whole dollar.\n\nSave it as a Quote if the customer is not ready to pay the advance.');
    return;
  }

  const cakeLine={item:r.name,recipe:r.name,item_type:'Cake',quantity:q,target_weight_g:w,base_cost:calc.recipeCost,packaging_type:'',packaging_cost:0,customisation:0,price:0};
  const addonLines=calc.addonRows.map(a=>({
    item:a.item,recipe:a.recipe||'',recipe_id:a.id||'',item_type:'Add-On',
    quantity:a.quantity||1,target_weight_g:w,raw_cost:Number(a.raw_cost||0),
    base_cost:Number(a.base_cost||0),packaging_type:'None',packaging_cost:0,
    customisation:0,price:0,manual_custom_addon:!!a.manual
  }));

  const receipt=buildCakeReceipt();
  const existing=S.editingOrderId?findOrder(S.editingOrderId):null;
  const syncId=existing?orderKey(existing):uid();
  const o={
    ...(existing||{}),phone_sync_id:syncId,customer,item:r.name,recipe:r.name,quantity:q,target_weight_g:w,
    date:document.getElementById('cakeDate').value||todayIso(),
    base_cost:calc.cost,cost:calc.cost,
    packaging_type:calc.packaging?.name||'',packaging_raw_cost:calc.rawPack,packaging_cost:calc.pack,
    customisation:calc.customizationCost,addon_cost:calc.addonCost,profit_percent:calc.profitPct,
    calculated_selling_price:calc.selling,
    pricing_formula_version:'v311_unified',
    delivery_needed:document.getElementById('cakeDeliveryNeeded').value==='yes',
    delivery_charge:calc.deliveryCharge,
    price,deposit:dep,status,minimum_deposit_required:minConfirm,
    workflow_status:status==='Confirmed'?'Confirmed':(existing?.workflow_status||''),
    note:document.getElementById('cakeNote').value,
    created:existing?.created||todayIso(),modified_at:nowIso(),
    price_breakdown:receipt?.lines||[],items:[cakeLine,...addonLines]
  };
  if(existing){
    const idx=S.orders.findIndex(x=>orderKey(x)===syncId);
    if(idx>=0)S.orders[idx]=o;
  }else S.orders.unshift(o);
  markOrder(o);
  S.cakeDraft={addons:[],customAddons:[],profitPct:calc.profitPct};
  document.getElementById('cakeCustomizationCost').value='0';
  setDeliveryFields('cake',false,0);
  document.getElementById('cakeFinalPrice').dataset.manual='';
  clearEditMode();
  localStorage.setItem(KEY,JSON.stringify(S));renderAddonChoices();save();
  alert(existing?'Order updated on phone.':(status==='Quotation'?'Quote saved on phone.':'Order confirmed and saved on phone.'));
  go('orders');
}
document.getElementById('saveCakeQuote').onclick=()=>saveCake('Quotation');document.getElementById('confirmCakeOrder').onclick=()=>saveCake('Confirmed');
document.getElementById('cancelCakeEdit').onclick=()=>{clearEditMode();S.cakeDraft={addons:[],customAddons:[],profitPct:80};save();go('orders')};
function donutCustomTotal(){return (S.donutDraft?.customItems||[]).reduce((sum,x)=>sum+Math.max(0,Number(x.amount||0)),0)}
function renderDonutCustomItems(){
  const box=document.getElementById('donutCustomItems');if(!box)return;
  const rows=S.donutDraft?.customItems||[];box.innerHTML='';
  if(!rows.length){box.innerHTML='<div class="small">No custom items added.</div>';return}
  rows.forEach(x=>{
    const row=document.createElement('div');row.className='selected-addon-row';
    row.innerHTML=`<div><b>${escapeHtml(x.description||'Custom item')}</b><div class="small">Qty ${Number(x.quantity||1)}</div></div><div><b>${money(x.amount)}</b> <button class="remove-mini" type="button">×</button></div>`;
    row.querySelector('button').onclick=()=>{S.donutDraft.customItems=rows.filter(y=>y.id!==x.id);localStorage.setItem(KEY,JSON.stringify(S));renderDonutCustomItems();donutCalc()};
    box.appendChild(row);
  });
}
function addDonutCustomItem(){
  const description=prompt('Custom item / extra description\nExample: 12 mini bomboloni, special flavour mix, extra gift box');
  if(!description)return;
  const qRaw=prompt('Quantity for this custom line','1');if(qRaw===null)return;
  const quantity=Math.max(1,Number(qRaw||1));if(!Number.isFinite(quantity)){alert('Enter a valid quantity.');return}
  const aRaw=prompt('Customer price to ADD for this line (total $)\nExample: 45.00');if(aRaw===null)return;
  const amount=Number(String(aRaw).replace('$','').replace(',','').trim());
  if(!Number.isFinite(amount)||amount<0){alert('Enter a valid amount.');return}
  S.donutDraft.customItems.push({id:uid(),description:description.trim(),quantity,amount:Number(amount.toFixed(2))});
  localStorage.setItem(KEY,JSON.stringify(S));renderDonutCustomItems();donutCalc();
}
function renderPremiumDonutMenu(){
  const box=document.getElementById('premiumDonutMenu');if(!box)return;
  const data=S.premium_donut_menu||{};
  const hasData=(Array.isArray(data)&&data.length)||(data&&typeof data==='object'&&Object.keys(data).length);
  box.innerHTML=hasData
    ? '<div class="small"><b>Premium donut menu synced.</b> Premium quick-select buttons will use the exact uploaded menu data.</div>'
    : '<div class="small">Premium donut menu: upload your menu to ChatGPT, then it can be added here as quick-select options without changing your prices.</div>';
}
document.getElementById('addDonutCustomItem').onclick=addDonutCustomItem;
function donutCalc(){
  const k=document.getElementById('donutKind').value,q=document.getElementById('donutQty').value;
  const base=k==='custom'?0:Number(S.donut_menu?.[k]?.[q]||0);
  const custom=donutCustomTotal();
  const delivery=getDeliveryCharge('donut');
  const total=base+custom+delivery;
  document.getElementById('donutBasePrice').textContent=money(base);
  const ce=document.getElementById('donutCustomTotal');if(ce)ce.textContent=money(custom);
  document.getElementById('donutDeliveryPrice').textContent=money(delivery);
  document.getElementById('donutPrice').textContent=money(total);
  return {base,custom,delivery,total};
}
['donutKind','donutQty','donutDeliveryCharge'].forEach(id=>document.getElementById(id).addEventListener('input',donutCalc));
document.getElementById('donutDeliveryNeeded').addEventListener('change',()=>{updateDeliveryVisibility('donut');donutCalc()});
function saveDonut(status){
  const customer=document.getElementById('donutCustomer').value;
  if(!customer){alert('Choose customer.');return}
  const kind=document.getElementById('donutKind').value,q=Number(document.getElementById('donutQty').value);
  const calc=donutCalc(),names={bomboloni:'Bomboloni Assorted',ring_glazed:'Original Glazed Ring Donuts',ring_assorted:'Ring Donut Assorted',custom:'Custom Donut Order'};
  const customItems=[...(S.donutDraft?.customItems||[])];
  if(kind==='custom'&&!customItems.length){alert('Add at least one Custom Item / Extra for a custom donut quotation.');return}
  const dep=Number(document.getElementById('donutDeposit').value||0);
  const minConfirm=minimumConfirmDeposit(calc.total,0);
  if(status==='Confirmed' && dep+0.001<minConfirm){
    alert('This quotation cannot be confirmed yet.\n\nMinimum payment required: '+money(minConfirm)+'\n\nFor this order the minimum is 25% of the total, rounded up to a whole dollar.\n\nSave it as a Quote if the customer is not ready to pay the advance.');
    return;
  }
  const existing=S.editingOrderId?findOrder(S.editingOrderId):null;
  const syncId=existing?orderKey(existing):uid();
  const baseItems=calc.base>0?[{id:uid(),item:`${names[kind]} - ${q} pcs`,item_type:'Donut Menu Item',quantity:q,price:calc.base,base_cost:0,cost:0}]:[];
  const customLines=customItems.map(x=>({id:x.id||uid(),item:x.description,item_type:'Custom Item',quantity:Number(x.quantity||1),price:Number(x.amount||0),base_cost:0,cost:0,manual_customer_price:true}));
  const customSummary=customItems.map(x=>x.description).filter(Boolean).slice(0,2).join(' + ');
  const itemSummary=kind==='custom'?('Custom Donut Order'+(customSummary?' - '+customSummary:'')):`${names[kind]} - ${q} pcs`;
  const totalQty=kind==='custom'?customItems.reduce((s,x)=>s+Number(x.quantity||1),0):q;
  const o={
    ...(existing||{}),phone_sync_id:syncId,customer,item:itemSummary,recipe:'',quantity:totalQty,target_weight_g:0,product_type:'Donut',
    date:document.getElementById('donutDate').value||todayIso(),base_cost:0,cost:0,
    packaging_type:'Donut box',packaging_cost:0,customisation:0,
    delivery_needed:document.getElementById('donutDeliveryNeeded').value==='yes',
    delivery_charge:calc.delivery,price:calc.total,deposit:dep,status,minimum_deposit_required:minConfirm,
    workflow_status:status==='Confirmed'?'Confirmed':(existing?.workflow_status||''),
    note:document.getElementById('donutFlavours').value,donut_kind:kind,donut_menu_price:calc.base,
    custom_customer_items:customItems,
    created:existing?.created||todayIso(),modified_at:nowIso(),items:[...baseItems,...customLines]
  };
  if(existing){
    const idx=S.orders.findIndex(x=>orderKey(x)===syncId);
    if(idx>=0)S.orders[idx]=o;
  }else S.orders.unshift(o);
  markOrder(o);
  S.donutDraft={customItems:[]};
  setDeliveryFields('donut',false,0);clearEditMode();localStorage.setItem(KEY,JSON.stringify(S));renderDonutCustomItems();save();
  alert(existing?'Order updated on phone.':(status==='Quotation'?'Donut quote saved.':'Donut order confirmed.'));
  go('orders');
}
document.getElementById('saveDonutQuote').onclick=()=>saveDonut('Quotation');document.getElementById('confirmDonutOrder').onclick=()=>saveDonut('Confirmed');
document.getElementById('cancelDonutEdit').onclick=()=>{S.donutDraft={customItems:[]};clearEditMode();save();go('orders')};
function renderOrders(){
  const list=document.getElementById('ordersList');
  const q=(document.getElementById('orderSearch').value||'').toLowerCase();
  const f=document.getElementById('orderFilter').value;
  list.innerHTML='';
  let rows=[...S.orders].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  rows=rows.filter(o=>{
    const st=String(o.workflow_status||o.status||'').toLowerCase();
    const active=!['completed','cancelled','finalised'].includes(st);
    if(f==='active'&&!active)return false;
    if(f==='quotation'&&st!=='quotation')return false;
    if(f==='completed'&&!['completed','finalised'].includes(st))return false;
    return `${o.customer} ${o.item} ${o.order_no||''}`.toLowerCase().includes(q);
  });
  if(!rows.length){list.innerHTML='<div class="card muted">No orders found.</div>';return}
  rows.forEach(o=>{
    const d=document.createElement('div');d.className='list-item clickable';
    const delivery=o.delivery_needed?` • Delivery ${money(o.delivery_charge)}`:' • Pickup';
    d.innerHTML=`<div class="list-top"><b>${o.customer||'Customer'}</b><span class="status">${o.workflow_status||o.status||''}</span></div><div>${titleItem(o.item||'Order')}</div><div class="small">${o.date||''} • ${o.order_no||'Phone order'}${delivery}</div><div class="list-top"><span class="small">${o.note||''}</span><span class="money">${money(o.price)}</span></div>`;
    d.onclick=()=>openOrderDetail(orderKey(o));
    list.appendChild(d);
  });
}
function detailRow(label,value){return `<div class="detail-row"><span>${label}</span><b>${value===undefined||value===null||value===''?'—':value}</b></div>`}
function openOrderDetail(id){
  const o=findOrder(id);if(!o)return;
  S.selectedOrderId=orderKey(o);localStorage.setItem(KEY,JSON.stringify(S));
  const box=document.getElementById('orderDetailContent');
  const remaining=Math.max(0,Number(o.price||0)-Number(o.deposit||0));
  let html=`<div class="card detail-card">${detailRow('Customer',o.customer)}${detailRow('Item',titleItem(o.item||'Order'))}${detailRow('Status',o.workflow_status||o.status)}${detailRow('Delivery date',o.date)}${detailRow('Weight',Number(o.target_weight_g||0)>0?`${Number(o.target_weight_g)} g`:'—')}${detailRow('Quantity',o.quantity||1)}</div>`;
  if(Array.isArray(o.items)&&o.items.length){
    html+=`<div class="card detail-card"><div class="detail-section-title">Cake / Add-Ons</div>`;
    o.items.forEach(it=>{
      const raw=Number(it.raw_cost||0),cost=Number(it.base_cost||0);
      html+=detailRow(titleItem(it.item||it.recipe||'Item'),raw>0&&Math.abs(raw-cost)>.001?`${money(cost)} (raw ${money(raw)})`:money(cost));
    });
    html+='</div>';
  }
  html+=`<div class="card detail-card"><div class="detail-section-title">Cost & Price</div>${detailRow('Full Cost',money(o.cost||o.base_cost||0))}${Number(o.addon_cost||0)>0?detailRow('Add-On Cost',money(o.addon_cost)):''}${Number(o.packaging_cost||0)>0?detailRow('Packaging Cost',money(o.packaging_cost)):''}${Number(o.customisation||0)>0?detailRow('Customization Cost',money(o.customisation)):''}${Number(o.profit_percent||0)>0?detailRow('Profit %',`${Number(o.profit_percent).toFixed(0)}%`):''}${detailRow('Delivery',o.delivery_needed?`Yes • ${money(o.delivery_charge)}`:'Pickup')}${detailRow('Customer Price',money(o.price))}${detailRow('Deposit',money(o.deposit))}${detailRow('Balance',money(remaining))}</div>`;
  if(o.note)html+=`<div class="card detail-card"><div class="detail-section-title">Notes</div><div>${o.note}</div></div>`;
  const receiptReady=(
    ['completed','finalised'].includes(String(o.workflow_status||o.status||'').toLowerCase()) ||
    String(o.payment_state||'').toLowerCase()==='paid in full'
  ) && Math.max(0,Number(o.price||0)-Number(o.deposit||0))<=0.01;
  box.innerHTML=html;
  const receiptBtn=document.getElementById('orderReceiptBtn');
  if(receiptBtn){
    receiptBtn.hidden=!receiptReady;
    receiptBtn.disabled=!receiptReady;
    receiptBtn.onclick=receiptReady?(()=>openPosReceipt(o)):null;
  }
  const quoteBtn=document.getElementById('orderQuoteBtn');
  if(quoteBtn){
    const quoteReady=String(o.status||'').toLowerCase()==='quotation'||!!o.quote_no;
    quoteBtn.hidden=!quoteReady;
    quoteBtn.disabled=!quoteReady;
    quoteBtn.onclick=quoteReady?(()=>openQuotation(o)):null;
  }
  const receiptHelp=document.getElementById('orderReceiptHelp');
  if(receiptHelp)receiptHelp.hidden=!receiptReady;
  const completeBtn=document.getElementById('completeOrderBtn');
  const finalStatus=String(o.workflow_status||o.status||'').toLowerCase();
  const completed=['completed','finalised','cancelled'].includes(finalStatus);
  if(completeBtn){
    completeBtn.hidden=finalStatus==='cancelled';
    completeBtn.disabled=completed;
    completeBtn.classList.toggle('completed',completed);
    completeBtn.textContent=finalStatus==='cancelled'?'Order Cancelled':(completed?'✓ Order Completed':'✓ Complete Order');
  }
  go('orderDetail');
}

function customerForOrder(o){
  return (S.customers||[]).find(c=>String(c.name||'').trim().toLowerCase()===String(o.customer||'').trim().toLowerCase())||{};
}
function receiptRef(o){
  return String(o.invoice_no||o.order_no||o.quote_no||o.phone_sync_id||o.id||'ORDER').trim();
}
function latestPaymentMethods(o){
  const methods=[...new Set((o.payments||[]).map(p=>String(p.method||'').trim()).filter(Boolean))];
  return methods.length?methods.join(' + '):'Not recorded';
}
function canvasRoundedRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function loadReceiptLogo(){
  return new Promise(resolve=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src='sugar-canvas-logo.png?v=25';
  });
}
function loadFacebookReviewQr(){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXIAAAFyAQAAAADAX2ykAAACcElEQVR4nO2bQYrjMBBFX40MvZShD5CjKDebM80N7KPkAAP2MqDwZyHJcRiG0LTbHQ+lhYnstygoqlSqXzHxkTX++BAOzjvvvPPOO+/8v3irq8PMOhiXX8zt23lHe5zfmE+SpAkkZUjKQLwaECRJeuS/2h7nN+bnJULbVsPclU2N5F3tcf5reDvPZmY9kKbw9+Xp1e13/ikfpIGg4uQXsMf5DfgoaQAYe7AzQNK15OxyJu9rj/Ob8qPds3J7ML8JuJXyeV97nN+IR4+rRLKm9jk9fh5ezX7nn6zi1SSphq4yGqIELPVVrIj792j8cvG5dYyn3AnA0qXl4/SrB+a2fTn7nf8AP3cw2luN2nIIQ0nS32GP85/m2/k7BdWsHDNSu/re33l+PiS/nL8ZINRDmFgrrVpuKeP11SH55t+JWlpJGQ2sA7uAHr9H5Ft9FXOn0YKM+BtLU19eGwSAkG0fe5zflm95N66TdFGSBihN6KYpefwejy/xa9BlmN8Fc28QBcQJG09XE4D2scf5bXnW4m7ratz7G7WT5fXzsfnq5Lm2me3ndDMNMWPWB5Eub37/PSbf6qu55y72liYW8daRBhBcXV84Mm92kur8VX8zOxfpKKgJS8Hj98j8evRqCtLAzaSL2Up42NMe57fl7/OT5RAee2A8ZVpP2uevDspXx6UBYH5HzCFbmt5zcW0pnYeb+f3okPxDf/KuKgAa4jKV4/rv/8KvvJqmul2Nc7y8/c4/45esXOc3ahH9bfY4/xl+NZ9TROD6aNJvydnevzoq/9CfJDR9f9Ecqmtd/z0ob3rOrJb/v9t555133nnnN+D/AFHOtAVO5CMvAAAAAElFTkSuQmCC';
  });
}
async function buildPosReceiptCanvas(o){
  const width=720, height=1320;
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,width,height);
  const b=S.business||{}, cust=customerForOrder(o);
  const total=Number(o.price||0), paid=Number(o.deposit||0), balance=Math.max(0,total-paid);
  const delivery=Math.max(0,Number(o.delivery_charge||0));
  const goodsTotal=Math.max(0,total-delivery);
  const qty=Math.max(1,Number(o.quantity||1));
  const receiptNo=receiptRef(o);
  const orderNo=String(o.order_no||o.quote_no||o.phone_sync_id||o.id||'').trim();
  const issueDate=todayIso();
  const saleDate=o.completed_date||o.full_payment_date||o.date||issueDate;

  x.fillStyle='#38232d';x.textAlign='center';
  const logo=await loadReceiptLogo();
  if(logo){
    const max=110,scale=Math.min(max/logo.width,max/logo.height);
    x.drawImage(logo,(width-logo.width*scale)/2,30,logo.width*scale,logo.height*scale);
  }
  let y=logo?160:58;
  x.font='bold 34px Arial';x.fillText(b.name||'Sugar Canvas AU',width/2,y);y+=32;
  x.font='18px Arial';x.fillStyle='#6f5963';
  x.fillText('ABN '+(b.abn||'Not synced'),width/2,y);y+=26
  const contact=[b.email,b.phone].filter(Boolean).join('  •  ');
  if(contact){x.fillText(contact,width/2,y);y+=24}
  if(b.address){x.fillText(String(b.address).slice(0,70),width/2,y);y+=24}
  x.font='bold 21px Arial';x.fillStyle='#38232d';x.fillText('RECEIPT',width/2,y+10);y+=48;

  x.strokeStyle='#cdb7c1';x.setLineDash([8,7]);x.beginPath();x.moveTo(45,y);x.lineTo(width-45,y);x.stroke();x.setLineDash([]);y+=34;

  const left=55,right=width-55;
  function row(label,value,bold=false){
    x.textAlign='left';x.fillStyle='#38232d';x.font=(bold?'bold ':'')+'19px Arial';x.fillText(label,left,y);
    x.textAlign='right';x.font=(bold?'bold ':'')+'19px Arial';x.fillText(String(value||'—'),right,y);y+=32;
  }

  row('Receipt No.',receiptNo,true);
  if(orderNo && orderNo!==receiptNo)row('Order No.',orderNo);
  row('Date issued',issueDate);
  row('Sale / completed',saleDate);
  row('Customer',o.customer||'Customer');
  if(cust.email)row('Customer email',cust.email);

  y+=10;x.strokeStyle='#ead7df';x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();y+=34;

  x.textAlign='left';x.fillStyle='#38232d';x.font='bold 18px Arial';x.fillText('Description',left,y);
  x.textAlign='center';x.fillText('Qty',520,y);
  x.textAlign='right';x.fillText('Amount',right,y);y+=28;
  x.strokeStyle='#ead7df';x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();y+=30;

  let itemName=titleItem(o.item||o.recipe||'Order');
  if(Number(o.target_weight_g||0)>0) itemName += ' • '+Math.round(Number(o.target_weight_g))+' g';
  const hasExtras=Array.isArray(o.items) && o.items.some(it=>String(it.item_type||'').toLowerCase()==='add-on');
  if(hasExtras || Number(o.customisation||0)>0) itemName += ' • incl. selected add-ons/customisation';
  x.textAlign='left';x.fillStyle='#38232d';x.font='bold 19px Arial';
  const maxDesc=46;
  const descLines=itemName.length>maxDesc?[itemName.slice(0,maxDesc),itemName.slice(maxDesc,maxDesc*2)]:[itemName];
  descLines.forEach((line,i)=>x.fillText(line,left,y+i*25));
  x.textAlign='center';x.fillText(String(qty),520,y);
  x.textAlign='right';x.fillText(money(goodsTotal),right,y);
  y+=descLines.length*25+18;

  if(delivery>0){
    x.textAlign='left';x.font='19px Arial';x.fillText('Delivery',left,y);
    x.textAlign='center';x.fillText('1',520,y);
    x.textAlign='right';x.fillText(money(delivery),right,y);y+=34;
  }

  y+=8;x.strokeStyle='#ead7df';x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();y+=38;
  row('TOTAL',money(total),true);
  if(!b.gst_registered){
    row('GST','Not registered for GST');
  }
  row('AMOUNT PAID',money(paid),true);
  row('BALANCE DUE',money(balance),true);
  row('Payment method',latestPaymentMethods(o));

  y+=28;
  x.fillStyle='#159a68';canvasRoundedRect(x,150,y,width-300,70,18);x.fill();
  x.fillStyle='white';x.textAlign='center';x.font='bold 27px Arial';x.fillText('PAID IN FULL',width/2,y+46);y+=110;

  x.fillStyle='#6f5963';x.font='16px Arial';x.textAlign='center';
  x.fillText('Receipt for goods/services supplied by Sugar Canvas AU',width/2,y);y+=24;
  if(!b.gst_registered){x.fillText('GST has not been charged on this sale.',width/2,y);y+=24}
  x.fillText('Please keep this receipt for your records.',width/2,y);y+=28;
  const fb=b.facebook_url||'https://www.facebook.com/share/1E2qUGaMEP/', ig=b.instagram_url||'https://www.instagram.com/sugarcanvas.au';
  x.font='15px Arial';x.fillText('Facebook: '+fb.replace(/^https?:\/\/(www\.)?/,'').slice(0,54),width/2,y);y+=22;
  x.fillText('Instagram: '+ig.replace(/^https?:\/\/(www\.)?/,'').slice(0,54),width/2,y);y+=30;
  x.font='16px Arial';x.fillText('Thank you for supporting Sugar Canvas',width/2,y);y+=34;
  const firstCustomer=Number(cust.completed_order_count||0)<=1;
  if(firstCustomer){
    x.fillStyle='#38232d';x.font='bold 17px Arial';
    x.fillText('New customer thank-you: 5% off your next order.',width/2,y);y+=25;
    x.fillStyle='#6f5963';x.font='15px Arial';
    x.fillText('Enjoyed your order? We would love your Facebook review.',width/2,y);y+=34;
  }

  const qr=await loadFacebookReviewQr();
  if(qr){
    const qrSize=150;
    x.drawImage(qr,(width-qrSize)/2,y,qrSize,qrSize);y+=qrSize+24;
    x.fillStyle='#38232d';x.font='bold 18px Arial';x.textAlign='center';
    x.fillText('Enjoyed your order?',width/2,y);y+=24;
    x.fillStyle='#6f5963';x.font='16px Arial';
    x.fillText('Scan to review Sugar Canvas on Facebook',width/2,y);
  }

  return c;
}
async function posReceiptFile(o){
  const canvas=await buildPosReceiptCanvas(o);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));
  return {canvas,blob,file:new File([blob],`Sugar_Canvas_Receipt_${receiptRef(o).replace(/[^A-Za-z0-9_-]/g,'_')}.png`,{type:'image/png'})};
}
async function sharePosReceipt(o){
  try{
    const {file}=await posReceiptFile(o);
    const cust=customerForOrder(o);
    const data={title:'Sugar Canvas Receipt '+receiptRef(o),text:`Sugar Canvas paid receipt for ${o.customer||'customer'}${cust.email?' — '+cust.email:''}.\nFacebook: ${S.business?.facebook_url||'https://www.facebook.com/share/1E2qUGaMEP/'}\nInstagram: ${S.business?.instagram_url||'https://www.instagram.com/sugarcanvas.au'}`,files:[file]};
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share(data);return;
    }
    alert('This phone does not support sharing the receipt file directly. Use Save Receipt or Print / Save PDF instead.');
  }catch(e){if(e?.name!=='AbortError')alert('Could not share receipt: '+e.message)}
}
async function savePosReceipt(o){
  const {blob,file}=await posReceiptFile(o);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
async function printPosReceipt(o){
  const {canvas}=await posReceiptFile(o);const w=window.open('','_blank');
  if(!w){alert('Allow pop-ups to print or save this receipt as PDF.');return}
  const url=canvas.toDataURL('image/png');
  w.document.write(`<!doctype html><title>Sugar Canvas Receipt</title><style>@page{size:80mm auto;margin:4mm}body{margin:0;text-align:center}img{width:72mm;max-width:100%;height:auto}</style><img src="${url}" onload="setTimeout(()=>window.print(),250)">`);
  w.document.close();
}

function quoteRef(o){
  return String(o.quote_no||o.order_no||o.phone_sync_id||o.id||'QUOTE').trim();
}
async function buildQuoteCanvas(o){
  const width=720,height=1420;
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,width,height);
  const b=S.business||{},cust=customerForOrder(o),left=55,right=width-55;
  const total=Math.max(0,Number(o.price||0)), paid=Math.max(0,Number(o.deposit||0));
  const minDep=Number(o.minimum_deposit_required||minimumConfirmDeposit(total,Number(o.cost||o.base_cost||0)));
  const logo=await loadReceiptLogo();
  if(logo){const max=110,scale=Math.min(max/logo.width,max/logo.height);x.drawImage(logo,(width-logo.width*scale)/2,28,logo.width*scale,logo.height*scale)}
  let y=logo?160:55;
  x.textAlign='center';x.fillStyle='#38232d';x.font='bold 34px Arial';x.fillText(b.name||'Sugar Canvas AU',width/2,y);y+=32;
  x.fillStyle='#6f5963';x.font='18px Arial';x.fillText('ABN '+(b.abn||'Not synced'),width/2,y);y+=25;
  const contact=[b.email,b.phone].filter(Boolean).join(' • ');if(contact){x.fillText(contact,width/2,y);y+=24}
  x.fillStyle='#38232d';x.font='bold 24px Arial';x.fillText('QUOTATION',width/2,y+8);y+=48;
  x.fillStyle='#6f5963';x.font='15px Arial';x.fillText('This is a quotation, not an invoice.',width/2,y);y+=32;
  x.strokeStyle='#cdb7c1';x.setLineDash([8,7]);x.beginPath();x.moveTo(45,y);x.lineTo(width-45,y);x.stroke();x.setLineDash([]);y+=34;

  function row(label,value,bold=false){
    x.textAlign='left';x.fillStyle='#38232d';x.font=(bold?'bold ':'')+'18px Arial';x.fillText(label,left,y);
    x.textAlign='right';x.fillText(String(value??'—'),right,y);y+=31;
  }
  row('Quotation No.',quoteRef(o),true);row('Date issued',todayIso());row('Customer',o.customer||'Customer');
  if(cust.email)row('Customer email',cust.email);
  row('Delivery date',o.date||'—');
  y+=8;x.strokeStyle='#ead7df';x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();y+=34;

  x.textAlign='left';x.fillStyle='#38232d';x.font='bold 18px Arial';x.fillText('Description',left,y);
  x.textAlign='center';x.fillText('Qty',520,y);x.textAlign='right';x.fillText('Amount',right,y);y+=30;
  const quotedLines=Array.isArray(o.items)?o.items.filter(it=>Number(it.price||0)>0):[];
  if(quotedLines.length){
    quotedLines.forEach(it=>{
      x.textAlign='left';x.font='bold 17px Arial';x.fillStyle='#38232d';x.fillText(titleItem(it.item||'Item').slice(0,46),left,y);
      x.textAlign='center';x.fillText(String(Math.max(1,Number(it.quantity||1))),520,y);
      x.textAlign='right';x.fillText(money(it.price||0),right,y);y+=30;
    });
    const delivery=Number(o.delivery_charge||0);
    if(delivery>0){x.textAlign='left';x.font='17px Arial';x.fillText('Delivery',left,y);x.textAlign='center';x.fillText('1',520,y);x.textAlign='right';x.fillText(money(delivery),right,y);y+=30}
  }else{
    let itemName=titleItem(o.item||o.recipe||'Order');
    if(Number(o.target_weight_g||0)>0)itemName+=' • '+Math.round(Number(o.target_weight_g))+' g';
    x.textAlign='left';x.font='bold 19px Arial';x.fillText(itemName.slice(0,48),left,y);
    x.textAlign='center';x.fillText(String(Math.max(1,Number(o.quantity||1))),520,y);
    x.textAlign='right';x.fillText(money(total),right,y);y+=38;
  }

  if(o.note){x.textAlign='left';x.fillStyle='#6f5963';x.font='15px Arial';x.fillText('Notes: '+String(o.note).slice(0,72),left,y);y+=32}
  x.strokeStyle='#ead7df';x.beginPath();x.moveTo(left,y);x.lineTo(right,y);x.stroke();y+=38;
  row('QUOTATION TOTAL',money(total),true);
  if(paid>0)row('Already paid',money(paid));
  row('Minimum to confirm',money(minDep),true);

  y+=18;x.fillStyle='#fff2f7';canvasRoundedRect(x,45,y,width-90,145,18);x.fill();
  x.fillStyle='#8a124c';x.textAlign='center';x.font='bold 18px Arial';x.fillText('CONFIRMATION TERMS',width/2,y+34);
  x.fillStyle='#38232d';x.font='16px Arial';
  x.fillText('To confirm this quotation and reserve the order,',width/2,y+63);
  x.fillText('a minimum payment of '+money(minDep)+' is required.',width/2,y+88);
  x.font='14px Arial';x.fillStyle='#6f5963';
  x.fillText('Minimum = higher of 25% of total or order cost price,',width/2,y+114);
  x.fillText('rounded up to the next whole dollar.',width/2,y+135);y+=180;

  const fb=b.facebook_url||'https://www.facebook.com/share/1E2qUGaMEP/',ig=b.instagram_url||'https://www.instagram.com/sugarcanvas.au';
  x.fillStyle='#6f5963';x.font='15px Arial';x.textAlign='center';
  x.fillText('Facebook: '+fb.replace(/^https?:\/\/(www\.)?/,'').slice(0,54),width/2,y);y+=23;
  x.fillText('Instagram: '+ig.replace(/^https?:\/\/(www\.)?/,'').slice(0,54),width/2,y);y+=30;

  const qr=await loadFacebookReviewQr();
  if(qr){const size=140;x.drawImage(qr,(width-size)/2,y,size,size);y+=size+24;x.fillStyle='#38232d';x.font='bold 17px Arial';x.fillText('Scan for Sugar Canvas on Facebook',width/2,y)}
  return c;
}
async function quoteFile(o){
  const canvas=await buildQuoteCanvas(o);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));
  return {canvas,blob,file:new File([blob],`Sugar_Canvas_Quotation_${quoteRef(o).replace(/[^A-Za-z0-9_-]/g,'_')}.png`,{type:'image/png'})};
}
async function shareQuote(o){
  try{const {file}=await quoteFile(o);const data={title:'Sugar Canvas Quotation '+quoteRef(o),text:`Sugar Canvas quotation for ${o.customer||'customer'}.\nFacebook: ${S.business?.facebook_url||'https://www.facebook.com/share/1E2qUGaMEP/'}\nInstagram: ${S.business?.instagram_url||'https://www.instagram.com/sugarcanvas.au'}`,files:[file]};if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share(data);return}alert('Use Save Quotation or Print / Save PDF on this phone.')}catch(e){if(e?.name!=='AbortError')alert('Could not share quotation: '+e.message)}
}
async function saveQuoteFile(o){const {blob,file}=await quoteFile(o);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
async function printQuote(o){const {canvas}=await quoteFile(o);const w=window.open('','_blank');if(!w){alert('Allow pop-ups to print or save this quotation as PDF.');return}const url=canvas.toDataURL('image/png');w.document.write(`<!doctype html><title>Sugar Canvas Quotation</title><style>@page{size:A4;margin:8mm}body{margin:0;text-align:center}img{width:190mm;max-width:100%;height:auto}</style><img src="${url}"><script>onload=()=>setTimeout(()=>print(),250)<\/script>`);w.document.close()}
async function openQuotation(o){
  const old=document.getElementById('quoteOverlay');if(old)old.remove();
  const wrap=document.createElement('div');wrap.id='quoteOverlay';wrap.style.cssText='position:fixed;inset:0;z-index:20000;background:rgba(25,15,20,.72);padding:14px;overflow:auto;display:flex;align-items:flex-start;justify-content:center';
  const card=document.createElement('div');card.style.cssText='background:white;border-radius:20px;padding:14px;width:min(430px,100%);margin:14px auto';
  card.innerHTML='<div style="font-size:20px;font-weight:900;text-align:center;margin:4px 0 12px">Sugar Canvas Quotation</div><div id="quotePreview" style="text-align:center">Preparing quotation…</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button id="shareQuote">Share / Email</button><button id="saveQuote" class="secondary">Save Quotation</button><button id="printQuote" class="secondary">Print / Save PDF</button><button id="closeQuote" class="secondary">Close</button></div>';
  wrap.appendChild(card);document.body.appendChild(wrap);const {canvas}=await quoteFile(o);canvas.style.cssText='width:100%;height:auto;border:1px solid #eee;border-radius:8px';const prev=document.getElementById('quotePreview');prev.innerHTML='';prev.appendChild(canvas);
  document.getElementById('shareQuote').onclick=()=>shareQuote(o);document.getElementById('saveQuote').onclick=()=>saveQuoteFile(o);document.getElementById('printQuote').onclick=()=>printQuote(o);document.getElementById('closeQuote').onclick=()=>wrap.remove();
}

async function openPosReceipt(o){
  const old=document.getElementById('posReceiptOverlay');if(old)old.remove();
  const wrap=document.createElement('div');wrap.id='posReceiptOverlay';
  wrap.style.cssText='position:fixed;inset:0;z-index:20000;background:rgba(25,15,20,.72);padding:14px;overflow:auto;display:flex;align-items:flex-start;justify-content:center';
  const card=document.createElement('div');card.style.cssText='background:white;border-radius:20px;padding:14px;width:min(430px,100%);margin:14px auto';
  card.innerHTML='<div style="font-size:20px;font-weight:900;text-align:center;margin:4px 0 12px">Sugar Canvas Receipt</div><div id="posReceiptPreview" style="text-align:center">Preparing receipt…</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button id="sharePosReceipt">Share / Email</button><button id="savePosReceipt" class="secondary">Save Receipt</button><button id="printPosReceipt" class="secondary">Print / Save PDF</button><button id="closePosReceipt" class="secondary">Close</button></div>';
  wrap.appendChild(card);document.body.appendChild(wrap);
  const {canvas}=await posReceiptFile(o);canvas.style.cssText='width:100%;height:auto;border:1px solid #eee;border-radius:8px';const prev=document.getElementById('posReceiptPreview');prev.innerHTML='';prev.appendChild(canvas);
  document.getElementById('sharePosReceipt').onclick=()=>sharePosReceipt(o);
  document.getElementById('savePosReceipt').onclick=()=>savePosReceipt(o);
  document.getElementById('printPosReceipt').onclick=()=>printPosReceipt(o);
  document.getElementById('closePosReceipt').onclick=()=>wrap.remove();
}

function completeSelectedOrder(){
  const o=findOrder(S.selectedOrderId);if(!o)return;
  const current=String(o.workflow_status||o.status||'').toLowerCase();
  if(['completed','finalised','cancelled'].includes(current))return;

  const total=Math.max(0,Number(o.price||0));
  let paid=Math.max(0,Number(o.deposit||0));
  let remaining=Math.max(0,total-paid);

  if(remaining>0.005){
    const raw=prompt(
      'Order Total: '+money(total)+'\n'+
      'Already Paid: '+money(paid)+'\n'+
      'Remaining: '+money(remaining)+'\n\n'+
      'How much did the customer pay now?',
      remaining.toFixed(2)
    );
    if(raw===null)return;
    const amount=Number(String(raw).replace('$','').replace(',','').trim());
    if(!Number.isFinite(amount)||amount<=0){
      alert('Enter a valid payment amount.');
      return;
    }
    if(amount>remaining+0.005){
      alert('Payment cannot be more than the remaining balance of '+money(remaining)+'.');
      return;
    }

    const methodRaw=prompt('Payment method?\nExample: Cash, Bank Transfer, Card, PayID','Cash');
    if(methodRaw===null)return;
    const method=String(methodRaw||'Cash').trim()||'Cash';

    o.payments=Array.isArray(o.payments)?o.payments:[];
    o.payments.push({
      id:uid(),
      date:todayIso(),
      amount:Number(amount.toFixed(2)),
      method,
      note:'Customer payment entered on phone',
      source:'phone_order_payment'
    });
    paid=Number((paid+amount).toFixed(2));
    o.deposit=paid;
    remaining=Math.max(0,Number((total-paid).toFixed(2)));
    o.modified_at=nowIso();

    if(remaining>0.005){
      o.payment_state='Partially Paid';
      o.payment_status=money(remaining)+' Remaining';
      // Do not complete an order while any balance is outstanding.
      if(String(o.status||'').toLowerCase()==='quotation')o.status='Confirmed';
      if(String(o.workflow_status||'').toLowerCase()==='quotation')o.workflow_status='Confirmed';
      markOrder(o);
      S.selectedOrderId=orderKey(o);
      save();
      openOrderDetail(S.selectedOrderId);
      alert('Payment saved. '+money(remaining)+' is still due, so the order has NOT been completed.\n\nTap Sync Now to send this payment to the laptop.');
      return;
    }
  }

  // Completion is allowed only after the full amount has been received.
  o.deposit=total;
  o.payment_state='Paid in Full';
  o.payment_status='Paid in Full';
  o.full_payment_date=o.full_payment_date||todayIso();

  if(!confirm('Full amount received: '+money(total)+'\n\nMark this order as Completed?'))return;

  o.workflow_status='Completed';
  o.status='Completed';
  o.completed_at=nowIso();
  o.completed_date=todayIso();
  o.modified_at=nowIso();

  // The PDF itself is generated by the laptop. This flag remembers whether
  // the customer asked for a receipt now; invoice/receipt can still be generated later.
  o.receipt_requested=confirm(
    'Order completed and paid in full.\n\nDoes the customer need a receipt now?\n\n'+
    'You can still generate an Invoice or Receipt later from the laptop.'
  );

  markOrder(o);
  S.selectedOrderId=orderKey(o);
  save();
  openOrderDetail(S.selectedOrderId);
  if(o.receipt_requested){
    setTimeout(()=>openPosReceipt(o),120);
  }else{
    alert('Order completed and saved.\n\nNo receipt generated now. You can open this completed order later and tap Generate Receipt at any time.\n\nTap Sync Now to update the laptop.');
  }
}
function startEditOrder(id){
  const o=findOrder(id);if(!o)return;
  S.editingOrderId=orderKey(o);
  if(isDonutOrder(o)){
    const kind=o.donut_kind||(/bomboloni/i.test(o.item||'')?'bomboloni':(/glazed/i.test(o.item||'')?'ring_glazed':'ring_assorted'));
    document.getElementById('donutCustomer').value=o.customer||'';
    document.getElementById('donutKind').value=kind;
    document.getElementById('donutQty').value=String(Math.round(Number(o.quantity||4)));
    document.getElementById('donutFlavours').value=o.note||'';
    document.getElementById('donutDate').value=o.date||todayIso();
    document.getElementById('donutDeposit').value=Number(o.deposit||0);
    S.donutDraft={customItems:(o.custom_customer_items||[]).map(x=>({...x}))};
    if(!S.donutDraft.customItems.length){
      S.donutDraft.customItems=(o.items||[]).filter(it=>String(it.item_type||'').toLowerCase()==='custom item').map(it=>({id:it.id||uid(),description:it.item||'Custom item',quantity:Number(it.quantity||1),amount:Number(it.price||0)}));
    }
    setDeliveryFields('donut',!!o.delivery_needed,Number(o.delivery_charge||0));
    document.getElementById('cancelDonutEdit').hidden=false;
    document.getElementById('saveDonutQuote').textContent='Update as Quote';
    document.getElementById('confirmDonutOrder').textContent='Update Order';
    renderDonutCustomItems();donutCalc();go('donut');return;
  }
  document.getElementById('cakeCustomer').value=o.customer||'';
  const recipe=S.recipes.find(r=>String(r.id)===String(o.recipe_id||'')||String(r.name).toLowerCase()===String(o.recipe||o.item||'').toLowerCase());
  if(recipe)document.getElementById('cakeRecipe').value=recipe.id;
  document.getElementById('cakeWeight').value=Number(o.target_weight_g||500);
  document.getElementById('cakeQty').value=Number(o.quantity||1);
  const packaging=S.packaging.find(p=>String(p.name).toLowerCase()===String(o.packaging_type||'').toLowerCase());
  document.getElementById('cakePackaging').value=packaging?.id||'';
  document.getElementById('cakeCustomizationCost').value=Number(o.customisation||0);
  document.getElementById('cakeDate').value=o.date||todayIso();
  document.getElementById('cakeNote').value=o.note||'';
  document.getElementById('cakeProfitPct').value=Math.max(80,Number(o.profit_percent||80));
  document.getElementById('cakeDeposit').value=Number(o.deposit||0);
  document.getElementById('cakeFinalPrice').value=Number(o.price||0);
  document.getElementById('cakeFinalPrice').dataset.manual='1';
  setDeliveryFields('cake',!!o.delivery_needed,Number(o.delivery_charge||0));
  const addonItems=(o.items||[]).filter(it=>String(it.item_type||'').toLowerCase()==='add-on');
  S.cakeDraft.addons=[];S.cakeDraft.customAddons=[];
  addonItems.forEach(it=>{
    const rid=it.recipe_id||S.recipes.find(r=>r.type==='Add-On'&&String(r.name).toLowerCase()===String(it.recipe||it.item||'').toLowerCase())?.id;
    if(rid&&!it.manual_custom_addon)S.cakeDraft.addons.push(rid);
    else S.cakeDraft.customAddons.push({id:it.id||uid(),name:it.item||'Custom Add-On',cost:Number(it.raw_cost||it.base_cost||0)});
  });
  S.cakeDraft.profitPct=Math.max(80,Number(o.profit_percent||80));
  document.getElementById('cancelCakeEdit').hidden=false;
  document.getElementById('saveCakeQuote').textContent='Update as Quote';
  document.getElementById('confirmCakeOrder').textContent='Update Order';
  renderAddonChoices();cakeCalc();go('cake');
}
function deleteSelectedOrder(){
  const o=findOrder(S.selectedOrderId);if(!o)return;
  if(!confirm(`Delete this order for ${o.customer||'customer'}? This will also delete it from the laptop after the next sync.`))return;
  const id=orderKey(o);
  S.orders=S.orders.filter(x=>orderKey(x)!==id);
  S.changes.orders[id]={phone_sync_id:id,_deleted:true,modified_at:nowIso()};
  S.selectedOrderId='';save();go('orders');
}
document.getElementById('completeOrderBtn').onclick=completeSelectedOrder;
document.getElementById('editOrderBtn').onclick=()=>startEditOrder(S.selectedOrderId);
document.getElementById('deleteOrderBtn').onclick=deleteSelectedOrder;
document.getElementById('orderSearch').oninput=renderOrders;document.getElementById('orderFilter').onchange=renderOrders;
function renderCustomers(){const list=document.getElementById('customersList');list.innerHTML='';[...S.customers].sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(c=>{const d=document.createElement('div');d.className='list-item';d.innerHTML=`<b>${c.name}</b><div class="small">${c.phone||''}</div><div class="small">${c.address||''}</div>`;list.appendChild(d)});if(!S.customers.length)list.innerHTML='<div class="card muted">No customers yet.</div>'}
function recipeKey(r){return String(r?.id||r?.name||'')}
function findRecipeForPhone(id){return S.recipes.find(r=>recipeKey(r)===String(id||''))}
function formatQty(v){const n=Number(v);if(Number.isFinite(n))return Number.isInteger(n)?String(n):String(Math.round(n*100)/100);return String(v??'')}
function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function renderRecipes(){
  const list=document.getElementById('recipesList');if(!list)return;
  const q=String(document.getElementById('recipeSearch')?.value||'').trim().toLowerCase();
  const type=String(document.getElementById('recipeTypeFilter')?.value||'');
  let rows=[...S.recipes].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  rows=rows.filter(r=>{if(type&&String(r.type||'')!==type)return false;const ingredientText=(r.ingredients||[]).map(x=>x.name||'').join(' ');return `${r.name||''} ${r.type||''} ${r.description||''} ${ingredientText}`.toLowerCase().includes(q)});
  list.innerHTML='';
  if(!rows.length){list.innerHTML='<div class="card muted">No recipes found. Sync with the laptop if recipes are missing.</div>';return}
  rows.forEach(r=>{const d=document.createElement('div');d.className='list-item recipe-card';const count=(r.ingredients||[]).length;d.innerHTML=`<div class="list-top"><b>${titleItem(r.name||'Recipe')}</b><span class="recipe-type">${titleItem(r.type||'Recipe')}</span></div><div class="recipe-meta"><span>${Math.round(Number(r.base_weight_g||0))} g base</span><span>${count} ingredient${count===1?'':'s'}</span><span>Cost ${money(r.base_cost)}</span></div>${r.description?`<div class="small">${escapeHtml(String(r.description).slice(0,120))}${String(r.description).length>120?'…':''}</div>`:''}`;d.onclick=()=>openRecipeDetail(recipeKey(r));list.appendChild(d)})
}
function openRecipeDetail(id){
  const r=findRecipeForPhone(id);if(!r)return;S.selectedRecipeId=recipeKey(r);localStorage.setItem(KEY,JSON.stringify(S));
  const box=document.getElementById('recipeDetailContent');if(!box)return;const ingredients=Array.isArray(r.ingredients)?r.ingredients:[];
  let html=`<div class="card detail-card"><div class="list-top"><h2 style="margin:0">${titleItem(r.name||'Recipe')}</h2><span class="recipe-type">${titleItem(r.type||'Recipe')}</span></div>${detailRow('Base Weight / Yield',`${formatQty(r.base_weight_g||0)} g`)}${detailRow('Current Recipe Cost',money(r.base_cost))}${r.updated?detailRow('Last Updated',r.updated):''}</div>`;
  html+=`<div class="card detail-card"><div class="detail-section-title">Ingredients</div>`;
  if(!ingredients.length)html+='<div class="muted">No ingredients saved in this recipe.</div>';else{html+='<table class="ingredient-table"><thead><tr><th>Ingredient</th><th>Amount</th><th>Cost</th></tr></thead><tbody>';ingredients.forEach(line=>{html+=`<tr><td>${titleItem(line.name||'Ingredient')}</td><td>${escapeHtml(`${formatQty(line.used_qty)} ${line.used_unit||''}`.trim())}</td><td>${money(line.cost)}</td></tr>`});html+='</tbody></table>'}html+='</div>';
  html+=`<div class="card detail-card"><div class="detail-section-title">Description / Notes</div><div class="recipe-description">${r.description?escapeHtml(r.description).replace(/\n/g,'<br>'):'No description or method notes saved on the laptop.'}</div></div><div class="card small">This recipe is read-only on the phone. Make changes on the laptop and press Sync Now to update it here.</div>`;
  box.innerHTML=html;go('recipeDetail')
}
document.getElementById('recipeSearch').addEventListener('input',renderRecipes);
document.getElementById('recipeTypeFilter').addEventListener('change',renderRecipes);


let purchaseDraftItems=[];let purchaseDraftAttachments=[];let editingPurchaseId='';let selectedPurchaseId='';

function purchaseKey(p){return String(p?.phone_sync_id||p?.id||'')}
function findPhonePurchase(id){return S.purchases.find(p=>purchaseKey(p)===String(id||''))}
function renderPurchaseVendorOptions(){
  const sel=document.getElementById('purSupplier');if(!sel)return;
  const current=sel.value;
  const rows=[...S.suppliers].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  sel.innerHTML='<option value="">Choose Vendor</option>'+rows.map(s=>'<option value="'+(s.id||s.name)+'">'+titleItem(s.name||'Vendor')+'</option>').join('');
  if(rows.some(s=>String(s.id||s.name)===current))sel.value=current;
}
function selectedVendor(){
  const val=document.getElementById('purSupplier').value;
  return S.suppliers.find(s=>String(s.id||s.name)===String(val))||null;
}
function renderPurchasePaymentOptions(){
  const sel=document.getElementById('purPaidWith');if(!sel)return;
  const rows=(S.finance_payment_methods&&S.finance_payment_methods.length?S.finance_payment_methods:[{id:'',name:'Cash',type:'Cash'}]);
  const current=sel.value;
  sel.innerHTML=rows.map(x=>'<option value="'+(x.id||x.name)+'" data-name="'+x.name+'" data-type="'+(x.type||'')+'">'+titleItem(x.name)+'</option>').join('');
  if([...sel.options].some(o=>o.value===current))sel.value=current;
}
function renderPurchaseIngredientOptions(){
  const sel=document.getElementById('purIngredient');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Choose Ingredient</option>'+[...S.ingredients].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(i=>'<option value="'+i.id+'">'+titleItem(i.name||'Ingredient')+'</option>').join('');
  if(S.ingredients.some(i=>i.id===cur))sel.value=cur;
}
function renderPurchaseDraft(){
  const box=document.getElementById('purItemsList');if(!box)return;box.innerHTML='';
  if(!purchaseDraftItems.length){box.innerHTML='<div class="small muted">No items added yet.</div>';return}
  purchaseDraftItems.forEach(x=>{
    const d=document.createElement('div');d.className='purchase-item';
    d.innerHTML='<div><b>'+titleItem(x.ingredient)+'</b><div class="small">'+(x.packs||1)+' × '+(x.pack_size||x.qty)+' '+x.unit+' = '+x.qty+' '+x.unit+' • '+money(x.amount)+' • Update price: '+(x.update_price?'Yes':'No')+'</div></div><button type="button" class="remove-mini">×</button>';
    d.querySelector('button').onclick=()=>{purchaseDraftItems=purchaseDraftItems.filter(y=>y.id!==x.id);renderPurchaseDraft()};box.appendChild(d)
  })
}
function monthLabelFromDate(value){
  const d=new Date(String(value||'')+'T00:00:00');if(Number.isNaN(d.getTime()))return String(value||'Unknown');
  return d.toLocaleDateString(undefined,{month:'long',year:'numeric'});
}
function renderPurchases(){
  const box=document.getElementById('purchasesList');if(!box)return;box.innerHTML='';
  const rows=[...S.purchases].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  if(!rows.length){box.innerHTML='<div class="card muted">No purchases yet.</div>';return}
  let lastMonth='';
  rows.forEach(p=>{
    const m=monthLabelFromDate(p.date);
    if(m!==lastMonth){
      const monthRows=rows.filter(x=>monthLabelFromDate(x.date)===m);
      const total=monthRows.reduce((a,x)=>a+Number(x.total_amount||0),0);
      const h=document.createElement('div');h.className='month-group';h.innerHTML='<span>'+m+'</span><span>'+money(total)+'</span>';box.appendChild(h);lastMonth=m;
    }
    const d=document.createElement('div');d.className='list-item purchase-row';
    const fin=p.finance_status||'Pending laptop sync';
    d.innerHTML='<div class="list-top"><b>'+titleItem(p.supplier||'Vendor')+'</b><span class="money">'+money(p.total_amount)+'</span></div><div>'+(p.invoice_no||'No invoice number')+'</div><div class="small">'+(p.date||'')+(p.time?' • '+p.time:'')+' • '+((p.items||[]).length)+' item(s) • '+titleItem(p.paid_with||'')+'</div><div class="small"><span class="finance-chip">'+fin+'</span></div>';
    d.onclick=()=>openPurchaseDetail(purchaseKey(p));box.appendChild(d)
  })
}
function openPurchaseDetail(id){
  const p=findPhonePurchase(id);if(!p)return;selectedPurchaseId=purchaseKey(p);
  const items=(p.items||[]).map(x=>'<div class="detail-row"><span>'+titleItem(x.ingredient||'Item')+'</span><b>'+(x.packs||1)+' × '+(x.pack_size||x.qty)+' '+x.unit+' = '+x.qty+' '+x.unit+'<br>'+money(x.amount)+'</b></div>').join('');
  document.getElementById('purchaseDetailContent').innerHTML='<div class="card detail-card">'+detailRow('Vendor',titleItem(p.supplier||''))+detailRow('ABN',p.supplier_abn||'—')+detailRow('Invoice / Docket',p.invoice_no||'—')+detailRow('Date / Time',(p.date||'')+(p.time?' '+p.time:''))+detailRow('Paid With',titleItem(p.paid_with||'—'))+detailRow('GST Paid',money(p.gst_paid||0))+detailRow('Total',money(p.total_amount||0))+detailRow('Finance',p.finance_status||'Pending laptop sync')+'</div><div class="card detail-card"><div class="detail-section-title">Items Bought</div>'+(items||'<div class="muted">No items.</div>')+'</div><div class="card small">Receipt attachments are stored on the laptop after sync.</div>';
  go('purchaseDetail');
}
function resetPurchaseForm(){
  editingPurchaseId='';purchaseDraftItems=[];purchaseDraftAttachments=[];
  document.getElementById('purchaseFormTitle').textContent='New Purchase';
  document.getElementById('savePurchaseBtn').textContent='Save Purchase';
  document.getElementById('cancelPurchaseEditBtn').hidden=true;
  renderPurchaseVendorOptions();renderPurchasePaymentOptions();renderPurchaseIngredientOptions();
  document.getElementById('purSupplier').value='';document.getElementById('purABN').value='';
  document.getElementById('purInvoice').value='';document.getElementById('purDate').value=todayIso();
  document.getElementById('purTime').value=new Date().toTimeString().slice(0,5);
  document.getElementById('purGST').value='0';document.getElementById('purTotal').value='0';
  document.getElementById('purPacks').value='1';document.getElementById('purPackSize').value='';document.getElementById('purAmount').value='';
  document.getElementById('purTotalQty').textContent='0';document.getElementById('purAttachment').value='';
  document.getElementById('purAttachmentInfo').textContent='Optional. Photo/PDF transfers to the laptop on Sync Now.';
  renderPurchaseDraft();
}
document.getElementById('newPurchaseBtn').onclick=()=>{resetPurchaseForm();go('newPurchase')};
document.getElementById('purSupplier').addEventListener('change',()=>{const s=selectedVendor();document.getElementById('purABN').value=s?.abn||''});
document.getElementById('purNewVendor').onclick=()=>document.getElementById('vendorDialog').showModal();
document.getElementById('cancelVendor').onclick=()=>document.getElementById('vendorDialog').close();
document.getElementById('saveVendor').onclick=()=>{
  const name=document.getElementById('newVendorName').value.trim(),abn=document.getElementById('newVendorABN').value.trim();
  if(!name){alert('Enter vendor name.');return}
  let s=S.suppliers.find(x=>String(x.name||'').toLowerCase()===name.toLowerCase());
  if(!s){s={id:'phone-vendor-'+uid(),name,abn};S.suppliers.push(s)}else if(abn)s.abn=abn;
  renderPurchaseVendorOptions();document.getElementById('purSupplier').value=s.id||s.name;document.getElementById('purABN').value=s.abn||'';
  document.getElementById('newVendorName').value='';document.getElementById('newVendorABN').value='';document.getElementById('vendorDialog').close();save()
};
document.getElementById('openPurchaseItemDialog').onclick=()=>{renderPurchaseIngredientOptions();document.getElementById('purchaseItemDialog').showModal()};
document.getElementById('cancelPurchaseItem').onclick=()=>document.getElementById('purchaseItemDialog').close();
function updatePurchaseTotalQty(){
  const packs=Number(document.getElementById('purPacks').value||0),size=Number(document.getElementById('purPackSize').value||0),unit=document.getElementById('purUnit').value;
  const total=packs*size;document.getElementById('purTotalQty').textContent=(Number.isFinite(total)?Math.round(total*100)/100:0)+' '+unit
}
['purPacks','purPackSize','purUnit'].forEach(id=>document.getElementById(id).addEventListener('input',updatePurchaseTotalQty));
document.getElementById('purIngredient').addEventListener('change',()=>{
  const ing=S.ingredients.find(i=>i.id===document.getElementById('purIngredient').value);if(!ing)return;
  if(Number(ing.buy_qty||0)>0)document.getElementById('purPackSize').value=Number(ing.buy_qty);
  document.getElementById('purUnit').value=ing.buy_unit||'g';updatePurchaseTotalQty()
});
document.getElementById('purNewIngredient').onclick=()=>{
  const name=prompt('New ingredient name');if(!name||!name.trim())return;
  const sizeRaw=prompt('Default pack size (optional). Example: 180');if(sizeRaw===null)return;
  const size=sizeRaw.trim()===''?0:Number(sizeRaw);if(!Number.isFinite(size)||size<0){alert('Enter a valid pack size.');return}
  const unit=prompt('Unit: g, kg, ml, L or pcs','g')||'g';if(!['g','kg','ml','L','pcs'].includes(unit)){alert('Use g, kg, ml, L or pcs.');return}
  let ing=S.ingredients.find(i=>String(i.name||'').toLowerCase()===name.trim().toLowerCase());
  if(!ing){ing={id:'phone-ing-'+uid(),name:name.trim(),buy_qty:size,buy_unit:unit,buy_price:0,stock_qty:0,stock_unit:unit,new_ingredient:true};S.ingredients.push(ing)}
  renderPurchaseIngredientOptions();document.getElementById('purIngredient').value=ing.id;document.getElementById('purPackSize').value=size||'';document.getElementById('purUnit').value=unit;updatePurchaseTotalQty();save()
};
document.getElementById('purAddItem').onclick=()=>{
  const ing=S.ingredients.find(i=>i.id===document.getElementById('purIngredient').value);if(!ing){alert('Choose an ingredient.');return}
  const packs=Number(document.getElementById('purPacks').value||0),packSize=Number(document.getElementById('purPackSize').value||0),qty=packs*packSize,amount=Number(document.getElementById('purAmount').value||0);
  if(!(packs>0)||!(packSize>0)||amount<0){alert('Enter valid packs, pack size and amount.');return}
  purchaseDraftItems.push({id:uid(),ingredient_id:ing.id,ingredient:ing.name,packs,pack_size:packSize,qty,unit:document.getElementById('purUnit').value,amount,update_price:document.getElementById('purUpdatePrice').checked,new_ingredient:!!ing.new_ingredient});
  document.getElementById('purchaseItemDialog').close();document.getElementById('purPacks').value='1';document.getElementById('purPackSize').value='';document.getElementById('purAmount').value='';updatePurchaseTotalQty();renderPurchaseDraft()
};
async function fileToSyncAttachment(file){
  if(!file)return null;
  if(file.type.startsWith('image/'))return await new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{try{const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const data=c.toDataURL('image/jpeg',0.72);URL.revokeObjectURL(url);resolve({name:(file.name||'receipt').replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',data_url:data})}catch(e){reject(e)}};img.onerror=reject;img.src=url});
  if(file.size>2500000)throw new Error('This PDF is over 2.5 MB. Please attach it from the laptop instead.');
  return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name||'receipt.pdf',type:file.type||'application/pdf',data_url:r.result});r.onerror=reject;r.readAsDataURL(file)})
}
document.getElementById('purAttachment').addEventListener('change',async e=>{
  purchaseDraftAttachments=[];const file=e.target.files?.[0];if(!file)return;
  try{const a=await fileToSyncAttachment(file);if(a)purchaseDraftAttachments=[a];document.getElementById('purAttachmentInfo').textContent='Attached: '+file.name+'. It will transfer on Sync Now.'}
  catch(err){alert(err.message);e.target.value=''}
});
document.getElementById('savePurchaseBtn').onclick=()=>{
  const vendor=selectedVendor(),supplier=vendor?.name||'',invoice=document.getElementById('purInvoice').value.trim(),date=document.getElementById('purDate').value||todayIso(),time=document.getElementById('purTime').value||'',total=Number(document.getElementById('purTotal').value||0),gst=Number(document.getElementById('purGST').value||0);
  if(!supplier||!invoice){alert('Vendor and receipt/invoice number are required.');return}
  if(!purchaseDraftItems.length){alert('Add at least one purchased item.');return}
  const paidSel=document.getElementById('purPaidWith'),opt=paidSel.options[paidSel.selectedIndex],paidWith=opt?.dataset?.name||opt?.textContent||'Cash',paidType=opt?.dataset?.type||'';
  const existing=editingPurchaseId?findPhonePurchase(editingPurchaseId):null;
  const p={...(existing||{}),phone_sync_id:existing?purchaseKey(existing):uid(),supplier,supplier_abn:document.getElementById('purABN').value.trim(),invoice_no:invoice,date,time,gst_paid:gst,total_amount:total,paid_with:paidWith,paid_with_id:paidSel.value,paid_with_type:paidType,items:purchaseDraftItems.map(x=>({...x})),attachments:purchaseDraftAttachments.length?purchaseDraftAttachments.map(x=>({...x})):(existing?.attachments||[]),created:existing?.created||nowIso(),modified_at:nowIso()};
  if(existing){const i=S.purchases.findIndex(x=>purchaseKey(x)===purchaseKey(existing));if(i>=0)S.purchases[i]=p}else S.purchases.unshift({...p,attachment_count:p.attachments.length});
  markPurchase(p);save();alert(existing?'Purchase updated on phone. Sync to update laptop and Finance.':'Purchase saved on phone. Sync to update laptop and Finance.');resetPurchaseForm();go('purchases')
};
function editPhonePurchase(id){
  const p=findPhonePurchase(id);if(!p)return;editingPurchaseId=purchaseKey(p);
  renderPurchaseVendorOptions();renderPurchasePaymentOptions();
  let vendor=S.suppliers.find(s=>String(s.name||'').toLowerCase()===String(p.supplier||'').toLowerCase());
  if(!vendor){vendor={id:'phone-vendor-'+uid(),name:p.supplier||'Vendor',abn:p.supplier_abn||''};S.suppliers.push(vendor);renderPurchaseVendorOptions()}
  document.getElementById('purSupplier').value=vendor.id||vendor.name;document.getElementById('purABN').value=p.supplier_abn||vendor.abn||'';
  document.getElementById('purInvoice').value=p.invoice_no||'';document.getElementById('purDate').value=p.date||todayIso();document.getElementById('purTime').value=p.time||'';
  document.getElementById('purGST').value=Number(p.gst_paid||0);document.getElementById('purTotal').value=Number(p.total_amount||0);
  const payOpt=[...document.getElementById('purPaidWith').options].find(o=>(o.dataset.name||o.textContent)===p.paid_with||o.value===p.paid_with_id);if(payOpt)document.getElementById('purPaidWith').value=payOpt.value;
  purchaseDraftItems=(p.items||[]).map(x=>({...x}));purchaseDraftAttachments=[];renderPurchaseDraft();
  document.getElementById('purchaseFormTitle').textContent='Edit Purchase';document.getElementById('savePurchaseBtn').textContent='Update Purchase';document.getElementById('cancelPurchaseEditBtn').hidden=false;go('newPurchase')
}
document.getElementById('editPurchaseBtn').onclick=()=>editPhonePurchase(selectedPurchaseId);
document.getElementById('cancelPurchaseEditBtn').onclick=()=>{resetPurchaseForm();go('purchases')};
document.getElementById('deletePurchaseBtn').onclick=()=>{
  const p=findPhonePurchase(selectedPurchaseId);if(!p)return;
  if(!confirm('Delete purchase '+(p.invoice_no||'')+' from '+(p.supplier||'vendor')+'? It will be deleted from the laptop and Finance after sync.'))return;
  const id=purchaseKey(p);S.purchases=S.purchases.filter(x=>purchaseKey(x)!==id);S.changes.purchases[id]={phone_sync_id:id,_deleted:true,modified_at:nowIso()};save();go('purchases')
};

function renderHome(){const active=S.orders.filter(o=>!['completed','cancelled','finalised'].includes(String(o.workflow_status||o.status||'').toLowerCase())).length,quotes=S.orders.filter(o=>String(o.status||'').toLowerCase()==='quotation').length,changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length+Object.keys(S.changes.purchases||{}).length;document.getElementById('homeSummary').innerHTML=`<div class="list-item"><span>Active orders</span><b>${active}</b></div><div class="list-item"><span>Quotes</span><b>${quotes}</b></div><div class="list-item"><span>Recipes</span><b>${S.recipes.length}</b></div><div class="list-item"><span>Changes waiting for laptop</span><b>${changes}</b></div>`}
function renderSync(){const changes=Object.keys(S.changes.orders).length+Object.keys(S.changes.customers).length+Object.keys(S.changes.purchases||{}).length;const paired=!!(S.lan&&S.lan.token&&S.lan.server);document.getElementById('wifiNotPaired').hidden=paired;document.getElementById('wifiPaired').hidden=!paired;if(paired){document.getElementById('pairedLaptop').textContent='Paired laptop: '+S.lan.server;document.getElementById('pairedServer').value=S.lan.server}else{document.getElementById('lanServer').value=S.lan?.server||'';document.getElementById('lanDeviceName').value=S.lan?.device_name||''}
  document.getElementById('syncStatus').innerHTML=`<p><b>Last successful sync:</b> ${S.last_sync}</p><p><b>Business ABN synced:</b> ${S.business?.abn||'Not received from laptop yet'}</p><p><b>Changes waiting for laptop:</b> ${changes}</p><p><b>Phone history:</b> last 30 days + active/future orders</p><p><b>Connection:</b> ${paired?'Paired — no code needed':'Not paired yet'}</p>`;document.getElementById('syncBadge').textContent=changes?`${changes} waiting`:(paired?'Paired':'Offline ready')}
function renderAll(){customerOptions(document.getElementById('cakeCustomer'));customerOptions(document.getElementById('donutCustomer'));recipeOptions();packagingOptions();renderAddonChoices();cakeCalc();renderDonutCustomItems();renderPremiumDonutMenu();donutCalc();renderOrders();renderCustomers();renderRecipes();renderPurchases();renderPurchaseVendorOptions();renderPurchasePaymentOptions();renderPurchaseIngredientOptions();renderHome();renderSync()}
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
    const payload={schema:'sugar_canvas_phone_changes',version:11,generated_at:nowIso(),device_id:S.device_id,customers:Object.values(S.changes.customers),orders:Object.values(S.changes.orders),purchases:Object.values(S.changes.purchases)};
    const enc=b64urlJson(payload);
    if(enc.length>70000){alert('There are too many unsynced changes for Wi-Fi bridge sync. Use Backup File Sync once, then continue with Wi-Fi sync.');return}
    const ts=Math.floor(Date.now()/1000).toString();
    const sig=await hmacHex(S.lan.token,ts+'.'+enc);
    const u=S.lan.server+'/sync?device_id='+encodeURIComponent(S.device_id)+'&ts='+encodeURIComponent(ts)+'&payload='+encodeURIComponent(enc)+'&sig='+encodeURIComponent(sig)+'&return='+encodeURIComponent(currentReturnUrl());
    location.href=u;
  }catch(err){alert('Could not start Wi-Fi sync: '+err.message)}
};

document.getElementById('exportLaptop').onclick=()=>{
  const payload={schema:'sugar_canvas_phone_changes',version:11,generated_at:nowIso(),device_id:S.device_id,customers:Object.values(S.changes.customers),orders:Object.values(S.changes.orders),purchases:Object.values(S.changes.purchases)};
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
async function setupAutoUpdates(){
  if(!('serviceWorker' in navigator))return;
  const banner=document.getElementById('updateBanner');
  const bannerText=document.getElementById('updateBannerText')||banner?.querySelector('span');
  const btn=document.getElementById('updateNowBtn');
  const overlay=document.getElementById('updateOverlay');
  const spinner=document.getElementById('updateSpinner');
  const success=document.getElementById('updateSuccess');
  const title=document.getElementById('updateStatusTitle');
  const percent=document.getElementById('updatePercent');
  const bar=document.getElementById('updateProgressBar');
  const status=document.getElementById('updateStatusText');
  let reg=null,waitingWorker=null,updateBusy=false;

  function setProgress(p,msg){
    const n=Math.max(0,Math.min(100,Math.round(p)));
    if(percent)percent.textContent=n+'%';
    if(bar)bar.style.width=n+'%';
    if(status&&msg)status.textContent=msg;
  }
  function showBanner(worker){
    waitingWorker=worker||reg?.waiting||null;
    if(banner)banner.hidden=false;
    if(bannerText)bannerText.textContent='New Sugar Canvas version available.';
    if(btn){btn.disabled=false;btn.textContent='Update Now';}
  }
  function showUpdating(){
    updateBusy=true;
    if(banner)banner.hidden=true;
    if(overlay)overlay.hidden=false;
    if(spinner)spinner.hidden=false;
    if(success)success.hidden=true;
    if(title)title.textContent='Updating Sugar Canvas';
    setProgress(5,'Checking for the latest version…');
    if(btn){btn.disabled=true;btn.textContent='Updating…';}
  }
  async function showComplete(){
    setProgress(100,'Update installed successfully.');
    if(spinner)spinner.hidden=true;
    if(success)success.hidden=false;
    if(title)title.textContent='Update Complete';
    if(percent)percent.textContent='100%';
    if(banner)banner.hidden=true;
    await new Promise(r=>setTimeout(r,1300));
    if(overlay)overlay.hidden=true;
    location.reload();
  }
  async function waitForInstalled(worker){
    if(!worker)return null;
    if(worker.state==='installed')return worker;
    return await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Update timed out.')),20000);
      const onState=()=>{
        if(worker.state==='installed'){
          clearTimeout(timeout);worker.removeEventListener('statechange',onState);resolve(worker);
        }else if(worker.state==='redundant'){
          clearTimeout(timeout);worker.removeEventListener('statechange',onState);reject(new Error('Update could not be installed.'));
        }
      };
      worker.addEventListener('statechange',onState);
    });
  }
  async function startUpdate(){
    if(updateBusy)return;
    showUpdating();
    try{
      setProgress(15,'Checking GitHub Pages…');
      await reg.update();
      let worker=reg.waiting||reg.installing;
      if(!worker){
        setProgress(30,'Looking for update files…');
        worker=await new Promise(resolve=>{
          const timeout=setTimeout(()=>resolve(reg.waiting||reg.installing||null),5000);
          const onFound=()=>{
            clearTimeout(timeout);reg.removeEventListener('updatefound',onFound);
            resolve(reg.installing||reg.waiting||null);
          };
          reg.addEventListener('updatefound',onFound);
        });
      }
      if(worker){
        setProgress(45,'Downloading update…');
        worker=await waitForInstalled(worker);
        setProgress(75,'Installing update…');
        waitingWorker=worker;
        worker.postMessage({type:'SKIP_WAITING'});
      }else{
        const r=await fetch('version.json?ts='+Date.now(),{cache:'no-store'});
        const v=r.ok?await r.json():{};
        if(String(v.version||'')===APP_VERSION){
          setProgress(90,'Already on the latest version…');
          await showComplete();
        }else{
          throw new Error('The new version is not ready yet. Try again in a few seconds.');
        }
      }
    }catch(err){
      if(overlay)overlay.hidden=true;
      updateBusy=false;
      if(btn){btn.disabled=false;btn.textContent='Update Now';}
      if(bannerText)bannerText.textContent='Update failed — tap Update Now to retry.';
      alert('Could not update Sugar Canvas: '+err.message);
    }
  }
  try{
    reg=await navigator.serviceWorker.register('sw.js');
    if(reg.waiting)showBanner(reg.waiting);
    reg.addEventListener('updatefound',()=>{
      const w=reg.installing;if(!w)return;
      w.addEventListener('statechange',()=>{
        if(w.state==='installed'&&navigator.serviceWorker.controller&&!updateBusy)showBanner(w)
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange',async()=>{
      if(updateBusy){
        setProgress(92,'Activating the new version…');
        await showComplete();
      }
    });
    if(btn)btn.onclick=startUpdate;
    async function check(){
      if(updateBusy)return;
      try{
        await reg.update();
        const r=await fetch('version.json?ts='+Date.now(),{cache:'no-store'});
        if(r.ok){
          const v=await r.json();
          if(String(v.version||'')!==APP_VERSION)showBanner(reg.waiting||reg.installing);
          else if(!reg.waiting&&banner)banner.hidden=true;
        }
      }catch(e){}
    }
    check();setInterval(check,60000);
  }catch(e){}
}
setupAutoUpdates();
