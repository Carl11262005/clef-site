import React from 'react';

// Verified against CLEF's live Early Access navigation and signup form.
// A plain external link keeps signup optional and preserves this demo tab.
export default function EarlyAccessLink({primary=false}:{primary?:boolean}) {
 return <a className={primary?'early-access-primary':'early-access-link'} href="https://clefapp.net/#signup" target="_blank" rel="noopener noreferrer" aria-label="Get early access (opens in a new tab)">Get early access <span aria-hidden="true">↗</span></a>;
}
