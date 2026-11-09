// Authentication and subscription are separate results. Never claim a signup
// succeeded until Kit has acknowledged it.
export function createGoogleSignup({ authenticate, subscribe, getSignupDetails = () => ({}), notify, setBusy }) {
  let busy = false;
  let complete = false;
  return async function signup() {
    if (busy || complete) return;
    busy = true;
    setBusy(true);
    try {
      const details = getSignupDetails();
      if (details === null) throw new Error('Choose your role and location before continuing with Google.');
      notify('Choose your Google account to join the early-access list.');
      const user = await authenticate();
      if (!user?.email || !user.emailVerified || !user.providerData?.some(provider => provider.providerId === 'google.com')) {
        throw new Error('We could not get a verified Google email. Please use email signup below.');
      }
      notify('Google sign-in complete. Adding you to the early-access list…');
      await subscribe({email: user.email, ...details});
      complete = true;
      notify('You’re on the CLEF early-access list! No extra confirmation is needed.');
    } catch (error) {
      const messages = {
        'auth/popup-closed-by-user': 'Google sign-in was cancelled. Try again or use email signup below.',
        'auth/cancelled-popup-request': 'Google sign-in was cancelled. Try again or use email signup below.',
        'auth/popup-blocked': 'Your browser blocked Google sign-in. Allow popups for this site or use email signup below.',
        'auth/unauthorized-domain': 'Google sign-in is not available on this address. Please use email signup below.',
        'auth/network-request-failed': 'Google could not connect. Check your connection or use email signup below.',
        'auth/account-exists-with-different-credential': 'This email uses another CLEF sign-in method. You can still join the list using email below.',
      };
      notify(messages[error?.code] || (error?.code ? 'Google sign-in is unavailable. Please use email signup below.' : error?.message || 'Signup could not be completed. Please try email signup below.'));
    } finally {
      busy = false;
      setBusy(false);
    }
  };
}
