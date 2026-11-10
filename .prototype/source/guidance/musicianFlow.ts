import {create} from 'zustand';
export function nextMusicianStageAfterMessage(stage:number,message:string):number{
 if(!message.trim())return stage;
 if(stage===2)return 3;
 if(stage===3)return 4;
 return stage;
}

export function musicianVenueReplyAfterMessage(stage:number):string|null{
 if(stage===2)return 'Great. We can offer $300 for the set, paid after you play. Does that work?';
 if(stage===3)return 'Perfect. I sent the booking terms for you to review.';
 return null;
}

export function musicianQuickReplies(stage:number):string[]{
 if(stage===2)return ['9 to 11 works for us.','Yes, that set time works.'];
 if(stage===3)return ['$300 after the set works.','Sounds good — send the terms.'];
 return [];
}

export const useVenueJourney=create<{messages:number;termsSent:boolean;wizardStep:number}>(()=>({messages:0,termsSent:false,wizardStep:0}));
export const resetVenueJourney=()=>useVenueJourney.setState({messages:0,termsSent:false,wizardStep:0});
export function venueQuickReplies(messages:number):string[]{
 if(messages===0)return ['Would 7–10 PM work for your set?'];
 if(messages===1)return ['We can offer $300, paid after the set.'];
 return [];
}
export function venueArtistReply(messages:number):string{
 return messages===0?'Yes, 7–10 PM works for us. What are the pay details?':'$300 after the set works. Please send the booking terms for us to review.';
}

export const venueTermsGuidance=[
 ['Confirm your booking terms','Tap Confirm Booking to review and send sample terms.'],
 ['Choose the pay structure','Select Flat Payout for this sample gig, then Continue.'],
 ['Enter the agreed amount','Enter 300 for the sample payout, then Continue.'],
 ['Choose a payment method','Choose how the venue will pay the artist, then Continue. CLEF does not process payments.'],
 ['Choose who pays','Choose the venue contact responsible for paying, then Continue.'],
 ['Choose payment timing','Choose After the Set to match the sample conversation, then Continue.'],
 ['Review the set time','Check the date and times from the application, then Continue.'],
 ['Review and send your terms','Check the summary, then tap Send to musician to finish the demo. Nothing is sent to a real artist.']
];
