import React from 'react';
const deny=async()=>({error:{message:'Not available in this demo'}});
export default function Unavailable(){return null;}
export const StripeProvider=({children}:{children:React.ReactNode})=><>{children}</>;
export const useStripe=()=>({initPaymentSheet:deny,presentPaymentSheet:deny});
export const usePaymentSheet=useStripe;
export const useIdentityVerificationSheet=()=>({present:deny,status:'NotStarted'});
export const GoogleSignin={configure:()=>{},signOut:deny,signIn:deny,hasPlayServices:deny};
export const statusCodes={SIGN_IN_CANCELLED:'CANCELLED'};
export const isSuccessResponse=()=>false;
