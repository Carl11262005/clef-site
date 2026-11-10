import {CHAPTERS,DEMO_BOOKING,TERM_OPTIONS,createGuidedDemoState,reduceGuidedDemoState,getDemoGuidance,deriveDemoContext,summarizeDemoTerms,validDemoTermsStep} from './venue-demo-state.mjs?v=20261015-app-flow';

function el(doc,tag,classes='',text='') {
  const node=doc.createElement(tag); node.className=classes; node.textContent=text; return node;
}
const paths={
  calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
  dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  messages:'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-4 3V11.5A8.5 8.5 0 0 1 9.5 3h3a8.5 8.5 0 0 1 8.5 8.5Z',
  profile:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  arrow:'m14 6-6 6 6 6', chevron:'m9 5 7 7-7 7',
  check:'m5 12 4 4 10-10', music:'M9 18V5l12-2v13M9 6l12-2M9 18c0 2-6 4-6 1s6-4 6-1M21 16c0 2-6 4-6 1s6-4 6-1',
  clock:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2',
  send:'m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13',
  'cash-multiple':'M3 6h18v12H3zM6 9h12M6 15h12m-6-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  'currency-usd':'M12 2v20m5-16H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7',
  'credit-card-outline':'M3 5h18v14H3zM3 10h18m-14 5h4',
  'account-tie-outline':'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21c0-7 16-7 16 0m-9-7 1 2 1-2m-1 2-1 3 1 2 1-2-1-3',
};
function icon(doc,name) {
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
  const path=doc.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d',paths[name]||paths.music);
  svg.append(path);return svg;
}
function button(doc,label,action,{kind='primary',disabled=false,iconName=null}={}) {
  const node=el(doc,'button','venue-demo-app-button venue-demo-'+kind);
  node.type='button';node.dataset.demoAction=action;node.disabled=disabled;
  if(iconName) node.append(icon(doc,iconName));
  node.append(el(doc,'span','',label));return node;
}
function avatar(doc,initials=DEMO_BOOKING.initials,large=false) {
  return el(doc,'div','venue-demo-avatar'+(large?' venue-demo-avatar-large':''),initials);
}
function pill(doc,text,tone='neutral') {return el(doc,'span','venue-demo-pill venue-demo-tone-'+tone,text);}
function localDate(key) {const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d);}
function dateLabel(state,long=false) {return localDate(state.dateKey).toLocaleDateString('en-US',{weekday:long?'long':'short',month:long?'long':'short',day:'numeric'});}
function appHeader(doc,title,sub='',{back=false,light=false,compact=false}={}) {
  const header=el(doc,'header','venue-demo-app-header'+(light?' venue-demo-light-header':'')+(compact?' venue-demo-compact-header':''));
  if(back) header.append(button(doc,'Back','return',{kind:'back',iconName:'arrow'}));
  const copy=el(doc,'div','venue-demo-header-copy');
  const heading=el(doc,'h2','',title);heading.tabIndex=-1;copy.append(heading);
  if(sub)copy.append(el(doc,'p','',sub));header.append(copy);return header;
}
function card(doc,title,copy='',iconName=null) {
  const node=el(doc,'section','venue-demo-card');const heading=el(doc,'h3','',title);
  if(iconName)heading.prepend(icon(doc,iconName));node.append(heading);
  if(copy)node.append(el(doc,'p','',copy));return node;
}
function status(doc,text,tone='success') {
  const node=el(doc,'p','venue-demo-confirmation venue-demo-tone-'+tone);
  node.dataset.demoConfirmation='';node.append(icon(doc,tone==='success'?'check':'clock'),el(doc,'span','',text));return node;
}
function terms(doc,state,editable=false) {
  const summary=summarizeDemoTerms(state.terms);
  const list=el(doc,'dl','venue-demo-terms');
  for(const [label,value,step] of [
    ['Pay structure',summary.payStructure,1],['Amount',summary.amount,2],
    ['Payment method',summary.method,3],['Who pays',summary.payer,4],
    ['Payment timing',summary.timing,5],['Load-in',summary.loadIn,6],['Set time',summary.setTime,6],
  ]) {const row=el(doc,'div','venue-demo-term');row.append(el(doc,'dt','',label),el(doc,'dd','',value));
    if(editable){const edit=button(doc,'Edit','edit-term',{kind:'edit-term'});edit.dataset.step=String(step);edit.setAttribute('aria-label','Edit '+label);row.append(edit);}
    list.append(row);}
  return list;
}
function termChoice(doc,field,value,label,selected){
  const choice=button(doc,label,'set-term',{kind:'term-choice'});
  choice.dataset.field=field;choice.dataset.value=value;
  choice.setAttribute('aria-pressed',String(selected));
  choice.append(icon(doc,'check'));
  return choice;
}
function choices(doc,field,selected){
  const list=el(doc,'div','venue-demo-choice-list');
  for(const [value,label] of Object.entries(TERM_OPTIONS[field]))list.append(termChoice(doc,field,value,label,value===selected));
  return list;
}
function termField(doc,label,field,value,{type='text',prefix='',placeholder=''}={}){
  const wrap=el(doc,'label','venue-demo-field');
  wrap.append(el(doc,'span','venue-demo-field-label',label));
  const row=el(doc,'span','venue-demo-field-row');
  if(prefix)row.append(el(doc,'span','venue-demo-field-prefix',prefix));
  const input=el(doc,'input','venue-demo-field-input');input.name=field;input.dataset.demoField=field;
  input.type=type;input.value=value;input.placeholder=placeholder;
  if(type==='number'){input.min='0';input.step='any';input.inputMode='decimal';}
  if(type==='time')input.setAttribute('aria-label',label);
  row.append(input);wrap.append(row);return wrap;
}
function wizard(doc,state){
  const step=state.wizardStep,t=state.terms;
  const header=appHeader(doc,'Booking Terms','Set the terms',{back:true,compact:true});
  const body=el(doc,'div','venue-demo-app-scroll venue-demo-wizard-scroll');
  body.dataset.wizardStep=String(step);
  const progress=el(doc,'div','venue-demo-wizard-progress');
  progress.setAttribute('aria-label','Booking terms step '+step+' of 7');
  for(let i=1;i<=7;i++)progress.append(el(doc,'span',i<=step?'venue-demo-progress-active':''));
  body.append(progress,el(doc,'p','venue-demo-wizard-kicker','Step '+step+' of 7'));
  const headings=[
    ['cash-multiple','How are you paying?','Pick the structure that best fits this show.'],
    [t.payStructure==='door'?'cash-multiple':'currency-usd',
      t.payStructure==='door'?'What share of the door?':t.payStructure==='guarantee_plus'?'Floor and upside':t.payStructure==='tips'?'Tips only':"What’s the guaranteed amount?",
      t.payStructure==='door'?'What the musician earns from cover sales.':t.payStructure==='guarantee_plus'?'A guaranteed minimum plus a share of the door.':t.payStructure==='tips'?'No guaranteed amount on this one.':'The musician gets this no matter the draw.'],
    ['credit-card-outline','How will you pay them?','Method matters — musicians plan around it.'],
    ['account-tie-outline','Who pays on the night?','The person handing over money or hitting send.'],
    ['clock-outline','When will they be paid?','Be honest — this is the line that builds trust.'],
    ['clock','What time is the set?',`Set the start and end time for ${DEMO_BOOKING.artist}'s performance.`],
    ['check','Review and submit','Sending to '+DEMO_BOOKING.artist+' · '+dateLabel(state)],
  ];
  const [glyph,title,sub]=headings[step-1];
  const hero=el(doc,'div','venue-demo-wizard-hero');
  const emblem=el(doc,'span','venue-demo-wizard-icon');emblem.append(icon(doc,paths[glyph]?glyph:'clock'));
  hero.append(emblem,el(doc,'h3','venue-demo-wizard-title',title),el(doc,'p','venue-demo-muted',sub));body.append(hero);
  if(step===1)body.append(choices(doc,'payStructure',t.payStructure));
  if(step===2){
    if(['flat','guarantee_plus'].includes(t.payStructure))body.append(termField(doc,t.payStructure==='flat'?'Guaranteed amount':'Guaranteed minimum','flatAmount',t.flatAmount,{type:'number',prefix:'$',placeholder:'0'}));
    if(['door','guarantee_plus'].includes(t.payStructure)){
      body.append(termField(doc,'Share of ticket sales','doorPercentage',t.doorPercentage,{type:'number',prefix:'%',placeholder:'0'}));
      if(t.payStructure==='door')body.append(termField(doc,'Expenses deducted first (optional)','doorDeductions',t.doorDeductions));
    }
    if(t.payStructure==='tips')body.append(card(doc,'Tips Only','No guaranteed amount on this one.'));
  }
  if(step===3){body.append(choices(doc,'paymentMethod',t.paymentMethod));
    if(t.paymentMethod==='electronic')body.append(el(doc,'p','venue-demo-field-label','Choose an app'),choices(doc,'paymentApp',t.paymentApp));}
  if(step===4){body.append(choices(doc,'responsibleParty',t.responsibleParty));
    if(t.responsibleParty==='other')body.append(termField(doc,'Who specifically?','responsiblePartyOther',t.responsiblePartyOther,{placeholder:'e.g. Door host'}));}
  if(step===5)body.append(choices(doc,'paymentTiming',t.paymentTiming));
  if(step===6){
    body.append(termField(doc,'Starts','setStart',t.setStart,{type:'time'}),
      termField(doc,'Ends','setEnd',t.setEnd,{type:'time'}),
      termField(doc,'Load-in','loadInTime',t.loadInTime,{type:'time'}));
  }
  if(step===7)body.append(terms(doc,state,true));
  const footer=el(doc,'div','venue-demo-app-footer venue-demo-wizard-footer');
  footer.append(button(doc,'Back','return',{kind:'wizard-back'}),
    button(doc,step===7?'Send to Musician':'Continue',step===7?'send-terms':'next-terms',
      {disabled:!validDemoTermsStep(step,t),iconName:step===7?'send':null}));
  return [header,body,footer];
}
function stages(doc,state,interactive=true) {
  const context=deriveDemoContext(state), node=el(doc,'div','venue-demo-stages');
  for(const [key,label,tone] of [['interested','Interested','info'],['in-contact','In Contact','warning'],['confirmed','Confirmed','success']]) {
    const count=context.applicantPresent&&context.stage===key?1:0;
    const tab=el(doc,interactive?'button':'div','venue-demo-stage');
    if(interactive){tab.type='button';tab.dataset.demoAction='filter-stage';tab.dataset.stage=key;tab.setAttribute('aria-pressed',String(state.pipelineFilter===key));}
    if((interactive?state.pipelineFilter:context.stage)===key)tab.classList.add('venue-demo-tone-'+tone);
    tab.append(el(doc,'strong','',String(count)),el(doc,'span','',label));node.append(tab);
  }return node;
}
function tabs(doc,state) {
  const nav=el(doc,'nav','venue-demo-app-tabs');nav.setAttribute('aria-label','App navigation shown for context');
  const active=state.screen==='venue-profile'?'profile':state.chapter===0?(state.screen==='dashboard'?'dashboard':'calendar'):state.chapter===1?'dashboard':'messages';
  for(const [key,label] of [['dashboard','Dashboard'],['calendar','Calendar'],['messages','Messages'],['profile','Profile']]){
    const b=el(doc,'span','venue-demo-app-button venue-demo-tab');
    b.append(icon(doc,key),el(doc,'span','',label));
    if(active===key)b.setAttribute('aria-current','page');nav.append(b);
  }return nav;
}
function dashboard(doc,state) {
  const header=appHeader(doc,'Dashboard');
  header.classList.add('venue-demo-dashboard-header');
  header.querySelector('.venue-demo-header-copy').append(el(doc,'p','venue-demo-greeting','Good evening,\n'+DEMO_BOOKING.venue));
  const body=el(doc,'div','venue-demo-app-scroll'),context=deriveDemoContext(state);
  if(context.applicantPresent){
    const pipelineCopy=context.stage==='confirmed'?'The Copper Hollow is confirmed for your sample show.':
      context.stage==='in-contact'?'You are In Contact with The Copper Hollow.':
        'The Copper Hollow is interested in your open night.';
    const pipeline=card(doc,'Booking Pipeline',pipelineCopy);
    pipeline.classList.add('venue-demo-pipeline-card');
    const openPipeline=button(doc,'Open Booking Pipeline','open-pipeline',{kind:'on-orange'});
    openPipeline.append(icon(doc,'chevron'));
    pipeline.append(stages(doc,state,false),openPipeline);body.append(pipeline);
  }else{
    const empty=card(doc,'Your Next Great Show','Open a night on your calendar and make room for live music.','music');
    empty.prepend(pill(doc,'Ready for music','warning'));
    empty.append(button(doc,'Open Calendar','open-calendar',{iconName:'calendar'}));body.append(empty);
  }
  if(context.posted){
    const night=card(doc,context.bookingStatus==='confirmed'?'Confirmed Gig':'Open Night','Sample date · '+dateLabel(state));
    night.append(pill(doc,context.bookingStatus==='confirmed'?'Confirmed':'Night · 9 PM – Close',context.bookingStatus==='confirmed'?'success':'warning'));
    if(context.bookingStatus==='confirmed')night.append(el(doc,'p','',DEMO_BOOKING.artist));
    night.append(button(doc,'View Calendar','open-calendar',{kind:'secondary',iconName:'calendar'}));body.append(night);
  } else body.append(el(doc,'p','venue-demo-muted venue-demo-centered','Your bookings will stay together here.'));
  return [header,body];
}
function calendar(doc,state) {
  const header=appHeader(doc,'Calendar',DEMO_BOOKING.venue,{light:true});
  const body=el(doc,'div','venue-demo-app-scroll'),date=localDate(state.dateKey),context=deriveDemoContext(state);
  const guide=card(doc,'Calendar Guide');
  guide.classList.add('venue-demo-calendar-guide');
  const legend=el(doc,'div','venue-demo-legend');
  legend.append(pill(doc,'Booked','success'),pill(doc,'New requests','warning'),pill(doc,'In contact','info'),pill(doc,'Open slot','warning'));
  guide.append(legend);body.append(guide);
  const gridCard=card(doc,date.toLocaleDateString('en-US',{month:'long',year:'numeric'}));
  gridCard.classList.add('venue-demo-month-card');
  const grid=el(doc,'div','venue-demo-calendar-grid');grid.setAttribute('aria-label','Sample calendar');
  for(const weekday of ['Su','Mo','Tu','We','Th','Fr','Sa'])grid.append(el(doc,'span','venue-demo-weekday',weekday));
  const first=new Date(date.getFullYear(),date.getMonth(),1).getDay(),total=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  for(let i=0;i<first;i++)grid.append(el(doc,'span',''));
  for(let day=1;day<=total;day++){
    const selected=day===date.getDate();
    const cell=el(doc,selected?'button':'span','venue-demo-calendar-day'+(selected?' venue-demo-selected-day':''),String(day));
    if(selected){
      cell.type='button';cell.dataset.demoAction='select-day';cell.dataset.dateKey=state.dateKey;
      cell.setAttribute('aria-label',dateLabel(state,true)+' · Sample '+(state.done.confirmed?'confirmed booking':context.posted?'open date':'date'));
      if(state.done.confirmed)cell.classList.add('venue-demo-tone-success');
      cell.append(icon(doc,state.done.confirmed?'check':'calendar'));
    }grid.append(cell);
  }
  gridCard.append(grid,el(doc,'p','venue-demo-muted','Explore the highlighted sample Friday.'));body.append(gridCard);
  const choose=button(doc,(state.done.confirmed?'View Booking · ':'Choose ')+dateLabel(state),'select-day',{iconName:'calendar'});
  choose.dataset.dateKey=state.dateKey;body.append(choose);return [header,body];
}
function sheetBackdrop(doc,state){
  const underlay=el(doc,'div','venue-demo-sheet-underlay');
  underlay.setAttribute('aria-hidden','true');
  underlay.append(...calendar(doc,state));
  return underlay;
}
function daySheet(doc,state) {
  const body=el(doc,'div','venue-demo-sheet-overlay');
  const sheet=card(doc,dateLabel(state,true),'Manage availability for this date.');
  sheet.classList.add('venue-demo-bottom-sheet');
  sheet.prepend(el(doc,'div','venue-demo-sheet-handle'));
  sheet.querySelector('h3').replaceWith(el(doc,'h2','',dateLabel(state,true)));
  sheet.append(button(doc,'Open Date for Music','open-date',{kind:'sheet-row',iconName:'calendar'}),
    button(doc,'Close / Block Out Date','disabled',{kind:'sheet-row',iconName:'calendar'}),
    button(doc,'Go to Booking Pipeline','disabled',{kind:'sheet-row',iconName:'dashboard'}),
    button(doc,'Cancel','return',{kind:'sheet-cancel'}));body.append(sheet);return [body,sheetBackdrop(doc,state)];
}
function timeSheet(doc,state) {
  const body=el(doc,'div','venue-demo-sheet-overlay'),sheet=card(doc,'Choose an Open Slot','Which part of the day can artists apply for?');
  sheet.classList.add('venue-demo-bottom-sheet');
  sheet.prepend(el(doc,'div','venue-demo-sheet-handle'));
  sheet.querySelector('h3').replaceWith(el(doc,'h2','','Choose an Open Slot'));
  for(const [name,time] of [['Morning','7 AM – 12 PM'],['Afternoon','12 PM – 5 PM'],['Evening','5 PM – 9 PM']]){
    const row=el(doc,'div','venue-demo-slot venue-demo-slot-readonly');
    row.append(icon(doc,'clock'),el(doc,'strong','',name),el(doc,'span','',time));sheet.append(row);
  }
  const night=button(doc,'Night','select-night',{kind:'slot',iconName:'clock'});
  night.setAttribute('aria-pressed',String(state.nightSelected));
  night.append(el(doc,'span','','9 PM – Close'),icon(doc,'check'));sheet.append(night,
    button(doc,'Confirm','confirm-date',{disabled:!state.nightSelected}),
    button(doc,'Cancel','return',{kind:'sheet-cancel'}));body.append(sheet);return [body,sheetBackdrop(doc,state)];
}
function postedNight(doc,state) {
  if(deriveDemoContext(state).bookingStatus==='confirmed')return booking(doc,state,'confirmed');
  const header=appHeader(doc,'Calendar',DEMO_BOOKING.venue,{light:true});
  const body=el(doc,'div','venue-demo-app-scroll');body.append(status(doc,'Your night is open for music.'));
  const night=card(doc,dateLabel(state,true),'Sample date · Night');
  night.append(pill(doc,'OPEN','warning'),el(doc,'p','venue-demo-night-time','9 PM – Close'),
    button(doc,'View Applications','open-pipeline',{iconName:'chevron'}));body.append(night,button(doc,'Back to Calendar','return',{kind:'secondary'}));return [header,body];
}
function pipeline(doc,state) {
  const header=appHeader(doc,'Booking Pipeline','From first contact to confirmed booking.');
  header.append(stages(doc,state,false));
  const body=el(doc,'div','venue-demo-app-scroll'),context=deriveDemoContext(state);
  const labels={'interested':'Interested','in-contact':'In Contact','confirmed':'Confirmed'};
  const hint=state.pipelineFilter==='interested'?'Review each musician, then Accept to start talking.':
    state.pipelineFilter==='in-contact'?'You’re talking. Agree on a date, time, and what it takes to confirm.':
      'Confirmed shows and their details stay here.';
  body.append(card(doc,labels[state.pipelineFilter],hint));
  if(context.applicantPresent&&context.stage===state.pipelineFilter){
    body.append(el(doc,'h3','venue-demo-date-heading',dateLabel(state)+' · 1 musician'));
    const artist=card(doc,'');artist.classList.add('venue-demo-artist-row');
    const identity=el(doc,'div','venue-demo-identity'),copy=el(doc,'div','');
    copy.append(el(doc,'h3','',DEMO_BOOKING.artist),el(doc,'p','venue-demo-muted','3-Piece Band · Indie / Folk'));
    identity.append(avatar(doc),copy);artist.append(identity,
      el(doc,'p','venue-demo-artist-preview','We’d love to play your room this Friday.'),
      pill(doc,labels[context.stage],context.stage==='interested'?'info':context.stage==='confirmed'?'success':'warning'),
      button(doc,'View Profile','open-artist',{kind:'secondary',iconName:'profile'}));body.append(artist);
  }else{
    const empty=card(doc,'No '+labels[state.pipelineFilter]+' Artists','The sample band appears in its current stage.','music');body.append(empty);
  }return [header,body];
}
function profile(doc,state,isVenue=false) {
  const header=appHeader(doc,isVenue?'Venue Profile':'Artist Profile','',{back:true,light:true,compact:true});
  const body=el(doc,'div','venue-demo-app-scroll venue-demo-profile-scroll');
  const wallpaper=el(doc,'div','venue-demo-profile-wallpaper');
  const identity=el(doc,'div','venue-demo-profile-identity');
  identity.append(avatar(doc,isVenue?'LR':'CH',true),el(doc,'h3','venue-demo-profile-name',isVenue?DEMO_BOOKING.venue:DEMO_BOOKING.artist),
    pill(doc,isVenue?'Independent Venue':'3-Piece Band','warning'));
  body.append(wallpaper,identity);
  const profileTabs=el(doc,'div','venue-demo-profile-tabs');
  profileTabs.append(el(doc,'span','venue-demo-profile-tab venue-demo-profile-tab-active','About'),el(doc,'span','venue-demo-profile-tab','Badges'));
  body.append(profileTabs);
  if(isVenue){
    body.append(card(doc,'About','A welcoming room for live music and the people who make it.'),
      card(doc,'On Site','Small stage · House sound · Bar'),
      card(doc,'Open Nights','Sample Friday · Night · 9 PM – Close'));
  }else{
    body.append(card(doc,'About','An indie-folk trio with warm harmonies, guitar, bass, and a live drum kit.'));
    const genres=card(doc,'Genres'),chips=el(doc,'div','venue-demo-chips');
    for(const genre of DEMO_BOOKING.genres)chips.append(pill(doc,genre));genres.append(chips);
    body.append(genres,card(doc,'Instruments','Vocals · Guitar · Bass · Drums'));
  }
  const footer=el(doc,'div','venue-demo-app-footer');
  if(!isVenue){
    const context=deriveDemoContext(state);
    if(context.inContact){footer.append(status(doc,state.done.confirmed?'Booking confirmed':'In Contact','warning'),button(doc,'Open Conversation','open-message',{iconName:'messages'}));}
    else footer.append(button(doc,'Accept Artist','accept-artist',{iconName:'check'}));
  } else footer.append(button(doc,'Back to Your Demo','return',{kind:'secondary'}));
  return [header,body,footer];
}
function chat(doc,state) {
  const header=appHeader(doc,DEMO_BOOKING.artist,deriveDemoContext(state).bookingStatus==='confirmed'?'Confirmed booking':'In Contact',{light:true,compact:true});
  header.classList.add('venue-demo-chat-header');
  header.prepend(avatar(doc));
  header.append(button(doc,'Confirm Booking','open-terms',{kind:'chat-booking',iconName:'chevron'}));
  const body=el(doc,'div','venue-demo-app-scroll venue-demo-chat-body');
  body.append(el(doc,'p','venue-demo-chat-date','Sample conversation · '+dateLabel(state)),
    el(doc,'p','venue-demo-bubble venue-demo-bubble-other','Thanks for getting in touch! We’d love to play your room.'));
  if(state.outgoingMessage){
    const outgoing=el(doc,'p','venue-demo-bubble venue-demo-bubble-self',state.outgoingMessage);
    outgoing.dataset.demoConfirmation='';body.append(outgoing,el(doc,'p','venue-demo-message-sent','Sent · Demo only'));
  }
  if(state.done.message)return [header,body];
  const footer=el(doc,'div','venue-demo-app-footer');
  const form=el(doc,'form','venue-demo-message-form');form.dataset.demoMessageForm='';
  const label=el(doc,'label','venue-demo-message-label','Message');const textarea=el(doc,'textarea','');
  const id='venue-demo-draft';label.htmlFor=id;textarea.id=id;textarea.name='demo-message';textarea.rows=2;
  textarea.dataset.demoDraft='';textarea.value=state.draft;
  textarea.setAttribute('aria-describedby','venue-demo-count venue-demo-error');
  textarea.setAttribute('aria-invalid',String(Boolean(state.error)));
  const count=el(doc,'p','venue-demo-message-count',String(state.draft.trim().length)+' / 500');count.id='venue-demo-count';
  const error=el(doc,'p','venue-demo-error',state.error);error.id='venue-demo-error';error.hidden=!state.error;
  const send=button(doc,'Send Message','send-message',{iconName:'send'});send.type='submit';
  const compose=el(doc,'div','venue-demo-compose-row');
  send.classList.add('venue-demo-send-icon');send.setAttribute('aria-label','Send Message');
  compose.append(textarea,send);form.append(label,compose,count,error);
  footer.append(form);
  return [header,body,footer];
}
function booking(doc,state,mode='terms') {
  const header=appHeader(doc,mode==='confirmed'?'Confirmed Booking':'Booking Terms',mode==='terms'?'Ready to send':mode==='awaiting'?'Awaiting musician review':'Your agreed show details',{back:true,compact:true,light:mode==='confirmed'});
  const body=el(doc,'div','venue-demo-app-scroll');
  const identity=el(doc,'div','venue-demo-booking-identity'),copy=el(doc,'div','');
  copy.append(el(doc,'h3','',DEMO_BOOKING.artist),el(doc,'p','venue-demo-muted',dateLabel(state,true)+' · Sample date'));
  identity.append(avatar(doc),copy);body.append(identity);
  if(mode==='awaiting')body.append(status(doc,'Terms sent · awaiting artist review','warning'));
  if(mode==='confirmed')body.append(status(doc,'Confirmed','warning'),el(doc,'p','venue-demo-eyebrow','WHAT YOU AGREED TO PAY'));
  body.append(terms(doc,state));
  const footer=el(doc,'div','venue-demo-app-footer');
  if(mode==='terms')footer.append(button(doc,'Send to Musician','send-terms',{iconName:'send'}));
  if(mode==='confirmed')footer.append(button(doc,'Message','open-message',{kind:'secondary',iconName:'messages'}));
  return [header,body,footer];
}
const screenBuilders={
  dashboard,calendar,'day-sheet':daySheet,'time-sheet':timeSheet,'night-posted':postedNight,pipeline,
  artist:(doc,state)=>profile(doc,state),chat,terms:wizard,
  awaiting:(doc,state)=>booking(doc,state,'awaiting'),confirmed:(doc,state)=>booking(doc,state,'confirmed'),
  'venue-profile':(doc,state)=>profile(doc,state,true),
};
export function renderVenueDemo(root,state,{doc,focusScreen=false}={}) {
  doc=doc||root.ownerDocument;
  const builder=screenBuilders[state.screen];if(!builder)throw Error('Unknown demo screen');
  const app=root.querySelector('[data-demo-app]');if(!app)throw Error('Missing demo frame');
  const screen=el(doc,'div','venue-demo-app-screen');screen.dataset.demoActiveScreen=state.screen;
  screen.append(...builder(doc,state));
  if(!['terms','awaiting','confirmed'].includes(state.screen))screen.append(tabs(doc,state));
  app.replaceChildren(screen);
  const heading=screen.querySelector(state.screen==='terms'?'.venue-demo-wizard-title':'h2'),confirmation=screen.querySelector('[data-demo-confirmation]');
  if(heading)heading.tabIndex=-1;
  const guide=getDemoGuidance(state),finished=state.screen==='confirmed';
  root.dataset.started=String(state.started);root.dataset.complete=String(finished);
  root.querySelector('[data-demo-instruction]').textContent=guide.instruction;
  root.querySelector('[data-demo-guide-title]').textContent=guide.title;
  root.querySelector('[data-demo-step-count]').textContent=!state.started?'A Guided Walkthrough':
    finished?'Booking Complete':'Step '+(state.chapter+1)+' of 4';
  const feedback=root.querySelector('[data-demo-feedback]');feedback.hidden=!guide.feedback;
  feedback.textContent=guide.feedback?'✓ '+guide.feedback:'';
  const completedKeys=['openDate','reviewArtist','message','confirmed'];
  for(const chapter of root.querySelectorAll('[data-chapter]')){
    const index=Number(chapter.dataset.chapter),done=state.done[completedKeys[index]];
    const label=chapter.querySelector('[data-demo-chapter-label]')?.textContent||CHAPTERS[index];
    chapter.setAttribute('aria-label',label+(done?' · completed':'')+(state.chapter===index?' · current':''));
    chapter.dataset.completed=String(done);
    if(state.chapter===index)chapter.setAttribute('aria-current','step');else chapter.removeAttribute('aria-current');
  }
  root.querySelector('[data-demo-action="previous"]').disabled=!state.started||(state.screen==='dashboard'&&!state.done.openDate);
  root.querySelector('[data-demo-action="restart"]').hidden=!state.started;
  root.querySelector('[data-demo-action="start"]').hidden=state.started;
  root.querySelector('[data-demo-signup]').hidden=!finished;
  root.querySelector('[data-demo-simulate]').hidden=state.screen!=='awaiting';
  root.querySelector('[data-demo-simulation-note]').hidden=state.screen!=='awaiting';
  for(const node of root.querySelectorAll('[data-guide-target]'))node.removeAttribute('data-guide-target');
  const candidates=guide.target?root.querySelectorAll('[data-demo-action="'+guide.target+'"]'):[];
  const target=candidates[candidates.length-1]||null;
  for(const node of screen.querySelectorAll('[data-demo-action]')){
    const permitted=node===target||node.dataset.demoAction==='return'||
      (state.screen==='terms'&&['set-term','edit-term'].includes(node.dataset.demoAction));
    node.disabled=!state.started||!permitted||
      (state.screen==='terms'&&['next-terms','send-terms'].includes(node.dataset.demoAction)&&
        !validDemoTermsStep(state.wizardStep,state.terms));
  }
  if(state.screen==='terms')for(const field of screen.querySelectorAll('[data-demo-field]'))
    field.disabled=!state.started;
  if(target){target.dataset.guideTarget='';target.setAttribute('aria-describedby','venue-demo-instruction');}
  if(focusScreen)heading.focus({preventScroll:true});
  return {screen,heading,confirmation,target,guide};
}
const controllers=new WeakMap();
const simpleActions={
  start:'START',previous:'BACK',next:'NEXT',restart:'RESTART','open-calendar':'OPEN_CALENDAR',
  'open-date':'OPEN_DATE_SHEET','select-night':'SELECT_NIGHT','confirm-date':'CONFIRM_DATE',
  'open-pipeline':'OPEN_PIPELINE','open-artist':'OPEN_ARTIST','accept-artist':'ACCEPT_ARTIST',
  'open-message':'OPEN_MESSAGE','open-terms':'OPEN_TERMS','send-terms':'SEND_TERMS',
  'next-terms':'NEXT_TERMS',
  'simulate-acceptance':'SIMULATE_ACCEPTANCE',return:'RETURN','tab-dashboard':'TAB_DASHBOARD',
  'tab-calendar':'TAB_CALENDAR','tab-messages':'TAB_MESSAGES','tab-profile':'TAB_PROFILE',
};
export function decodeDemoAction(button) {
  if(!button||button.disabled)return null;
  const {demoAction,chapter,stage,dateKey}=button.dataset||{};
  if(demoAction==='edit-term'){
    const step=Number(button.dataset?.step);
    return Number.isInteger(step)&&step>=1&&step<=6?{type:'EDIT_TERM',step}:null;
  }
  if(demoAction==='chapter')return /^[0-3]$/.test(chapter||'')?{type:'GOTO_CHAPTER',index:Number(chapter)}:null;
  if(demoAction==='filter-stage')return ['interested','in-contact','confirmed'].includes(stage)?{type:'PIPELINE_FILTER',stage}:null;
  if(demoAction==='select-day')return /^\d{4}-\d{2}-\d{2}$/.test(dateKey||'')?{type:'SELECT_DAY',dateKey}:null;
  if(demoAction==='set-term'){
    const {field,value}=button.dataset||{};
    return ['payStructure','paymentMethod','paymentApp','responsibleParty','paymentTiming'].includes(field)&&
      typeof value==='string'?{type:'SET_TERM',field,value}:null;
  }
  return simpleActions[demoAction]?{type:simpleActions[demoAction]}:null;
}
export function initVenueDemo(root,{doc=root?.ownerDocument,win=doc?.defaultView,now=()=>new Date(),render=renderVenueDemo}={}) {
  if(controllers.has(root))return controllers.get(root);
  const fallback=root?.querySelector('[data-demo-fallback]'),enhancement=root?.querySelector('[data-demo-enhancement]');
  const announcer=root?.querySelector('[data-demo-status]');
  let state,alive=true,animation=null,preference=null;
  function cancelMotion(){animation?.cancel();animation=null;}
  function detach(){
    root?.removeEventListener('click',onClick);
    root?.removeEventListener('submit',onSubmit);
    root?.removeEventListener('input',onInput);
    preference?.removeEventListener?.('change',onPreference);
    preference?.removeListener?.(onPreference);
    cancelMotion();controllers.delete(root);alive=false;
  }
  function recover(message='',previouslyFocused=false){
    const hadFocus=previouslyFocused||enhancement?.contains(doc?.activeElement);
    detach();
    if(enhancement)enhancement.hidden=true;
    if(fallback)fallback.hidden=false;
    if(announcer)announcer.textContent=message;
    if(hadFocus){
      const heading=fallback?.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    }
  }
  function onPreference(){if(preference?.matches)cancelMotion();}
  function animate(result,backwards,confirmation=false){
    cancelMotion();
    const node=confirmation?result.confirmation:result.screen;
    if(preference?.matches||!node||typeof node.animate!=='function')return;
    try {
      const start=confirmation?{opacity:0}:{opacity:0,transform:'translateX('+(backwards?-12:12)+'px)'};
      animation=node.animate([start,{opacity:1,transform:'translateX(0)'}],
        {duration:confirmation?150:220,easing:'cubic-bezier(.22,1,.36,1)'});
      animation.finished?.catch(()=>{});
    }catch{animation=null;}
  }
  function updateDraft(){
    const field=root.querySelector('[data-demo-draft]'),error=root.querySelector('#venue-demo-error');
    const count=root.querySelector('#venue-demo-count');
    if(count)count.textContent=String(state.draft.trim().length)+' / 500';
    if(error){error.textContent=state.error;error.hidden=!state.error;}
    if(field)field.setAttribute('aria-invalid',String(Boolean(state.error)));
  }
  function updateTermField(){
    const valid=validDemoTermsStep(state.wizardStep,state.terms);
    const next=root.querySelector('[data-demo-action="next-terms"], [data-demo-action="send-terms"]');
    if(next)next.disabled=!valid;
  }
  function dispatch(action) {
    if(!alive)return;
    if(action.type==='RESTART')action={...action,now:now()};
    const previous=state,next=reduceGuidedDemoState(state,action);
    if(next===state)return;
    state=next;
    const active=doc?.activeElement;
    if(action.type==='SET_DRAFT'){updateDraft();return;}
    if(action.type==='SET_TERM'&&active?.matches?.('[data-demo-field]')){updateTermField();return;}
    const inside=enhancement.contains(active);
    const completion=['ACCEPT_ARTIST','SEND_MESSAGE','SEND_TERMS','SIMULATE_ACCEPTANCE','CONFIRM_DATE'].includes(action.type);
    const navigating=!completion&&(previous.screen!==state.screen||previous.chapter!==state.chapter||previous.wizardStep!==state.wizardStep||
      ['RETURN','RESTART','START'].includes(action.type));
    try{
      cancelMotion();
      const result=render(root,state,{doc,focusScreen:navigating});
      if(inside&&action.type==='RESTART')result.target?.focus();
      if(action.type==='SET_TERM'&&inside){
        const chosen=result.screen.querySelector('[data-demo-action="set-term"][data-field="'+action.field+'"][data-value="'+action.value+'"]');
        chosen?.focus({preventScroll:true});
      }
      if(state.error){
        const field=root.querySelector('[data-demo-draft]');field?.focus({preventScroll:true});
        announcer.textContent=state.error;return;
      }
      if(completion){
        const success={ACCEPT_ARTIST:'Artist is now In Contact. Open the conversation when you’re ready.',
          SEND_MESSAGE:'Sample message sent.',SEND_TERMS:'Terms sent. Awaiting the artist’s response.',
          SIMULATE_ACCEPTANCE:'Simulated artist acceptance. Booking confirmed.',
          CONFIRM_DATE:'Sample night opened for music.'};
        announcer.textContent=success[action.type];
        if(inside){
          const target=result.target||root.querySelector('[data-demo-signup]:not([hidden])')||result.heading;
          target?.focus({preventScroll:true});
        }
        animate(result,false,Boolean(result.confirmation));
      }else{
        if(inside&&action.type==='SELECT_NIGHT')result.target?.focus({preventScroll:true});
        announcer.textContent=result.guide.title+'. '+result.guide.instruction;
        if(previous.screen!==state.screen||previous.wizardStep!==state.wizardStep)animate(result,action.type==='BACK'||action.type==='RETURN');
      }
    }catch{recover('The interactive demo could not load. You can still explore the steps below or join early access.',inside);}
  }
  function onClick(event){
    const node=event.target?.closest?.('[data-demo-action]');
    if(!node||!root.contains(node))return;
    const action=decodeDemoAction(node);
    if(action){event.preventDefault();dispatch(action);}
  }
  function onSubmit(event){
    const form=event.target?.closest?.('[data-demo-message-form]');
    if(form&&root.contains(form)){event.preventDefault();dispatch({type:'SEND_MESSAGE'});}
  }
  function onInput(event){
    if(event.target?.matches?.('[data-demo-draft]'))dispatch({type:'SET_DRAFT',value:event.target.value});
    if(event.target?.matches?.('[data-demo-field]'))dispatch({type:'SET_TERM',field:event.target.dataset.demoField,value:event.target.value});
  }
  const controller={
    getState:()=>({...state,terms:{...state.terms},done:{...state.done},origin:state.origin?{...state.origin}:null}),
    dispatch,destroy:()=>recover(),
  };
  try {
    if(!fallback||!enhancement||!announcer||!root.querySelector('[data-demo-app]'))throw Error('Missing shell');
    state=createGuidedDemoState(now());
    preference=win?.matchMedia?.('(prefers-reduced-motion: reduce)')||null;
    render(root,state,{doc,focusScreen:false});
    root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);root.addEventListener('input',onInput);
    if(preference?.addEventListener)preference.addEventListener('change',onPreference);
    else preference?.addListener?.(onPreference);
    fallback.hidden=true;enhancement.hidden=false;
    controllers.set(root,controller);return controller;
  }catch{
    recover('The interactive demo could not load. You can still explore the steps below or join early access.');
    return null;
  }
}
if(typeof document!=='undefined')for(const root of document.querySelectorAll('[data-venue-demo]'))initVenueDemo(root);
