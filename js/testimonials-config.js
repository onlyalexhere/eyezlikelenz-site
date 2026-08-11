/* ==========================================================================
   Testimonials
   --------------------------------------------------------------------------
   Nothing renders until `approved` is true. The whole section is removed
   from the page while no entry is approved.

   Only set approved: true once the client has agreed to the wording in
   writing. Publishing a quote someone did not agree to is a fake review —
   unlawful in the UK under the Digital Markets, Competition and Consumers
   Act, quite apart from what it would do to the relationship. Keep their
   reply (email or DM screenshot) somewhere you can find it again.

   Adding a new one:
     1. Draft it, or ask the client to send their own words.
     2. Get their yes in writing.
     3. Add the entry with approved: true.

   Delete any entry a client declines. Do not publish a softened version.
   ========================================================================== */
var TESTIMONIALS = [
  {
    client: "Bigman's Party",
    shoot: 'Club night',
    quote: "He was everywhere and nowhere at the same time. Got every single one of my people without anyone feeling watched, and the gallery landed before the weekend was even over.",
    approved: true
  },
  {
    client: "S'Cape",
    shoot: 'Club night',
    quote: 'Booked him for one night and ended up keeping him for the season. Quick, easy to deal with, and the photos do half our marketing now.',
    approved: true
  },
  {
    client: 'Mr Kwarteng',
    shoot: 'Wedding',
    quote: 'Calm the entire day, which mattered more than I expected it to. My wife cried at the sneak peeks and they came through two days after the wedding, exactly when he said they would.',
    approved: true
  }
];
