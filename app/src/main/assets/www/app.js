const $ = id => document.getElementById(id);
const LS_ORDERS = 'th_orders_v1';
const LS_SETTINGS = 'th_settings_v1';
let currentFilter = 'all';
let currentImage = '';
let deferredPrompt = null;

function todayKey(d = new Date()){
  return String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
}
function displayDateTime(d){
  const date = d instanceof Date ? d : new Date(d);
  return String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')+' '+String(date.getDate()).padStart(2,'0')+'.'+String(date.getMonth()+1).padStart(2,'0')+'.'+date.getFullYear();
}
function fullDateTime(d){
  const date = d instanceof Date ? d : new Date(d);
  return String(date.getDate()).padStart(2,'0')+'.'+String(date.getMonth()+1).padStart(2,'0')+'.'+date.getFullYear()+' '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
}
function money(n){return Number(n||0).toLocaleString('uz-UZ').replace(/,/g,' ') + " so‘m"}
function getOrders(){return JSON.parse(localStorage.getItem(LS_ORDERS)||'[]')}
function setOrders(list){localStorage.setItem(LS_ORDERS, JSON.stringify(list))}
function getSettings(){return JSON.parse(localStorage.getItem(LS_SETTINGS)||'{}')}
function setSettings(s){localStorage.setItem(LS_SETTINGS, JSON.stringify(s))}
function cleanPhone(v){return v.replace(/[^0-9+]/g,'')}
function orderSeqForToday(dateKey){
  const same = getOrders().filter(o => o.dateKey === dateKey && o.orderId && o.orderId.startsWith('TH-'));
  let max = 0;
  same.forEach(o => {
    const m = o.orderId.match(/^TH-(\d{4})/); if(m) max = Math.max(max, Number(m[1]));
  });
  return max + 1;
}
function createOrderId(){
  const key = todayKey();
  const seq = String(orderSeqForToday(key)).padStart(4,'0');
  return `TH-${seq}${key}`;
}
function updateRemaining(){
  const price = Number(($('price').value||'').replace(/\s/g,''));
  const pre = Number(($('prepayment').value||'').replace(/\s/g,''));
  if(!isNaN(price) && !isNaN(pre)) $('remaining').value = price - pre >= 0 ? price - pre : '';
}
function validateForm(){
  const errors=[];
  if(!$('customerName').value.trim() || $('customerName').value.trim().length<2) errors.push('Mijoz ismini kiriting.');
  const phone=cleanPhone($('customerPhone').value);
  if(!/^\+998\d{9}$/.test(phone)) errors.push('Telefon raqam to‘liq bo‘lishi kerak: +998 XX XXX XX XX');
  if(!$('source').value) errors.push('Manbani tanlang.');
  if($('source').value==='Boshqa' && !$('sourceOther').value.trim()) errors.push('Boshqa manbani yozing.');
  if(!$('cakeType').value.trim()) errors.push('Tort turini kiriting.');
  const price=Number(($('price').value||'').replace(/\s/g,''));
  const pre=Number(($('prepayment').value||'').replace(/\s/g,''));
  if(!price || price<=0) errors.push('Narx 0 dan katta bo‘lishi kerak.');
  if(isNaN(pre) || pre<0) errors.push('Zakolat summasini to‘g‘ri kiriting.');
  if(price && pre>price) errors.push('Zakolat umumiy narxdan katta bo‘lishi mumkin emas.');
  if(!$('pickup').value) errors.push('Buyurtma olib ketilish vaqtini kiriting.');
  if($('pickup').value && new Date($('pickup').value) < new Date(Date.now()-60000)) errors.push('Olib ketish vaqti o‘tib ketgan bo‘lishi mumkin emas.');
  return errors;
}
function showErrors(errors){
  if(errors.length){$('errors').classList.remove('hidden');$('errors').textContent=errors.join('\n');}
  else {$('errors').classList.add('hidden');$('errors').textContent='';}
}
function formValue(id){return $(id).value.trim() || 'Yo‘q'}
function collectOrder(){
  const now = new Date();
  const price=Number(($('price').value||'0').replace(/\s/g,''));
  const pre=Number(($('prepayment').value||'0').replace(/\s/g,''));
  const settings=getSettings();
  return {
    uid: crypto.randomUUID ? crypto.randomUUID() : 'uid-'+Date.now()+'-'+Math.random(),
    orderId: createOrderId(),
    dateKey: todayKey(now),
    acceptedAt: now.toISOString(),
    customerName: formValue('customerName'),
    customerPhone: $('customerPhone').value.trim(),
    source: $('source').value,
    sourceOther: $('source').value==='Boshqa' ? formValue('sourceOther') : '',
    cakeType: formValue('cakeType'),
    filling: formValue('filling'),
    cakeColor: formValue('cakeColor'),
    cakeText: formValue('cakeText'),
    comment: formValue('comment'),
    image: currentImage,
    price, prepayment: pre, remaining: price-pre,
    pickup: new Date($('pickup').value).toISOString(),
    operatorName: settings.operatorName || 'Operator',
    branchName: settings.branchName || '',
    status: 'Yangi',
    telegramSent: false,
    telegramMessageId: '',
    printed: false,
    sheetSynced: false
  }
}
async function saveOrder(print=false){
  const errs = validateForm(); showErrors(errs); if(errs.length) return;
  $('saveOrder').disabled = true; $('savePrint').disabled = true;
  const order = collectOrder();
  const list=getOrders(); list.push(order); setOrders(list);
  resetForm(); renderOrders();
  try { await sendTelegram(order); } catch(e){ console.warn(e); }
  if(print){ order.printed = true; updateOrder(order); showReceipt(order); }
  $('saveOrder').disabled = false; $('savePrint').disabled = false;
  alert('Zakaz saqlandi: '+order.orderId);
}
function updateOrder(order){
  const list=getOrders().map(o => o.uid===order.uid ? order : o); setOrders(list); renderOrders();
}
function resetForm(){
  ['customerName','sourceOther','cakeType','filling','cakeColor','cakeText','comment','price','prepayment','remaining','pickup'].forEach(id=>$(id).value='');
  $('customerPhone').value='+998 '; $('source').value=''; $('sourceOtherWrap').classList.add('hidden'); currentImage=''; $('preview').classList.add('hidden'); $('imageInput').value='';
}
function telegramText(o, resend=false){
  return `${resend?'🔁 QAYTA YUBORILGAN ZAKAZ\n\n':'🧁 YANGI ZAKAZ\n\n'}🆔 Zakaz ID: ${o.orderId}\n📅 Qabul qilindi: ${fullDateTime(o.acceptedAt)}\n👤 Mijoz: ${o.customerName}\n📞 Telefon: ${o.customerPhone}\n📍 Manba: ${o.source}${o.sourceOther?' - '+o.sourceOther:''}\n\n🎂 Tort turi: ${o.cakeType}\n🍰 Nachinka: ${o.filling}\n🎨 Tort rangi: ${o.cakeColor}\n✍️ Ustidagi yozuv: ${o.cakeText}\n📝 Izoh: ${o.comment}\n\n💰 Narx: ${money(o.price)}\n✅ Zakolat: ${money(o.prepayment)}\n💵 Qoldi: ${money(o.remaining)}\n\n⏰ Olib ketish vaqti: ${displayDateTime(o.pickup)}\n\n👨‍💼 Zakaz olgan: ${o.operatorName}\n📌 Status: ${o.status}`;
}
async function sendTelegram(order, resend=false){
  const s=getSettings();
  if(!s.botToken || !s.chatId) return false;
  const text=telegramText(order,resend);
  let ok=false, msgId='';
  if(s.scriptUrl){
    const res = await fetch(s.scriptUrl, {method:'POST', body: JSON.stringify({type:'telegram', botToken:s.botToken, chatId:s.chatId, text})});
    const data = await res.json(); ok = !!data.ok; msgId = data.message_id || '';
  } else {
    const res = await fetch(`https://api.telegram.org/bot${s.botToken}/sendMessage`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:s.chatId,text})});
    const data = await res.json(); ok = !!data.ok; msgId = data.result?.message_id || '';
  }
  if(ok){order.telegramSent=true; order.telegramMessageId=String(msgId); updateOrder(order);}
  return ok;
}
function receipt(o){
  return `        TORT HOUSE\n      ZAKAZ QOG'OZI\n\nID: ${o.orderId}\nQabul: ${fullDateTime(o.acceptedAt)}\nOperator: ${o.operatorName}\n\nMIJOZ:\nIsm: ${o.customerName}\nTel: ${o.customerPhone}\nManba: ${o.source}${o.sourceOther?' - '+o.sourceOther:''}\n\nZAKAZ:\nTort: ${o.cakeType}\nNachinka: ${o.filling}\nRang: ${o.cakeColor}\nYozuv: ${o.cakeText}\n\nIzoh:\n${o.comment}\n\nNARX:\nUmumiy: ${money(o.price)}\nZakolat: ${money(o.prepayment)}\nQoldi: ${money(o.remaining)}\n\nOLIB KETISH:\n${displayDateTime(o.pickup)}\n\nStatus: ${o.status}\n\n------------------------\nMijozga topshirishda\nqoldiqni olish eslatilsin.\n------------------------`;
}
function showReceipt(o){
  $('receiptText').textContent=receipt(o); $('receiptModal').classList.remove('hidden');
}
function renderOrders(){
  const q=($('search')?.value||'').toLowerCase();
  const now = new Date();
  const today = now.toDateString();
  const tomorrowDate = new Date(now); tomorrowDate.setDate(now.getDate()+1); const tomorrow = tomorrowDate.toDateString();
  let list=getOrders().sort((a,b)=>new Date(b.acceptedAt)-new Date(a.acceptedAt));
  list=list.filter(o => {
    const text=Object.values(o).join(' ').toLowerCase();
    if(q && !text.includes(q)) return false;
    if(currentFilter==='today') return new Date(o.pickup).toDateString()===today;
    if(currentFilter==='tomorrow') return new Date(o.pickup).toDateString()===tomorrow;
    if(currentFilter==='unsent') return !o.telegramSent;
    if(currentFilter==='unprinted') return !o.printed;
    return true;
  });
  $('ordersList').innerHTML = list.length ? list.map(o=>`<div class="orderCard">
    <div class="orderTop"><div><div class="orderId">${o.orderId}</div><div class="orderMeta">${o.customerName} · ${o.customerPhone}</div></div>${o.image?`<img class="smallImg" src="${o.image}">`:''}<span class="badge status${o.status.replace(/\s/g,'')}">${o.status}</span></div>
    <div class="orderMeta">🎂 ${o.cakeType}<br>⏰ ${displayDateTime(o.pickup)}<br>💵 Qoldi: ${money(o.remaining)}<br>📍 ${o.source}</div>
    <div class="orderActions"><button onclick="showByUid('${o.uid}')">Chek</button><button onclick="resendByUid('${o.uid}')">Telegram</button><button onclick="cancelByUid('${o.uid}')">Bekor</button></div>
  </div>`).join('') : '<div class="card">Zakaz topilmadi.</div>';
  $('connectionStatus').textContent = `${getOrders().length} ta zakaz lokal bazada`;
}
window.showByUid = uid => { const o=getOrders().find(x=>x.uid===uid); if(o){o.printed=true; updateOrder(o); showReceipt(o);} };
window.resendByUid = async uid => { const o=getOrders().find(x=>x.uid===uid); if(o){ const ok=await sendTelegram(o,true); alert(ok?'Telegramga yuborildi':'Telegram yuborilmadi. Sozlamani/internetni tekshiring.'); } };
window.cancelByUid = uid => { const o=getOrders().find(x=>x.uid===uid); if(o && confirm('Zakazni bekor qilasizmi?')){o.status='Bekor qilindi'; updateOrder(o);} };
function exportCsv(){
  const headers=['Zakaz ID','Qabul qilingan vaqt','Mijoz ismi','Telefon','Manba','Boshqa manba','Tort turi','Nachinka','Rang','Yozuv','Izoh','Narx','Zakolat','Qoldi','Olib ketish vaqti','Operator','Filial','Status','Telegram','Chop etildi'];
  const rows=getOrders().map(o=>[o.orderId,fullDateTime(o.acceptedAt),o.customerName,o.customerPhone,o.source,o.sourceOther,o.cakeType,o.filling,o.cakeColor,o.cakeText,o.comment,o.price,o.prepayment,o.remaining,displayDateTime(o.pickup),o.operatorName,o.branchName,o.status,o.telegramSent?'Ha':'Yo‘q',o.printed?'Ha':'Yo‘q']);
  const csv=[headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='TortHouse_Zakazlar.csv'; a.click();
}
function loadSettings(){
  const s=getSettings(); ['operatorName','branchName','botToken','chatId','scriptUrl'].forEach(id=>{if(s[id]) $(id).value=s[id];});
}
function saveSettings(){
  const s={}; ['operatorName','branchName','botToken','chatId','scriptUrl'].forEach(id=>s[id]=$(id).value.trim()); setSettings(s); alert('Sozlamalar saqlandi.');
}
async function compressImage(file){
  return new Promise(resolve=>{
    const reader=new FileReader(); reader.onload=e=>{
      const img=new Image(); img.onload=()=>{
        const max=1000; let w=img.width,h=img.height; if(w>h && w>max){h=Math.round(h*max/w);w=max}else if(h>max){w=Math.round(w*max/h);h=max}
        const c=document.createElement('canvas'); c.width=w;c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); resolve(c.toDataURL('image/jpeg',0.75));
      }; img.src=e.target.result;
    }; reader.readAsDataURL(file);
  });
}
function bind(){
  document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab,.screen').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.screen).classList.add('active');renderOrders();});
  $('source').onchange=()=> $('sourceOtherWrap').classList.toggle('hidden',$('source').value!=='Boshqa');
  ['price','prepayment'].forEach(id=>$(id).oninput=updateRemaining);
  $('customerPhone').onfocus=()=>{if(!$('customerPhone').value.startsWith('+998')) $('customerPhone').value='+998 ';};
  document.querySelectorAll('[data-fill]').forEach(b=>b.onclick=()=>{$(b.dataset.fill).value='Yo‘q'});
  $('saveOrder').onclick=()=>saveOrder(false); $('savePrint').onclick=()=>saveOrder(true);
  $('clearImage').onclick=()=>{currentImage='';$('preview').classList.add('hidden');$('imageInput').value='';};
  $('imageInput').onchange=async e=>{const f=e.target.files[0]; if(f){currentImage=await compressImage(f);$('preview').src=currentImage;$('preview').classList.remove('hidden');}};
  $('search').oninput=renderOrders;
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;renderOrders();});
  $('exportCsv').onclick=exportCsv; $('saveSettings').onclick=saveSettings;
  $('syncAll').onclick=async()=>{let c=0; for(const o of getOrders().filter(x=>!x.telegramSent)){try{if(await sendTelegram(o))c++;}catch(e){}} alert(c+' ta zakaz yuborildi.');};
  $('printReceipt').onclick=()=>window.print(); $('closeReceipt').onclick=()=>$('receiptModal').classList.add('hidden');
}
window.addEventListener('beforeinstallprompt', (e)=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false;});
$('installBtn')?.addEventListener('click', async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').hidden=true;}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js').catch(()=>{});}
bind(); loadSettings(); renderOrders();
