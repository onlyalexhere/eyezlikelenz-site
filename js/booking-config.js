/* ==========================================================================
   Booking configuration
   --------------------------------------------------------------------------
   The booking calendar is hosted by Cal.com. This file is the ONLY place
   that needs editing when your Cal.com details change.

   SETUP (see README "Booking calendar" for the full walkthrough):
     1. Create your Cal.com account and note your username.
     2. Create one event type per session tier.
     3. Put your username and the event slugs below.

   Until CAL_USERNAME is filled in, the booking buttons fall back to the
   contact section so the site never ships a dead button.
   ========================================================================== */
var BOOKING_CONFIG = {
  // Your Cal.com username, e.g. 'eyezlikelenz' for cal.com/eyezlikelenz
  // Leave as '' to keep buttons pointing at the enquiry section.
  username: 'eyezlikelenz',

  // The slug of each event type, as it appears in the Cal.com URL.
  // e.g. slug 'half-session' => cal.com/eyezlikelenz/half-session
  events: {
    half: 'half-session',
    full: 'full-session',
    day: 'full-day'
  }
};
