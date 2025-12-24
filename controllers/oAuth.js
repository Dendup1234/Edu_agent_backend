import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import gUser from "../models/user.model.js"

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = ["openid", "email", "profile"];

const stateStore = new Set();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const redirectToGoogle = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.add(state);

  const authUrl =
    `${GOOGLE_OAUTH_URL}?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  res.redirect(authUrl);
};

export const handleGoogleCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || !stateStore.has(state)) {
    return res.status(400).send("Invalid OAuth state.");
  }

  stateStore.delete(state);

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");

    const { id_token } = await tokenRes.json();

    if (!id_token) throw new Error("Missing ID token");

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid token payload");

    let user = await gUser.findOne({ googleId: payload.sub });

    if (!user) {
      user = await gUser.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Authentication failed");
  }
};
