/* KYNC Dashboard JS — loaded via script src, not textContent injection */

/* Inject KYNC logo into every modal head */
(function(){
  function injectLogos(){
    document.querySelectorAll('.modal .modal-head, .help-drawer .help-drawer-head').forEach(function(h){
      if(h.querySelector('.modal-kync-logo'))return;
      var img=document.createElement('img');
      img.src='/Kync_logo.png';img.className='modal-kync-logo';img.alt='KYNC';
      h.insertBefore(img,h.firstChild);
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',injectLogos);}
  else{injectLogos();}
})();

/* Core */
function showToast(msg){var t=document.getElementById('toast');if(!t)return;document.getElementById('toast-msg').textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2800);}
function saveAndToast(id,msg){closeModal(id);setTimeout(function(){showToast(msg);},120);}

/* Modals */
function openModal(id){
  var el=document.getElementById(id);
  if(el){el.classList.add('open');document.body.style.overflow='hidden';}
  if(id==='modal-reports'){loadReport('month');}
  if(id==='modal-add-bill'){loadBillCategories();}
  if(id==='modal-invite'){
    // Always reset to Child mode
    var childPill=document.querySelector('#modal-invite .role-pill:nth-child(3)');
    if(childPill){selectInviteRole(childPill,'child');}
    // Clear name + PIN fields
    var nameEl=document.getElementById('invite-name');
    if(nameEl)nameEl.value='';
    ['pin-1','pin-2','pin-3','pin-4'].forEach(function(pid){
      var p=document.getElementById(pid);if(p)p.value='';
    });
    var btn=document.getElementById('invite-btn');
    if(btn){btn.disabled=false;btn.textContent='Create child account';}
    var sub=document.getElementById('invite-sub');
    if(sub)sub.textContent='Set up a PIN-only account for your child.';
  }
}
function closeModal(id){var el=document.getElementById(id);if(el){el.classList.remove('open');document.body.style.overflow='';}}
function backdropClose(e,id){if(e.target===document.getElementById(id))closeModal(id);}

/* Help drawer */
function openHelp(){var el=document.getElementById('help-backdrop');if(el){el.classList.add('open');document.body.style.overflow='hidden';}}
function closeHelp(){var el=document.getElementById('help-backdrop');if(el){el.classList.remove('open');document.body.style.overflow='';}}
function toggleFaq(el){el.classList.toggle('open');}

/* Wizard */
var wStep=0;
function wizNext(){if(wStep<3){wStep++;renderWiz();}}
function wizBack(){if(wStep>0){wStep--;renderWiz();}}
function renderWiz(){
  for(var i=0;i<4;i++){
    var s=document.getElementById('wstep-'+i),d=document.getElementById('wdot-'+i);
    if(s)s.classList.toggle('active',i===wStep);
    if(d){d.classList.remove('active','done');if(i===wStep)d.classList.add('active');else if(i<wStep)d.classList.add('done');}
  }
}

/* UI helpers */
function togglePerm(el){el.classList.toggle('on');}

function selectRole(el){
  var parent=el.parentElement;
  var isMulti=parent.getAttribute('data-multi')==='true';
  if(isMulti){
    var isEveryone=el.getAttribute('data-everyone')==='true';
    if(isEveryone){
      if(el.classList.contains('sel')){el.classList.remove('sel');}
      else{parent.querySelectorAll('.role-pill').forEach(function(p){p.classList.remove('sel');});el.classList.add('sel');}
    } else {
      parent.querySelectorAll('[data-everyone]').forEach(function(p){p.classList.remove('sel');});
      el.classList.toggle('sel');
      var anySelected=Array.from(parent.querySelectorAll('.role-pill')).some(function(p){return p.classList.contains('sel');});
      if(!anySelected){parent.querySelector('[data-everyone]').classList.add('sel');}
    }
  } else {
    parent.querySelectorAll('.role-pill').forEach(function(p){p.classList.remove('sel');});
    el.classList.add('sel');
  }
}

function selectRecurring(el,modalId){
  el.parentElement.querySelectorAll('[data-recur]').forEach(function(p){p.classList.remove('sel');});
  el.classList.add('sel');
  var type=el.getAttribute('data-recur');
  var weekly=document.getElementById('recur-weekly-'+modalId);
  var monthly=document.getElementById('recur-monthly-'+modalId);
  var endBlock=document.getElementById('recur-end-'+modalId);
  if(weekly)weekly.style.display=type==='weekly'?'block':'none';
  if(monthly)monthly.style.display=type==='monthly'?'block':'none';
  if(endBlock)endBlock.style.display=type==='none'?'none':'block';
}

function selectRecurEnd(el,modalId){
  el.parentElement.querySelectorAll('[data-endtype]').forEach(function(p){p.classList.remove('sel');});
  el.classList.add('sel');
  var type=el.getAttribute('data-endtype');
  var onEl=document.getElementById('recur-end-on-'+modalId);
  var afterEl=document.getElementById('recur-end-after-'+modalId);
  if(onEl)onEl.style.display=type==='on'?'flex':'none';
  if(afterEl)afterEl.style.display=type==='after'?'flex':'none';
}

function getRecurEnd(modalId){
  var pill=document.querySelector('#recur-end-'+modalId+' [data-endtype].sel');
  var type=pill?pill.getAttribute('data-endtype'):'never';
  if(type==='on'){var d=document.getElementById('recur-end-date-'+modalId);return{recur_end_type:'on',recur_end_value:d?d.value:null};}
  if(type==='after'){var c=document.getElementById('recur-end-count-'+modalId);return{recur_end_type:'after',recur_end_value:c?parseInt(c.value)||10:10};}
  return{recur_end_type:'never',recur_end_value:null};
}

function selectMonthlyType(el,modalId){
  el.parentElement.querySelectorAll('[data-monthtype]').forEach(function(p){p.classList.remove('sel');});
  el.classList.add('sel');
  var type=el.getAttribute('data-monthtype');
  var dateEl=document.getElementById('monthly-date-'+modalId);
  var dayEl=document.getElementById('monthly-day-'+modalId);
  if(dateEl)dateEl.style.display=type==='date'?'block':'none';
  if(dayEl)dayEl.style.display=type==='day'?'block':'none';
}

function selectInviteRole(el,role){
  el.parentElement.querySelectorAll('.role-pill').forEach(function(p){p.classList.remove('sel');});
  el.classList.add('sel');
  var emailSection=document.getElementById('invite-email-section');
  var pinSection=document.getElementById('invite-pin-section');
  var inviteBtn=document.getElementById('invite-btn');
  var inviteSub=document.getElementById('invite-sub');
  if(role==='child'){
    if(emailSection)emailSection.style.display='none';
    if(pinSection)pinSection.style.display='block';
    if(inviteBtn)inviteBtn.textContent='Create child account';
    if(inviteSub)inviteSub.textContent='Set up a PIN-only account for your child.';
  } else {
    if(emailSection)emailSection.style.display='block';
    if(pinSection)pinSection.style.display='none';
    if(inviteBtn)inviteBtn.textContent='Send invite';
    if(inviteSub)inviteSub.textContent='Send an email invite to join your family.';
  }
}

function pinNext(el,nextId){
  el.value=el.value.toString().slice(-1);
  if(el.value&&nextId){var next=document.getElementById(nextId);if(next)next.focus();}
}

function previewAvatar(input,previewId,headerId){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    var prev=document.getElementById(previewId);
    var head=document.getElementById(headerId);
    var img='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    if(prev)prev.innerHTML=img;
    if(head)head.innerHTML=img;
  };
  reader.readAsDataURL(input.files[0]);
}

function selectUrgency(el,t){
  el.parentElement.querySelectorAll('.urgency-pill').forEach(function(p){p.classList.remove('sel-soon','sel-mid','sel-ok');});
  el.classList.add('sel-'+t);
}

function selectColour(el,m){
  el.parentElement.querySelectorAll('.colour-swatch').forEach(function(s){s.classList.remove('sel');});
  el.classList.add('sel');
  var h=document.getElementById('av-header-'+m);
  if(h&&!h.querySelector('img'))h.style.background=el.style.background;
}

function toggleCalSync(row){
  var s=row.querySelector('.cal-sync-status');
  row.classList.toggle('connected');
  if(s)s.textContent=row.classList.contains('connected')?'Connected':'Not connected';
}

function toggleSleep(m){
  var t=document.getElementById('sleep-toggle-'+m);
  var ti=document.getElementById('sleep-times-'+m);
  var on=t.classList.toggle('on');
  if(ti)ti.style.display=on?'grid':'none';
}

function updateBar(m,cur){
  var inp=document.getElementById('target-'+m);
  var fill=document.getElementById('progress-'+m);
  var pct=document.getElementById('pct-'+m);
  if(!inp)return;
  var tgt=Math.max(1,parseInt(inp.value)||1);
  if(fill)fill.style.width=Math.min(100,Math.round(cur/tgt*100))+'%';
  if(pct)pct.textContent='Goal: '+tgt+' pts';
}

/* Bedtime */
function showBedtime(){
  var overlay=document.getElementById('bedtime-overlay');
  if(!overlay)return;
  overlay.classList.add('active');
  document.querySelectorAll('.modal-backdrop.open').forEach(function(m){m.classList.remove('open');});
  document.body.style.overflow='hidden';
  var c=document.getElementById('bedtime-stars');
  if(c&&!c.children.length){
    for(var i=0;i<80;i++){
      var s=document.createElement('div');
      s.className='bedtime-star';
      s.style.left=Math.random()*100+'%';
      s.style.top=Math.random()*100+'%';
      s.style.setProperty('--d',(2+Math.random()*4)+'s');
      s.style.setProperty('--dl',Math.random()*4+'s');
      s.style.setProperty('--op',(0.3+Math.random()*0.7).toFixed(2));
      c.appendChild(s);
    }
  }
}
function hideBedtime(){
  var overlay=document.getElementById('bedtime-overlay');
  if(overlay)overlay.classList.remove('active');
  document.body.style.overflow='';
}

/* ESC key */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeHelp();
    document.querySelectorAll('.modal-backdrop.open').forEach(function(m){m.classList.remove('open');document.body.style.overflow='';});
    hideBedtime();
    closeKidsView();
  }
});

/* Reports */
function printReport(){window.print();showToast('Print dialog opened');}

/* Bill categories */
var _billCategories=[];
function loadBillCategories(){
  fetch('/api/bill-categories').then(function(r){return r.json();}).then(function(cats){
    _billCategories=cats||[];
    var sel=document.getElementById('bill-category-select');
    if(!sel)return;
    sel.innerHTML='';
    cats.forEach(function(c){
      var o=document.createElement('option');
      o.value=c.name;o.textContent=c.name;sel.appendChild(o);
    });
    var addOpt=document.createElement('option');
    addOpt.value='__add__';addOpt.textContent='+ Add new category...';sel.appendChild(addOpt);
  }).catch(function(){});
}
function onBillCategoryChange(sel){
  if(sel.value==='__add__'){
    var name=prompt('New category name:');
    if(!name||!name.trim()){sel.value=(_billCategories[0]&&_billCategories[0].name)||'Other';return;}
    var colour=prompt('Colour (hex, e.g. #1D9E75):')||'#1D9E75';
    fetch('/api/bill-categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim(),colour:colour})})
    .then(function(r){return r.json();}).then(function(c){
      _billCategories.push(c);
      var o=document.createElement('option');
      o.value=c.name;o.textContent=c.name;
      var addOpt=sel.querySelector('[value="__add__"]');
      sel.insertBefore(o,addOpt);
      sel.value=c.name;
      showToast('Category "'+c.name+'" added');
    }).catch(function(){showToast('Could not save category');sel.value=(_billCategories[0]&&_billCategories[0].name)||'Other';});
  }
}

/* Save chore */
function saveChore(){
  var titleEl=document.querySelector('#modal-kids-chore input[type=text]');
  var title=titleEl&&titleEl.value.trim();
  if(!title){showToast('Enter a chore title');return;}

  // Assignees — selected role-pills (excluding Everyone logic)
  var assigneePills=document.querySelectorAll('#modal-kids-chore .modal-field:nth-child(2) .role-pill.sel');
  var assignees=[];
  assigneePills.forEach(function(p){assignees.push(p.textContent.trim());});
  if(!assignees.length)assignees=['Everyone'];

  // Time of day
  var todPills=document.querySelectorAll('#modal-kids-chore [data-tod].sel');
  var tod=[];
  todPills.forEach(function(p){tod.push(p.getAttribute('data-tod'));});
  var notes=tod.length?'Time: '+tod.join(', '):undefined;

  // Recur
  var recurPill=document.querySelector('#modal-kids-chore [data-recur].sel');
  var recur=recurPill?recurPill.getAttribute('data-recur'):'none';

  // Points
  var ptsEl=document.querySelector('#modal-kids-chore input[type=number]');
  var points=ptsEl?parseInt(ptsEl.value)||5:5;

  // Today as default date
  var today=new Date().toISOString().slice(0,10);

  var recurEnd=recur==='none'?{}:getRecurEnd('chore');
  fetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({title:title,date:today,type:'chore',colour:'green',assignees:assignees,recur:recur,notes:notes||null,points:points},recurEnd))
  }).then(function(r){
    if(r.ok){
      closeModal('modal-kids-chore');
      showToast('Chore added – '+title);
      if(titleEl)titleEl.value='';
    } else {showToast('Could not save chore');}
  }).catch(function(){showToast('Could not save chore');});
}

/* Save task */
function saveTask(){
  var titleEl=document.querySelector('#modal-add-task input[type=text]');
  var title=titleEl&&titleEl.value.trim();
  if(!title){showToast('Enter a task title');return;}
  var dateEl=document.querySelector('#modal-add-task input[type=date]');
  var date=dateEl&&dateEl.value||new Date().toISOString().slice(0,10);
  var assigneePills=document.querySelectorAll('#modal-add-task .role-pill.sel');
  var assignees=[];
  assigneePills.forEach(function(p){assignees.push(p.textContent.trim());});
  if(!assignees.length)assignees=['Everyone'];
  var recurPill=document.querySelector('#modal-add-task [data-recur].sel');
  var recur=recurPill?recurPill.getAttribute('data-recur'):'none';
  var notesEl=document.querySelector('#modal-add-task input[placeholder*="detail"]');
  var notes=notesEl&&notesEl.value.trim()||null;
  var recurEnd=recur==='none'?{}:getRecurEnd('task');
  fetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({title:title,date:date,type:'task',colour:'blue',assignees:assignees,recur:recur,notes:notes},recurEnd))
  }).then(function(r){
    if(r.ok){closeModal('modal-add-task');showToast('Task added – '+title);if(titleEl)titleEl.value='';}
    else{showToast('Could not save task');}
  }).catch(function(){showToast('Could not save task');});
}

/* Save event */
function saveEvent(){
  var titleEl=document.querySelector('#modal-add-event input[type=text]');
  var title=titleEl&&titleEl.value.trim();
  if(!title){showToast('Enter an event title');return;}
  var dateEl=document.querySelector('#modal-add-event input[type=date]');
  var date=dateEl&&dateEl.value||new Date().toISOString().slice(0,10);
  var assigneePills=document.querySelectorAll('#modal-add-event .role-pill.sel');
  var assignees=[];
  assigneePills.forEach(function(p){assignees.push(p.textContent.trim());});
  if(!assignees.length)assignees=['Everyone'];
  var recurPill=document.querySelector('#modal-add-event [data-recur].sel');
  var recur=recurPill?recurPill.getAttribute('data-recur'):'none';
  fetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({title:title,date:date,type:'event',colour:'purple',assignees:assignees,recur:recur})
  }).then(function(r){
    if(r.ok){closeModal('modal-add-event');showToast('Event added – '+title);if(titleEl)titleEl.value='';}
    else{showToast('Could not save event');}
  }).catch(function(){showToast('Could not save event');});
}

/* Save bill */
function saveBill(){
  var nameEl=document.querySelector('#modal-add-bill input[type=text]');
  var amountEl=document.querySelector('#modal-add-bill input[type=number]');
  var dateEl=document.querySelector('#modal-add-bill input[type=date]');
  var catEl=document.getElementById('bill-category-select');
  var name=nameEl&&nameEl.value.trim();
  var amount=amountEl&&amountEl.value;
  var date=dateEl&&dateEl.value;
  var category=catEl&&catEl.value;
  if(!name){showToast('Enter a bill name');return;}
  if(!amount){showToast('Enter an amount');return;}
  if(!date){showToast('Enter a due date');return;}
  fetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({title:name,date:date,type:'event',colour:'amber',assignees:['Everyone'],recur:'none',
      bill_amount:parseFloat(amount),bill_category:category||'Other',bill_status:'upcoming',notes:'Bill: '+name})
  }).then(function(r){
    if(r.ok){closeModal('modal-add-bill');showToast('Bill added');}
    else{showToast('Could not save bill');}
  }).catch(function(){showToast('Could not save bill');});
}

/* Financial reports */
var _reportData={};
var _reportPeriod='month';
function loadReport(period){
  _reportPeriod=period||'month';
  fetch('/api/reports?period='+_reportPeriod).then(function(r){return r.json();}).then(function(d){
    _reportData=d;renderReport(d);
  }).catch(function(){showToast('Could not load report data');});
}
function switchPeriod(el,period){
  document.querySelectorAll('.report-tab').forEach(function(t){t.classList.remove('active');});
  el.classList.add('active');
  loadReport(period);
}
function renderReport(d){
  var fmt=function(n){return '$'+(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');};
  var g=function(id){return document.getElementById(id);};
  if(g('rep-total'))g('rep-total').textContent=fmt(d.summary&&d.summary.total);
  if(g('rep-paid'))g('rep-paid').textContent=fmt(d.summary&&d.summary.paid);
  if(g('rep-upcoming'))g('rep-upcoming').textContent=fmt(d.summary&&d.summary.upcoming);
  if(g('rep-overdue'))g('rep-overdue').textContent=fmt(d.summary&&d.summary.overdue);
  if(g('rep-period-label'))g('rep-period-label').textContent=d.label||'';
  var cats=d.categories||[];
  var catList=g('rep-cats');
  if(catList&&cats.length){
    var maxAmt=(cats[0]&&cats[0].amount)||1;
    var colours=['#1D9E75','#1976D2','#7F77DD','#D85A30','#D97706','#DC2626','#A09893'];
    catList.innerHTML=cats.map(function(c,i){
      var pct=Math.round((c.amount/maxAmt)*100);
      return '<div class="report-cat-row"><div class="report-cat-label">'+c.name+'</div>'+
        '<div class="report-cat-bar-wrap"><div class="report-cat-bar" style="width:'+pct+'%;background:'+colours[i%colours.length]+'">'+pct+'%</div></div>'+
        '<div class="report-cat-amount">'+fmt(c.amount)+'</div></div>';
    }).join('');
  } else if(catList){
    catList.innerHTML='<div style="color:var(--text-3);font-size:13px;padding:12px 0">No bills recorded this period.</div>';
  }
  var bills=d.bills||[];
  var table=g('rep-bills-body');
  if(table&&bills.length){
    table.innerHTML=bills.map(function(b){
      var sc=b.bill_status==='paid'?'status-paid':b.bill_status==='overdue'?'status-overdue':'status-due';
      var st=b.bill_status==='paid'?'Paid':b.bill_status==='overdue'?'Overdue':'Due soon';
      return '<div class="report-table-row"><div><div class="report-bill-name">'+b.title+'</div></div>'+
        '<div><span class="report-bill-cat">'+(b.bill_category||'Other')+'</span></div>'+
        '<div class="report-bill-amount">'+fmt(b.bill_amount)+'</div>'+
        '<div><span class="report-bill-status '+sc+'">'+st+'</span></div></div>';
    }).join('');
  } else if(table){
    table.innerHTML='<div style="color:var(--text-3);font-size:13px;padding:12px">No bills found for this period.</div>';
  }
}
function exportReportCSV(){
  var d=_reportData;if(!d.bills)return;
  var fmt=function(n){return(n||0).toFixed(2);};
  var rows=[['Bill','Category','Amount','Status','Date']];
  (d.bills||[]).forEach(function(b){rows.push([b.title,b.bill_category||'Other',fmt(b.bill_amount),b.bill_status,b.date]);});
  rows.push(['','Total',fmt(d.summary&&d.summary.total),'','']);
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='KYNC-report-'+_reportPeriod+'-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();showToast('CSV downloaded');
}
function exportPDF(){
  var d=_reportData;
  var fmt=function(n){return'$'+(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');};
  var rows=(d.bills||[]).map(function(b){
    var sc=b.bill_status==='paid'?'paid':b.bill_status==='overdue'?'overdue':'due';
    var st=b.bill_status==='paid'?'Paid':b.bill_status==='overdue'?'Overdue':'Due soon';
    return '<tr><td>'+b.title+'</td><td>'+(b.bill_category||'Other')+'</td><td>'+fmt(b.bill_amount)+'</td><td class="'+sc+'">'+st+'</td><td>'+b.date+'</td></tr>';
  }).join('');
  var w=window.open('','_blank');if(!w)return;
  var sum=d.summary||{};
  w.document.write('<!DOCTYPE html><html><head><title>KYNC Report</title><style>body{font-family:sans-serif;padding:32px;color:#1A1714;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{text-align:left;font-size:12px;padding:8px 12px;border-bottom:2px solid #E8E4DF;background:#F5F2EF;}td{padding:10px 12px;border-bottom:1px solid #F0EDE9;font-size:13px;}.paid{color:#1D9E75;font-weight:700;}.due{color:#D97706;font-weight:700;}.overdue{color:#E24B4A;font-weight:700;}</style></head><body>');
  w.document.write('<h1>KYNC Financial Report</h1><h2>'+(d.label||'')+'</h2>');
  w.document.write('<table><tr><th>Bill</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th></tr>'+rows+'</table>');
  w.document.write('</body></html>');
  w.document.close();w.focus();
  setTimeout(function(){w.print();},300);
  showToast('PDF — use Print to Save as PDF');
}

/* AI Scanner */
var SCAN_DEMO={
  bill:{type:'Bill detected',icon:'ti-receipt',title:'Synergy Energy — July 2024',confidence:'96',fields:[{label:'Provider',key:'provider',value:'Synergy Energy'},{label:'Amount',key:'amount',value:'$210.50'},{label:'Due date',key:'due_date',value:'25 Jul 2024'},{label:'Category',key:'category',value:'Utilities'}],saveMsg:'Bill saved — $210.50 due Jul 25'},
  event:{type:'Calendar event detected',icon:'ti-calendar-event',title:'School End-of-Year Concert',confidence:'94',fields:[{label:'Event',key:'title',value:'End-of-Year Concert'},{label:'Date',key:'date',value:'Fri 12 Jul 2024'},{label:'Time',key:'time',value:'6:30 PM'},{label:'Location',key:'location',value:'School Assembly Hall'}],saveMsg:'Event added to calendar'}
};
var scanCurrentType=null,scanCurrentData=null;
function closeScan(){closeModal('modal-scan');resetScan();}
function startScan(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  if(!file.type.startsWith('image/')&&file.type!=='application/pdf'){showToast('Please upload an image or PDF');return;}
  if(file.size>20*1024*1024){showToast('File must be under 20 MB');return;}
  var reader=new FileReader();
  reader.onload=function(e){callClaudeScanner(e.target.result.split(',')[1],file.type);};
  reader.readAsDataURL(file);
}
function runDemoScan(type){
  showProcessing('Analysing document...');
  var steps=['Uploading document...','Detecting document type...','Extracting key details...','Cross-checking fields...','Almost done...'];
  var i=0,logEl=document.getElementById('scan-log');
  if(logEl)logEl.innerHTML='';
  var interval=setInterval(function(){
    if(i<steps.length){if(logEl)logEl.innerHTML+='-> '+steps[i]+'<br>';i++;}
    else{clearInterval(interval);setTimeout(function(){showScanResult(SCAN_DEMO[type],type);},400);}
  },500);
}
async function callClaudeScanner(base64Data,mimeType){
  showProcessing('Reading your document...');
  var logEl=document.getElementById('scan-log');
  if(logEl)logEl.innerHTML='-> Uploading...<br>';
  try{
    var isImage=mimeType.startsWith('image/');
    var contentBlock=isImage?{type:'image',source:{type:'base64',media_type:mimeType,data:base64Data}}:{type:'document',source:{type:'base64',media_type:'application/pdf',data:base64Data}};
    if(logEl)logEl.innerHTML+='-> Analysing content...<br>';
    var response=await fetch('/api/ai-scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contentBlock:contentBlock})});
    if(!response.ok)throw new Error('API error '+response.status);
    var parsed=await response.json();
    if(logEl)logEl.innerHTML+='-> Processing response...<br>';
    showScanResult({type:parsed.type==='bill'?'Bill detected':'Calendar event detected',icon:parsed.type==='bill'?'ti-receipt':'ti-calendar-event',title:parsed.title||'Document scanned',confidence:String(parsed.confidence||85),fields:parsed.fields||[],saveMsg:parsed.type==='bill'?'Bill saved to KYNC':'Event added to calendar'},parsed.type);
  }catch(err){
    if(logEl)logEl.innerHTML+='-> Showing demo result...<br>';
    setTimeout(function(){showScanResult(SCAN_DEMO['bill'],'bill');},800);
  }
}
function showProcessing(msg){
  var upload=document.getElementById('scan-step-upload');
  var proc=document.getElementById('scan-step-processing');
  if(upload)upload.style.display='none';
  if(proc){proc.classList.add('active');var m=document.getElementById('scan-processing-msg');if(m)m.textContent=msg;}
}
function showScanResult(data,type){
  var proc=document.getElementById('scan-step-processing');
  var res=document.getElementById('scan-step-result');
  if(proc)proc.classList.remove('active');
  if(!res)return;
  res.classList.add('active');
  var icon=document.getElementById('scan-result-icon');if(icon)icon.className='ti '+data.icon;
  var rt=document.getElementById('scan-result-type');if(rt)rt.textContent=data.type;
  var rtitle=document.getElementById('scan-result-title');if(rtitle)rtitle.textContent=data.title;
  var rc=document.getElementById('scan-confidence-val');if(rc)rc.textContent=data.confidence+'%';
  scanCurrentData=data;scanCurrentType=type;
  window._scanFieldValues={};
  var container=document.getElementById('scan-fields-container');
  if(!container)return;
  container.innerHTML='';
  (data.fields||[]).forEach(function(f){
    window._scanFieldValues[f.key]=f.value;
    var row=document.createElement('div');row.className='scan-field-row';
    var labelDiv=document.createElement('div');labelDiv.className='scan-field-label';labelDiv.textContent=f.label;
    var valDiv=document.createElement('div');valDiv.className='scan-field-value';valDiv.id='sfv-'+f.key;valDiv.textContent=f.value;
    var editBtn=document.createElement('span');editBtn.className='scan-edit-toggle';editBtn.textContent='Edit';
    (function(key){editBtn.addEventListener('click',function(){toggleScanEdit(key);});})(f.key);
    row.appendChild(labelDiv);row.appendChild(valDiv);row.appendChild(editBtn);
    container.appendChild(row);
  });
}
function toggleScanEdit(key){
  var valEl=document.getElementById('sfv-'+key);
  if(!valEl)return;
  if(valEl.querySelector('input')){valEl.textContent=valEl.querySelector('input').value;}
  else{
    var input=document.createElement('input');input.className='scan-field-edit';input.value=valEl.textContent;
    valEl.textContent='';valEl.appendChild(input);input.focus();
    input.addEventListener('blur',function(){valEl.textContent=input.value;});
  }
}
function confirmScan(){
  var msg=(scanCurrentData&&scanCurrentData.saveMsg)||'Saved to KYNC';
  closeModal('modal-scan');setTimeout(function(){showToast(msg);},120);resetScan();
}
function resetScan(){
  var upload=document.getElementById('scan-step-upload');
  var proc=document.getElementById('scan-step-processing');
  var res=document.getElementById('scan-step-result');
  var log=document.getElementById('scan-log');
  var fi=document.getElementById('scan-file-input');
  if(upload)upload.style.display='block';
  if(proc)proc.classList.remove('active');
  if(res)res.classList.remove('active');
  if(log)log.innerHTML='';
  if(fi)fi.value='';
  scanCurrentType=null;scanCurrentData=null;
}

/* Attachments */
var attachments={};
function handleAttach(input,modalId){
  if(!attachments[modalId])attachments[modalId]=[];
  var list=document.getElementById('attach-list-'+modalId);
  if(!list)return;
  Array.from(input.files).forEach(function(file){
    var id=Date.now()+Math.random();
    attachments[modalId].push({id:id,file:file});
    var isImg=file.type.startsWith('image/');
    var size=file.size<1024*1024?Math.round(file.size/1024)+'KB':(file.size/1024/1024).toFixed(1)+'MB';
    var item=document.createElement('div');item.className='attach-item';item.id='attach-item-'+id;
    item.innerHTML='<div class="attach-item-icon"><i class="ti ti-'+(isImg?'photo':'file-text')+'"></i></div>'
      +'<div class="attach-item-name">'+file.name+'</div>'
      +'<div class="attach-item-size">'+size+'</div>'
      +'<div class="attach-item-del"><i class="ti ti-x"></i></div>';
    item.querySelector('.attach-item-del').addEventListener('click',function(){removeAttach(id,modalId);});
    if(isImg){var reader=new FileReader();reader.onload=function(e){var ic=item.querySelector('.attach-item-icon');if(ic)ic.innerHTML='<img src="'+e.target.result+'">';};reader.readAsDataURL(file);}
    list.appendChild(item);
  });
  input.value='';
}
function removeAttach(id,modalId){
  if(attachments[modalId])attachments[modalId]=attachments[modalId].filter(function(a){return a.id!=id;});
  var el=document.getElementById('attach-item-'+id);if(el)el.remove();
}

/* Device mode */
var DEVICE_MODE_DESC={
  personal:'Personal mode — full dashboard access with all admin controls visible.',
  kiosk:'Kiosk mode — family hub view, optimised for a shared tablet.',
  kids:'Kids mode — child-safe view only. Shows chores, homework and points.'
};
function selectDeviceMode(el,mode){
  el.closest('.device-mode-grid').querySelectorAll('.device-mode-card').forEach(function(c){c.classList.remove('sel');});
  el.classList.add('sel');
  var desc=document.getElementById('device-mode-desc-text');
  if(desc)desc.textContent=DEVICE_MODE_DESC[mode]||'';
}

/* Kids View — load chores from Supabase */
function loadKidsChores(member, displayName){
  var slotId = member === 'olivia' ? 'kv-chores-olivia' : 'kv-chores-liam';
  var dateId = member === 'olivia' ? 'kv-date-olivia' : 'kv-date-liam';
  var ptsId  = member === 'olivia' ? 'kv-pts-olivia' : 'kv-pts-liam';
  var fillId = member === 'olivia' ? 'kv-pts-fill-olivia' : 'kv-pts-fill-liam';

  // Use the real display name if provided, fallback to slot-based default
  var memberLabel = displayName || (member === 'olivia' ? 'Child 1' : 'Child 2');
  // Also match just the first name (the pill label that was selected when adding the chore)
  var firstName = memberLabel.split(' ')[0];
  var today = new Date().toISOString().slice(0, 10);

  var dateEl = document.getElementById(dateId);
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long' });

  var slot = document.getElementById(slotId);
  if (!slot) return;
  slot.innerHTML = '<div style="padding:16px 0;color:var(--text-3);font-size:13px;text-align:center">Loading chores…</div>';

  fetch('/api/entries').then(function(r){ return r.json(); }).then(function(entries){
    // Filter: type=chore, recurring OR due today, assigned to this child or Everyone
    var chores = (entries || []).filter(function(e){
      if (e.type !== 'chore') return false;
      var assignees = e.assignees || [];
      var mine = assignees.some(function(a){ return a === memberLabel || a === firstName || a === 'Everyone'; });
      if (!mine) return false;
      // Show if recurring (daily/weekly/monthly) or specifically today
      return e.recur !== 'none' || e.date === today;
    });

    if (!chores.length) {
      slot.innerHTML = '<div style="padding:16px 0;color:var(--text-3);font-size:13px;text-align:center">No chores for today 🎉</div>';
      return;
    }

    var html = chores.map(function(c){
      var pts = c.points || 5;
      return '<div class="kv-chore-row">'
        + '<div class="kv-chore-check" onclick="kvToggle(this)"></div>'
        + '<div class="kv-chore-label">' + c.title + '</div>'
        + '<div class="kv-chore-pts">+' + pts + ' pts</div>'
        + '</div>';
    }).join('');
    slot.innerHTML = html;

    // Update points display
    var totalPts = chores.reduce(function(s, c){ return s + (c.points || 5); }, 0);
    var ptsEl = document.getElementById(ptsId);
    if (ptsEl) ptsEl.textContent = '0 / ' + totalPts + ' pts today';
    var fillEl = document.getElementById(fillId);
    if (fillEl) fillEl.style.width = '0%';
  }).catch(function(){
    if (slot) slot.innerHTML = '<div style="padding:16px 0;color:var(--text-3);font-size:13px;text-align:center">Could not load chores</div>';
  });
}

function openKidsView(member, displayName){
  var overlay=document.getElementById('kids-view-overlay');
  if(!overlay)return;
  var olivia=document.getElementById('kv-olivia');
  var liam=document.getElementById('kv-liam');
  if(olivia)olivia.style.display=member==='olivia'?'block':'none';
  if(liam)liam.style.display=member==='liam'?'block':'none';
  var greet=document.getElementById('kv-greeting');
  var firstName=displayName?(displayName.split(' ')[0]):(member==='olivia'?'Child 1':'Child 2');
  if(greet)greet.textContent='Hi '+firstName+'! 👋';
  document.querySelectorAll('.kv-tab').forEach(function(t){t.classList.remove('sel');t.style.background='';t.style.color='';t.style.borderColor='';});
  var tabs=document.querySelectorAll('.kv-tab');
  var idx=member==='olivia'?0:1;
  var tabColors={olivia:['var(--oj-bg)','var(--oj-fg)'],liam:['var(--lj-bg)','var(--lj-fg)']};
  if(tabs[idx]){tabs[idx].classList.add('sel');tabs[idx].style.background=tabColors[member][0];tabs[idx].style.color=tabColors[member][1];tabs[idx].style.borderColor=tabColors[member][0];}
  overlay.classList.add('active');
  document.body.style.overflow='hidden';
  loadKidsChores(member, displayName);
}
function closeKidsView(){
  var overlay=document.getElementById('kids-view-overlay');
  if(overlay)overlay.classList.remove('active');
  document.body.style.overflow='';
}
function kvToggle(el){
  el.classList.toggle('done');
  el.innerHTML=el.classList.contains('done')?'<i class="ti ti-check" style="font-size:11px;color:#fff;"></i>':'';
  var label=el.nextElementSibling;
  if(label)label.classList.toggle('done');
  var ptsEl=el.parentElement.querySelector('.kv-chore-pts');
  var pts=ptsEl?parseInt(ptsEl.textContent)||5:5;
  if(el.classList.contains('done'))showToast('Great job! +'+pts+' pts');
}

/* Bedtime settings save */
function saveBedtimeSettings(){
  var toggle=document.getElementById('sleep-toggle-olivia');
  var startEl=document.getElementById('bedtime-start-input');
  var endEl=document.getElementById('bedtime-end-input');
  var enabled=toggle&&toggle.classList.contains('on');
  var start=startEl?startEl.value:'20:30';
  var end=endEl?endEl.value:'07:00';
  fetch('/api/settings/bedtime',{method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({bedtime_enabled:enabled,bedtime_start:start,bedtime_end:end})
  }).then(function(r){
    if(r.ok){showToast('Bedtime settings saved');}
    else{showToast('Could not save — try again');}
  }).catch(function(){showToast('Could not save — try again');});
}
