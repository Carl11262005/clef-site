import {createGoogleSignup} from './signup-flow.mjs?v=20261108-role-tracking';
import {createSignupState, isExpandedKitSchema, ROLE_TAGS} from './signup-wizard.mjs?v=20261108-role-tracking';

const root=document.getElementById('earlyAccess'), googleButton=document.getElementById('googleSignup'), status=document.getElementById('signupStatus'), kitContainer=document.getElementById('kitSignup'), fallback=document.getElementById('signupFallback');
const wizard=root?.querySelector('.signup-wizard'), finalPanel=root?.querySelector('[data-signup-final]'), progress=root?.querySelector('[data-signup-progress]'), locationInput=root?.querySelector('[data-signup-location]'), fieldError=root?.querySelector('[data-signup-error]'), finalBack=root?.querySelector('.signup-back-final');
const flowHeader=root?.querySelector('[data-signup-header]'), summary=root?.querySelector('[data-signup-summary]'), finalTitle=root?.querySelector('[data-signup-final-title]');
const roleLabels={venue:'Venue / Booking Manager',musician:'Musician',band:'Band'};
let stepTransition;
const state=createSignupState({role:root?.dataset.pageRole||null});
let enhanced=false, authReady=false, googleBusy=false, emailBusy=false, allowGoogleSubmission=false, subscribed=false, emailTimer;
const notify=message=>{if(status)status.textContent=message;};
const kitForm=()=>kitContainer?.querySelector('form[data-uid="c338b66b93"]');
const emailField=()=>kitForm()?.querySelector('input[name="email_address"],input[type="email"]');
const kitSucceeded=()=>Boolean(kitContainer?.querySelector('.formkit-alert-success')?.textContent.trim());
const normalize=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const roleFromLabel=value=>Object.keys(ROLE_TAGS).find(role=>[role,normalize(ROLE_TAGS[role]),...(role==='venue'?['venue booking manager']:[])].includes(normalize(value)))||null;
const optionRole=option=>roleFromLabel(option.textContent)||roleFromLabel(option.value);
const controlRole=control=>roleFromLabel(choiceLabel(kitForm(),control))||roleFromLabel(control.value);

function kitMetadataControls(){
  const form=kitForm(); if(!form)return null;
  const controls=[...form.querySelectorAll('input,select,textarea')].filter(control=>control!==emailField());
  const location=controls.find(control=>/city|state|region|location/.test(normalize(`${control.name} ${control.id} ${control.placeholder} ${control.getAttribute('aria-label')}`)));
  const roleSelect=controls.find(control=>control.tagName==='SELECT'&&!control.multiple&&[...control.options].some(optionRole));
  const roleChoices=controls.filter(control=>['radio','checkbox'].includes(control.type)).filter(controlRole);
  const roleTags=(roleSelect?[...roleSelect.options].map(optionRole):roleChoices.map(controlRole)).filter(Boolean).map(role=>ROLE_TAGS[role]);
  const required=control=>Boolean(control?.required||control?.getAttribute('aria-required')==='true'||control?.closest('[aria-required="true"]'));
  const schema={locationRequired:required(location),roleRequired:roleSelect?required(roleSelect):roleChoices.some(required),roleTags};
  return location&&(roleSelect||roleChoices.length)&&isExpandedKitSchema(schema)?{location,roleSelect,roleChoices}:null;
}
function choiceLabel(form,control){return form.querySelector(`label[for="${CSS.escape(control.id||'')}"]`)?.textContent||control.closest('label')?.textContent||'';}
function dispatchValue(control,value){control.disabled=false;control.value=value;control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));}
function syncKit(details=state.details()){
  if(!details)return false; const controls=kitMetadataControls(); if(!controls)return !enhanced;
  dispatchValue(controls.location,details.location);
  if(controls.roleSelect){const option=[...controls.roleSelect.options].find(item=>optionRole(item)===details.role);if(!option)return false;dispatchValue(controls.roleSelect,option.value);return true;}
  let matched=false; controls.roleChoices.forEach(control=>{const selected=controlRole(control)===details.role;control.checked=selected;control.dispatchEvent(new Event('change',{bubbles:true}));if(selected)matched=true;});return matched;
}
function renderWizard(focus=false){
  if(!enhanced||subscribed)return; const snapshot=state.snapshot(); progress.textContent=`Step ${snapshot.step} of 3`;
  root.dataset.signupStage=String(snapshot.step); if(flowHeader)flowHeader.hidden=false;
  root.querySelectorAll('[data-signup-marker]').forEach(marker=>{const step=Number(marker.dataset.signupMarker);marker.dataset.state=step<snapshot.step?'complete':step===snapshot.step?'current':'upcoming';});
  wizard.querySelectorAll('[data-signup-step]').forEach(panel=>{panel.hidden=Number(panel.dataset.signupStep)!==snapshot.step;});
  wizard.hidden=snapshot.step===3; finalPanel.hidden=snapshot.step!==3; finalBack.hidden=snapshot.step!==3;
  root.querySelectorAll('[data-signup-role]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.signupRole===snapshot.role)));
  if(finalTitle)finalTitle.textContent='You’re Almost In.';
  if(summary){summary.hidden=snapshot.step!==3;summary.querySelector('[data-signup-summary-role]').textContent=roleLabels[snapshot.role]||'';summary.querySelector('[data-signup-summary-location]').textContent=snapshot.location;}
  stepTransition?.cancel();
  const panel=snapshot.step===3?finalPanel:wizard.querySelector(`[data-signup-step="${snapshot.step}"]`);
  if(focus&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&panel.animate)stepTransition=panel.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.22,1,.36,1)'});
  if(focus)(snapshot.step===1?root.querySelector(`[data-signup-role="${snapshot.role||'venue'}"]`):snapshot.step===2?locationInput:emailField()||finalTitle)?.focus({preventScroll:true});
}
function activateWizard(){
  const controls=kitMetadataControls(); if(enhanced||!controls||!wizard)return;
  enhanced=true;root.dataset.signupEnhanced='true';
  [controls.location,controls.roleSelect,...controls.roleChoices].filter(Boolean).forEach(control=>{
    const field=control.closest('[group="field"],.formkit-field,.formkit-fieldset')||control.closest('[data-element]')||control;
    field.dataset.clefMetadata='true';field.setAttribute('aria-hidden','true');control.tabIndex=-1;
  });
  wizard.hidden=false;renderWizard();
}
root?.querySelectorAll('[data-signup-role]').forEach(button=>button.addEventListener('click',()=>{if(googleBusy||emailBusy||subscribed)return;fieldError.textContent='';state.selectRole(button.dataset.signupRole);renderWizard(true);}));
root?.querySelector('[data-signup-continue]')?.addEventListener('click',()=>{if(googleBusy||emailBusy||subscribed)return;const result=state.continueWithLocation(locationInput.value);fieldError.textContent=result.message;locationInput.setAttribute('aria-invalid',String(!result.ok));if(result.ok){locationInput.value=state.snapshot().location;syncKit();renderWizard(true);}});
locationInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();root.querySelector('[data-signup-continue]').click();}});
root?.querySelectorAll('[data-signup-back]').forEach(button=>button.addEventListener('click',()=>{if(googleBusy||emailBusy||subscribed)return;state.back();fieldError.textContent='';locationInput.removeAttribute('aria-invalid');renderWizard(true);}));
root?.querySelector('[data-signup-edit]')?.addEventListener('click',()=>{if(googleBusy||emailBusy||subscribed)return;state.goTo(1);renderWizard(true);});

function updateControls(){
  const input=emailField(), formReady=Boolean(input); if(input){input.type='email';input.autocomplete='email';input.setAttribute('aria-label','Email address');}
  activateWizard(); if(kitSucceeded()){subscribed=true;state.markSubscribed();} fallback.hidden=formReady||subscribed; googleButton.disabled=!authReady||!formReady||googleBusy||emailBusy||subscribed;
  const busy=googleBusy||emailBusy;
  root.querySelectorAll('[data-signup-role],[data-signup-back],[data-signup-continue],[data-signup-edit]').forEach(button=>{button.disabled=busy||subscribed;});
  if(locationInput)locationInput.readOnly=busy;
  if(subscribed){
    root.dataset.signupComplete='true';stepTransition?.cancel();googleButton.hidden=true;root.querySelector('.signup-divider').hidden=true;
    if(enhanced){wizard.hidden=true;finalPanel.hidden=false;finalBack.hidden=true;if(flowHeader)flowHeader.hidden=true;if(summary)summary.hidden=true;if(finalTitle)finalTitle.parentElement.hidden=true;}
  }
}
new MutationObserver(updateControls).observe(kitContainer,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});updateControls();
kitContainer.addEventListener('submit',event=>{
  if(subscribed||emailBusy||(googleBusy&&!allowGoogleSubmission)){event.preventDefault();event.stopImmediatePropagation();return;}
  if(enhanced&&(!state.details()||!syncKit())){event.preventDefault();event.stopImmediatePropagation();notify('Choose your role and location before joining.');return;}
  emailBusy=true;clearTimeout(emailTimer);emailTimer=setTimeout(()=>{if(emailBusy&&!googleBusy)notify('We could not confirm your signup yet. Check your inbox, then reload this page if you need to try again.');},30000);notify('Sending your signup…');updateControls();
},true);
new MutationObserver(()=>{if(kitSucceeded()||kitContainer.querySelector('.formkit-alert-error li')){clearTimeout(emailTimer);emailBusy=false;if(!googleBusy)notify('');updateControls();}}).observe(kitContainer,{childList:true,subtree:true});

function subscribeGoogleProfile({email,role,location}){return new Promise((resolve,reject)=>{
  const form=kitForm(),input=emailField();if(!form||!input){reject(new Error('The signup form is unavailable. Please reload and try email signup.'));return;}if(enhanced&&!syncKit({role,location})){reject(new Error('Your role and location could not be added. Please use the form below.'));return;}
  let timer;const observer=new MutationObserver(()=>{if(kitSucceeded())finish();else{const error=form.querySelector('.formkit-alert-error li');if(error?.textContent.trim())finish(new Error(error.textContent.trim()));}});
  function finish(error){clearTimeout(timer);observer.disconnect();input.readOnly=false;emailBusy=false;error?reject(error):resolve();}
  dispatchValue(input,email);input.readOnly=true;form.querySelector('[type="submit"],[data-element="submit"]').disabled=false;observer.observe(kitContainer,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});timer=setTimeout(()=>finish(new Error('We could not confirm your signup yet. Check your inbox before trying again.')),30000);allowGoogleSubmission=true;try{form.requestSubmit();}catch{finish(new Error('Signup could not be sent. Please try email signup below.'));}finally{allowGoogleSubmission=false;}
});}

try{
  const [appSDK,authSDK]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js')]);
  const app=appSDK.initializeApp({apiKey:'AIzaSyC-5t-8XfkRnz-05iueLgrSQoLV4gf6ivU',authDomain:'clef-app.firebaseapp.com',projectId:'clef-app',appId:'1:71968821553:web:351c66465bcef780372010'},'clef-website-early-access');
  const auth=authSDK.initializeAuth(app,{persistence:authSDK.inMemoryPersistence,popupRedirectResolver:authSDK.browserPopupRedirectResolver}),provider=new authSDK.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  googleButton.addEventListener('click',createGoogleSignup({authenticate:async()=>(await authSDK.signInWithPopup(auth,provider)).user,subscribe:subscribeGoogleProfile,getSignupDetails:()=>enhanced?state.details():{},notify,setBusy(value){googleBusy=value;const input=emailField();if(input){input.disabled=value;if(!value)input.readOnly=false;}updateControls();}}));authReady=true;updateControls();
}catch{notify('Google sign-in could not load. You can still join using your email below.');}
