export const CHAPTERS = Object.freeze(['Open Date', 'Review Artist', 'Message', 'Booking']);
export const DEMO_BOOKING = Object.freeze({
  venue:'The Lamplighter Room', artist:'The Copper Hollow', initials:'CH',
  bandSize:3, genres:Object.freeze(['Indie','Folk','Americana']),
  segment:'Night', slotStart:'21:00', slotEnd:'close', pay:300,
  loadIn:'19:00', setStart:'21:00', setEnd:'23:00',
  paymentMethod:'Cash', paymentApp:'', whoPays:'Booking Manager', paymentTiming:'End of Night',
});
export const TERM_OPTIONS = Object.freeze({
  payStructure:Object.freeze({flat:'Flat Payout',door:'Share of Ticket Sales',guarantee_plus:'Guarantee + Ticket Share',tips:'Tips Only'}),
  paymentMethod:Object.freeze({cash:'Cash',electronic:'Electronic',check:'Check'}),
  paymentApp:Object.freeze({venmo:'Venmo',cashapp:'Cash App',zelle:'Zelle',paypal:'PayPal',applepay:'Apple Pay',other:'Other'}),
  responsibleParty:Object.freeze({booking_manager:'Booking Manager',bar_manager:'Bar Manager',owner:'Owner',other:'Other'}),
  paymentTiming:Object.freeze({sound_check:'At Soundcheck',after_set:'After the Set',end_of_night:'End of Night',within_3_days:'Within 3 Days',within_7_days:'Within 7 Days'}),
});
const initialTerms=()=>({payStructure:'flat',flatAmount:'300',doorPercentage:'',doorDeductions:'',
  paymentMethod:'cash',paymentApp:'',responsibleParty:'booking_manager',responsiblePartyOther:'',
  paymentTiming:'end_of_night',loadInTime:'19:00',setStart:'21:00',setEnd:'23:00'});
const validClock=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const clockLabel=value=>{
  if(!validClock(value))return 'Not set';
  const [hour,minute]=value.split(':').map(Number);
  return String(hour%12||12)+':'+String(minute).padStart(2,'0')+' '+(hour<12?'AM':'PM');
};
export function validDemoTermsStep(step,terms){
  if(!terms)return false;
  if(step===1)return Object.hasOwn(TERM_OPTIONS.payStructure,terms.payStructure);
  if(step===2){
    if(!validDemoTermsStep(1,terms))return false;
    if(terms.payStructure==='tips')return true;
    const flat=Number(terms.flatAmount),door=Number(terms.doorPercentage);
    if(['flat','guarantee_plus'].includes(terms.payStructure)&&!(Number.isFinite(flat)&&flat>0))return false;
    if(['door','guarantee_plus'].includes(terms.payStructure)&&!(Number.isFinite(door)&&door>0&&door<=100))return false;
    return true;
  }
  if(step===3)return Object.hasOwn(TERM_OPTIONS.paymentMethod,terms.paymentMethod)&&
    (terms.paymentMethod!=='electronic'||Object.hasOwn(TERM_OPTIONS.paymentApp,terms.paymentApp));
  if(step===4)return Object.hasOwn(TERM_OPTIONS.responsibleParty,terms.responsibleParty)&&
    (terms.responsibleParty!=='other'||Boolean(terms.responsiblePartyOther.trim()));
  if(step===5)return Object.hasOwn(TERM_OPTIONS.paymentTiming,terms.paymentTiming);
  if(step===6)return validClock(terms.setStart)&&validClock(terms.setEnd)&&terms.setStart!==terms.setEnd&&
    (!terms.loadInTime||validClock(terms.loadInTime));
  if(step===7)return [1,2,3,4,5,6].every(number=>validDemoTermsStep(number,terms));
  return false;
}
export function summarizeDemoTerms(terms){
  const pay=terms.payStructure==='flat'?'$'+terms.flatAmount+' flat payout':
    terms.payStructure==='door'?terms.doorPercentage+'% of ticket sales':
    terms.payStructure==='guarantee_plus'?'$'+terms.flatAmount+' guarantee + '+terms.doorPercentage+'% of ticket sales':'Tips only';
  return {
    pay,payStructure:TERM_OPTIONS.payStructure[terms.payStructure]||'—',
    amount:terms.payStructure==='tips'?'No guarantee':pay,
    method:(TERM_OPTIONS.paymentMethod[terms.paymentMethod]||'—')+
      (terms.paymentMethod==='electronic'&&terms.paymentApp?' · '+TERM_OPTIONS.paymentApp[terms.paymentApp]:''),
    payer:terms.responsibleParty==='other'?terms.responsiblePartyOther:TERM_OPTIONS.responsibleParty[terms.responsibleParty]||'—',
    timing:TERM_OPTIONS.paymentTiming[terms.paymentTiming]||'—',
    loadIn:terms.loadInTime?clockLabel(terms.loadInTime):'Not set',
    setTime:clockLabel(terms.setStart)+' – '+clockLabel(terms.setEnd),
  };
}
export function nextFridayKey(now) {
  const day = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  day.setDate(day.getDate()+((5-day.getDay()+7)%7||7));
  return [day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
}
export function createDemoState(now) {
  return {dateKey:nextFridayKey(now),chapter:0,screen:'dashboard',origin:null,
    pipelineFilter:'interested',nightSelected:true,wizardStep:1,terms:initialTerms(),
    draft:'Hi The Copper Hollow! Can you arrive at 7 p.m. for load-in and soundcheck?',
    outgoingMessage:null,error:'',
    done:{openDate:false,reviewArtist:false,message:false,sendTerms:false,confirmed:false}};
}
export function deriveDemoContext({chapter,done}) {
  const downstream=done.reviewArtist||done.message||done.sendTerms||done.confirmed;
  const inContact=done.reviewArtist||chapter>=2||done.message||done.sendTerms||done.confirmed;
  return {
    posted:done.openDate||chapter>=1||downstream,
    applicantPresent:done.openDate||chapter>=1||downstream,
    inContact,
    bookingStatus:done.confirmed?'confirmed':done.sendTerms?'awaiting-musician':'draft',
    stage:done.confirmed?'confirmed':inContact?'in-contact':'interested',
  };
}
const completed = (state,key,extra={}) => ({...state,...extra,error:'',done:{...state.done,[key]:true}});
const bookingScreen = state => state.done.confirmed?'confirmed':state.done.sendTerms?'awaiting':'terms';
function chapterState(state,index) {
  const next={...state,chapter:index,origin:null,error:''};
  next.screen=index===0?(state.done.openDate?'night-posted':'dashboard'):
    index===1?'pipeline':index===2?'chat':bookingScreen(state);
  next.pipelineFilter=deriveDemoContext(next).stage;
  return next;
}
const destination = (state,chapter,screen,origin=null) => ({
  ...state,chapter,screen,origin,error:'',
});
export function reduceDemoState(state,action) {
  switch(action?.type) {
    case 'GOTO_CHAPTER':
      return Number.isInteger(action.index)&&action.index>=0&&action.index<=3?
        chapterState(state,action.index):state;
    case 'NEXT': return state.chapter<3?chapterState(state,state.chapter+1):state;
    case 'BACK': return state.chapter>0?chapterState(state,state.chapter-1):state;
    case 'OPEN_CALENDAR':
    case 'TAB_CALENDAR': return destination(state,0,'calendar');
    case 'TAB_DASHBOARD': return destination(state,0,'dashboard');
    case 'SELECT_DAY':
      if(action.dateKey!==state.dateKey) return state;
      return state.done.confirmed?destination(state,3,'confirmed',{chapter:0,screen:'calendar'}):
        destination(state,0,'day-sheet');
    case 'OPEN_DATE_SHEET': return destination(state,0,state.done.openDate?'night-posted':'time-sheet');
    case 'SELECT_NIGHT': return state.nightSelected?state:{...state,nightSelected:true};
    case 'CONFIRM_DATE':
      return state.screen==='time-sheet'&&state.nightSelected&&!state.done.openDate?
        completed(state,'openDate',{screen:'dashboard'}):state;
    case 'OPEN_PIPELINE': return chapterState(state,1);
    case 'PIPELINE_FILTER':
      return ['interested','in-contact','confirmed'].includes(action.stage)?
        {...state,pipelineFilter:action.stage}:state;
    case 'OPEN_ARTIST': return destination(state,1,'artist',{chapter:1,screen:'pipeline'});
    case 'ACCEPT_ARTIST':
      return state.done.reviewArtist?state:completed(state,'reviewArtist');
    case 'OPEN_MESSAGE':
    case 'TAB_MESSAGES': return destination(state,2,'chat');
    case 'SET_DRAFT':
      return typeof action.value==='string'&&!state.done.message?
        {...state,draft:action.value,error:''}:state;
    case 'SEND_MESSAGE': {
      if(state.done.message) return state;
      const text=state.draft.trim();
      if(!text) return {...state,error:'Enter a message before sending.'};
      if(text.length>500) return {...state,error:'Keep your message to 500 characters or fewer.'};
      return completed(state,'message',{outgoingMessage:text});
    }
    case 'OPEN_TERMS': return destination(state,3,bookingScreen(state),{chapter:2,screen:'chat'});
    case 'SET_TERM': {
      if(state.screen!=='terms'||typeof action.value!=='string'||action.value.length>100)return state;
      const stepFields={1:['payStructure'],2:['flatAmount','doorPercentage','doorDeductions'],
        3:['paymentMethod','paymentApp'],4:['responsibleParty','responsiblePartyOther'],
        5:['paymentTiming'],6:['setStart','setEnd','loadInTime']};
      if(!stepFields[state.wizardStep]?.includes(action.field))return state;
      if(TERM_OPTIONS[action.field]&&!Object.hasOwn(TERM_OPTIONS[action.field],action.value))return state;
      const terms={...state.terms,[action.field]:action.value};
      if(action.field==='payStructure'){
        if(!['flat','guarantee_plus'].includes(action.value))terms.flatAmount='';
        if(!['door','guarantee_plus'].includes(action.value))terms.doorPercentage='';
      }
      if(action.field==='paymentMethod'&&action.value!=='electronic')terms.paymentApp='';
      if(action.field==='responsibleParty'&&action.value!=='other')terms.responsiblePartyOther='';
      return {...state,terms,error:''};
    }
    case 'NEXT_TERMS':return state.screen==='terms'&&state.wizardStep<7&&
      validDemoTermsStep(state.wizardStep,state.terms)?
      {...state,wizardStep:state.wizardStep+1,error:''}:state;
    case 'EDIT_TERM':return state.screen==='terms'&&state.wizardStep===7&&
      Number.isInteger(action.step)&&action.step>=1&&action.step<=6?
      {...state,wizardStep:action.step,error:''}:state;
    case 'SEND_TERMS':
      return state.done.sendTerms||state.screen!=='terms'||state.wizardStep!==7||
        !validDemoTermsStep(7,state.terms)?state:
        completed(state,'sendTerms',{chapter:3,screen:'awaiting'});
    case 'SIMULATE_ACCEPTANCE':
      return state.done.sendTerms&&!state.done.confirmed?
        completed(state,'confirmed',{chapter:3,screen:'confirmed'}):state;
    case 'TAB_PROFILE':
      return state.screen==='venue-profile'?state:
        destination(state,state.chapter,'venue-profile',{chapter:state.chapter,screen:state.screen});
    case 'RETURN':
      if(state.origin) return destination(state,state.origin.chapter,state.origin.screen);
      if(['day-sheet','time-sheet','night-posted'].includes(state.screen)) return destination(state,0,'calendar');
      if(state.screen==='artist') return chapterState(state,1);
      if(['terms','awaiting','confirmed'].includes(state.screen)) return destination(state,2,'chat');
      return state;
    case 'RESTART':
      return action.now instanceof Date&&!Number.isNaN(action.now.getTime())?createDemoState(action.now):state;
    default:return state;
  }
}

// The public walkthrough uses the same booking model, but never seeds skipped actions.
export function createGuidedDemoState(now) {
  return {...createDemoState(now),started:false,nightSelected:false};
}
const guidance=(number,title,instruction,action,target,feedback='')=>
  ({number,total:20,title,instruction,action,target,feedback});
export function getDemoGuidance(state) {
  if(!state.started)return guidance(0,'Make Room for Your Next Show',
    'See how an open night becomes a booking. Start the sample walkthrough.','START','start');
  switch(state.screen){
    case 'dashboard':return state.done.openDate?
      guidance(6,'See Who Wants to Play',
        state.done.confirmed?'The sample show is confirmed. Tap the orange Booking Pipeline to review its status.':
          state.done.reviewArtist?'The sample band is In Contact. Tap the orange Booking Pipeline to return to their profile.':
            'A sample band is interested in your open date. Tap the orange Booking Pipeline to review them.',
        'OPEN_PIPELINE','open-pipeline',state.done.confirmed?'Sample booking confirmed':state.done.reviewArtist?'Band is In Contact':'Your night is open for music'):
      guidance(1,'Start With Your Calendar','Your calendar keeps open dates and bookings together. Tap Open Calendar to choose a night.','OPEN_CALENDAR','open-calendar');
    case 'calendar':return guidance(2,'Pick Your Night','Choose the night you want artists to apply for. Tap the highlighted sample Friday.','SELECT_DAY','select-day');
    case 'day-sheet':return guidance(3,'Make Your Stage Available','Open this date so musicians and bands can apply. Tap Open Date for Music.','OPEN_DATE_SHEET','open-date');
    case 'time-sheet':return state.nightSelected?
      guidance(5,'Open the Date','Post your available night so artists can find it. Tap Confirm to open the date.','CONFIRM_DATE','confirm-date','Night selected · 9 PM–Close'):
      guidance(4,'Choose a Time','Set when your stage is available for live music. Tap Night for this sample show.','SELECT_NIGHT','select-night');
    case 'night-posted':return guidance(6,'See Who Wants to Play','A sample band is interested in your open date. Tap View Applications to open the Booking Pipeline.','OPEN_PIPELINE','open-pipeline','Your night is open for music');
    case 'pipeline':return guidance(7,'Meet the Band','Check whether the band’s sound fits your room. Tap View Profile to meet The Copper Hollow.','OPEN_ARTIST','open-artist');
    case 'artist':return state.done.reviewArtist?
      guidance(9,'Start the Conversation','Keep the show’s conversation linked to the artist. Tap Open Conversation to discuss the details.','OPEN_MESSAGE','open-message','The band is now In Contact'):
      guidance(8,'Like the Fit?','In Contact starts a conversation, not a confirmed booking. Tap Accept Artist to move the band there.','ACCEPT_ARTIST','accept-artist');
    case 'chat':return state.done.message?
      guidance(11,'Put the Agreement Together','Your message is sent. Tap Confirm Booking to set the terms; the booking is not confirmed until the artist accepts.','OPEN_TERMS','open-terms','Your sample message is sent'):
      guidance(10,'Work Out the Details','Agree on arrival and soundcheck before show night. Edit the suggested message if you like, then tap the send arrow.','SEND_MESSAGE','send-message');
    case 'terms': {
      const titles=['How Are You Paying?','Set the Amount','Choose a Payment Method','Who Pays on the Night?','When Will They Be Paid?','Set the Show Times','Review and Send'];
      const instructions=[
        'Choose the payment structure for this show. The sample starts with a flat payout.',
        'Set what the artist will earn. You can change the sample amount before continuing.',
        'Choose how the band receives payment. Select an app if you choose Electronic.',
        'Name the person responsible for paying the band.',
        'Set when the band can expect payment.',
        'Agree on load-in and set times so everyone can plan the night.',
        'Check every detail, then send the offer for the artist to review.',
      ];
      const step=state.wizardStep;
      return guidance(11+step,titles[step-1],instructions[step-1],step===7?'SEND_TERMS':'NEXT_TERMS',step===7?'send-terms':'next-terms');
    }
    case 'awaiting':return guidance(19,'See the Other Side','Sent terms are still awaiting the artist’s acceptance. Tap See the Artist’s Response to simulate confirmation.','SIMULATE_ACCEPTANCE','simulate-acceptance','Terms sent · awaiting the artist');
    case 'confirmed':return guidance(20,'Your Show Is Confirmed','Your agreed show details stay together in one booking record. This sample booking is complete.',null,null,'Sample booking complete');
    default:throw Error('Unknown guided screen');
  }
}
export function reduceGuidedDemoState(state,action) {
  if(action?.type==='RESTART')return action.now instanceof Date&&!Number.isNaN(action.now.getTime())?
    createGuidedDemoState(action.now):state;
  if(!state.started)return action?.type==='START'?{...state,started:true}:state;
  if(action?.type==='BACK'||action?.type==='RETURN'){
    if(state.screen==='terms'&&state.wizardStep>1)return {...state,wizardStep:state.wizardStep-1,error:''};
    const parents={dashboard:state.done.openDate?[0,'calendar']:null,calendar:[0,'dashboard'],'day-sheet':[0,'calendar'],'time-sheet':[0,'day-sheet'],
      'night-posted':[0,'calendar'],pipeline:[0,'dashboard'],
      artist:[1,'pipeline'],chat:[1,'artist'],terms:[2,'chat'],awaiting:[2,'chat'],confirmed:[2,'chat']};
    const parent=parents[state.screen];if(!parent)return state;
    const next=destination(state,parent[0],parent[1]);
    return {...next,pipelineFilter:deriveDemoContext(next).stage};
  }
  if(action?.type==='SET_DRAFT')return state.screen==='chat'&&!state.done.message?
    reduceDemoState(state,action):state;
  if(action?.type==='SET_TERM')return state.screen==='terms'?reduceDemoState(state,action):state;
  if(action?.type==='EDIT_TERM')return state.screen==='terms'?reduceDemoState(state,action):state;
  if(action?.type!==getDemoGuidance(state).action)return state;
  return reduceDemoState(state,action);
}
