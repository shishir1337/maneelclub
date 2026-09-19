import { z } from "zod";
import { CHANNELS } from "@/lib/attribution";

/**
 * Attribution arrives from the client, so every field is length-capped and the
 * channel is whitelisted. Unrecognised channels are coerced to "referral" rather
 * than rejected - a junk value must never cost us the order.
 */
const shortString = z.string().trim().max(200).nullable().catch(null);
const longString = z.string().trim().max(500).nullable().catch(null);

const channelSchema = z
  .string()
  .transform((value) => (CHANNELS.includes(value as (typeof CHANNELS)[number]) ? value : "referral"))
  .catch("referral");

export const touchSchema = z.object({
  channel: channelSchema,
  source: shortString,
  medium: shortString,
  campaign: shortString,
  content: shortString,
  term: shortString,
  clickId: shortString,
  clickIdType: shortString,
  referrer: longString,
  landingPage: longString,
  timestamp: z.string().max(40).catch(() => new Date().toISOString()),
});

export const attributionSchema = z.object({
  first: touchSchema.nullable().catch(null),
  last: touchSchema.nullable().catch(null),
});

export type AttributionInput = z.infer<typeof attributionSchema>;
