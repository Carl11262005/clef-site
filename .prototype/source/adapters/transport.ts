// The real API modules and demo seams run unchanged. Axios is replaced at BUILD
// time with this local-only transport; it has no HTTP client or network fallback.
import { useClefStore } from '@/Store';
import { AccountType } from '@/models/AccountTypeModel';
import { DEMO_ACT_PROFILE, DEMO_IDENTITY, demoShowDateKey } from '@/components/demo/demoFixtures';
import { demoTimeSlots } from '@/components/demo/musicianDemoFixtures';
export const VENUE_UID='demo-venue-lamplighter';
export const venueProfile=()=>({uid:VENUE_UID,name:DEMO_IDENTITY.venueName,venueName:DEMO_IDENTITY.venueName,accountType:AccountType.Venue,activeRole:AccountType.Venue,roles:[AccountType.Venue],location:DEMO_IDENTITY.venueLocation,address:DEMO_IDENTITY.venueLocation,latitude:40.4406,longitude:-79.9959,locationVerified:true,capacity:120,venueCapacity:120,genresBooked:[...DEMO_IDENTITY.actGenres],genres:[...DEMO_IDENTITY.actGenres],equipment:['PA','Stage'],bio:'An independent listening room for live local music.',subscriptionActive:true,ageVerified:true});
const read=(endpoint:string,body:Record<string,unknown>={})=>{
 switch(endpoint){
  case 'getDiscoverVenues': return {venues:[{...venueProfile(),tagline:DEMO_IDENTITY.venueLocation,photoURL:null,initials:'LR',openDates:[demoShowDateKey()],rating:0,reviews:0}],nextCursor:null};
  case 'getDiscoverMusicians': return {musicians:[]};
  case 'getUser': return body.uid===VENUE_UID ? venueProfile() : body.uid===DEMO_ACT_PROFILE.uid ? {...DEMO_ACT_PROFILE} : useClefStore.getState().user;
  case 'getCurrentUser': return useClefStore.getState().user;
  case 'getMusicianGigs': return {uid:body.uid,activeGigs:[],inactiveGigs:[]};
  case 'getDealTerms': return {deals:[]};
  case 'getAvailability': return {success:true,uid:body.uid,days:body.uid===VENUE_UID?[{date:demoShowDateKey(),available:true,segments:['evening']}]:[]};
  case 'getVenueOpenNights': return {dates:[demoShowDateKey()]};
  case 'getVenueOpenTimeSlots': return {slots:demoTimeSlots()};
  case 'getConversations': return {conversations:[]};
  case 'getConversationMessages': return {messages:[]};
  case 'getUserRatings': return {ratings:[],summary:{count:0,average:0}};
  case 'getProfilePastGigs': return {gigs:[],pastGigs:[]};
  case 'getFeedbackNeeded': return {listings:[],ratings:[]};
  case 'getManagedAccounts': return {accounts:[]};
  case 'getVenueNightApplications': return {success:true,applications:[]};
  case 'getConfirmedBookings': return {bookings:[]};
  default: throw new Error(`Conference demo blocked unsupported action: ${endpoint}`);
 }
};
async function request(url:string,body?:Record<string,unknown>){
 const endpoint=url.split('/').filter(Boolean).pop() ?? '';
 return {data:read(endpoint,body),status:200,config:{url,data:body}};
}
export const isAxiosError=()=>false;
export class AxiosError extends Error{}
const transport={get:(url:string,options?:{params?:Record<string,unknown>})=>request(url,options?.params),post:request,put:request,patch:request,delete:request,isAxiosError,interceptors:{request:{use:()=>{}},response:{use:()=>{}}}};
export default transport;
