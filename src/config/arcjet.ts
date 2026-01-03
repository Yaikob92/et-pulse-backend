import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";

// initialize Arcjet with security rules
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    // shield protects your app from common attacks e.g SQL injection, XSS, CSRF token
    shield({ mode: "LIVE" }),

    // bot detection - block all bots except search engines
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    // rate limiting with token bucket algorithim
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 10,
      capacity: 15,
    }),
  ],
});
