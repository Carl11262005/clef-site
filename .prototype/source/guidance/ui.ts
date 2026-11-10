import { emptySignals, type GuideSignals } from './model';

// Match fixed UI labels into boolean hints. No input values are read, and no
// screen text is stored or transmitted. These
// browser-only hints let tips follow existing sheets without editing app screens.
export function appTextElements():HTMLElement[] {
 return Array.from(document.querySelectorAll<HTMLElement>('div, span, button, h1, h2, p'))
  .filter(element=>element.childElementCount===0&&!element.closest('.conference-chrome, .conference-guide-announcement, [aria-hidden="true"], [data-state="inactive"]')&&element.getClientRects().length>0);
}
export function readGuideSignals():GuideSignals {
 const labels=new Set(appTextElements().map(element=>element.textContent?.trim()));
 return {
  ...emptySignals,
  venueSelected:labels.has('View full profile'),
  dateSetup:labels.has('When do you want live music?'),
  availability:labels.has('Manage availability for this date on your calendar'),
  timePicker:labels.has('Choose a time segment for this date'),
  timeChosen:labels.has('Confirm'),
  acceptCompose:labels.has('Here’s a starter — edit it however you like.'),
  acceptSent:labels.has('Message sent!'),
  bookingTerms:labels.has('Booking Terms'),
 };
}
