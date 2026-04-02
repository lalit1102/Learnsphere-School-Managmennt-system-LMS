import { Inngest } from "inngest";

const isDev = process.env.INNGEST_DEV === "1" || process.env.NODE_ENV === "development";

export const inngest = new Inngest({
  id: "sms-lms",
  eventKey: isDev ? undefined : process.env.INNGEST_EVENT_KEY,
});

if (isDev) {
  console.log("🛠️ Inngest Client initialized in Local Dev Mode");
}