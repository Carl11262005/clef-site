export const ROLE_TAGS = Object.freeze({
  venue: 'Early Access – Venue',
  musician: 'Early Access – Musician',
  band: 'Early Access – Band',
});

export function isExpandedKitSchema({locationRequired, roleRequired, roleTags = []} = {}) {
  const normalized = new Set(roleTags.map(value => String(value).trim()));
  return Boolean(locationRequired && roleRequired && Object.values(ROLE_TAGS).every(tag => normalized.has(tag)));
}

export function createSignupState({role = null} = {}) {
  const state = {role: ROLE_TAGS[role] ? role : null, location: '', step: 1, subscribed: false};
  const result = (ok, message = '') => ({ok, message});
  return {
    snapshot: () => ({...state}),
    details: () => state.role && state.location ? {role: state.role, location: state.location} : null,
    selectRole(nextRole) {
      if (!ROLE_TAGS[nextRole]) return result(false, 'Choose Venue, Musician, or Band.');
      state.role = nextRole;
      state.step = 2;
      return result(true);
    },
    continueWithLocation(value) {
      const location = String(value ?? '').trim();
      if (!location) return result(false, 'Enter your city and state or region.');
      if (location.length > 100) return result(false, 'Keep your location to 100 characters or fewer.');
      state.location = location;
      state.step = 3;
      return result(true);
    },
    back() {
      state.step = Math.max(1, state.step - 1);
      return state.step;
    },
    goTo(step) {
      if (step === 1 || (step === 2 && state.role) || (step === 3 && state.role && state.location)) state.step = step;
      return state.step;
    },
    markSubscribed() {
      if (state.subscribed) return false;
      state.subscribed = true;
      return true;
    },
  };
}
