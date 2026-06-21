---
title: Privacy
description: How yawa handles visitor data and why no consent banner is needed.
---

:::tip[TL;DR]
No cookies, no personal data stored, no consent banner needed.
:::

Rather than using cookies, yawa generates a session ID on the server for each request. It hashes the visitor's IP address, user agent, and site ID together with a salt derived from the current date. The same visitor will get the same session ID throughout the day, but a different one the next day.

No personal data is stored and no cookies are set, which is why no consent banner is needed.

Since yawa is self-hosted, GDPR compliance depends on where you deploy it. Hosting within the EU on infrastructure that meets GDPR requirements is your responsibility.
