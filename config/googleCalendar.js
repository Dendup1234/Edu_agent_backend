import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

console.log("ENV PATH:", process.env.GOOGLE_SERVICE_ACCOUNT_FILE);
console.log("System Id:", process.env.SYSTEM_CALENDAR_ID);

const credsPath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
if (!credsPath) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_FILE");

const credentials = JSON.parse(fs.readFileSync(credsPath, "utf8"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

export const gcal = google.calendar({ version: "v3", auth });
