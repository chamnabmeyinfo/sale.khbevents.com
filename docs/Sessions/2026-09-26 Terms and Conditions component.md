---
type: session
date: 2026-09-26
tags: [session]
---

# Terms and Conditions component

## Asked for

- A Terms & Conditions component for the page builder.

## Done

- New builder component **Terms & Conditions**: designs Accordion and Full document, up to 30 clauses, a Last updated date and a note. Starter clauses are placeholders, flagged as sample text.
- Lead form option **Ask visitors to agree to the Terms & Conditions**: a required tick box linked to the section. The lead stores when the visitor agreed and the terms' version (Last updated date); Leads & CRM Pipeline shows it.
- Printing: Entire page includes the terms, the Agenda leaves them out.
- See [[Page Builder]], [[Print Agenda]].

## Verified

- tsc, eslint, 197 unit tests, production build.
- Phone test on a local server: section renders, submit blocked until the box is ticked, lead records agreement and version, no sideways scroll, print full vs agenda, CRM shows the agreement.

## Decisions

- None.

## Follow-ups

- Owner writes the real terms and has them checked (added to [[Open Tasks]]).
