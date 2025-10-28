import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import * as cors from "cors";

admin.initializeApp();

const corsHandler = cors({origin: true});

// IMPORTANT: Before deploying, set your Trakt secrets in the Firebase environment:
// firebase functions:config:set trakt.id="YOUR_TRAKT_CLIENT_ID"
// firebase functions:config:set trakt.secret="YOUR_TRAKT_CLIENT_SECRET"
// firebase functions:config:set trakt.redirect_uri="YOUR_REDIRECT_URI" (e.g., http://localhost:3000/auth/trakt/callback)

export const traktAuth = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const {code, refreshToken} = request.body;
    const clientId = functions.config().trakt.id;
    const clientSecret = functions.config().trakt.secret;
    const redirectUri = functions.config().trakt.redirect_uri;

    let body: any;

    if (code) {
      // Exchange authorization code for a token
      body = {
        code,
        "client_id": clientId,
        "client_secret": clientSecret,
        "redirect_uri": redirectUri,
        "grant_type": "authorization_code",
      };
    } else if (refreshToken) {
      // Refresh an existing token
      body = {
        "refresh_token": refreshToken,
        "client_id": clientId,
        "client_secret": clientSecret,
        "redirect_uri": redirectUri,
        "grant_type": "refresh_token",
      };
    } else {
      response.status(400).json({error: "Missing 'code' or 'refreshToken' in request body."});
      return;
    }

    try {
      const traktResponse = await fetch("https://api.trakt.tv/oauth/token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });

      const responseData = await traktResponse.json();

      if (!traktResponse.ok) {
        functions.logger.error("Trakt API Error:", responseData);
        response.status(traktResponse.status).json({error: (responseData as any).error_description || "Failed to authenticate with Trakt."});
        return;
      }

      response.status(200).json(responseData);
    } catch (error) {
      functions.logger.error("Error in traktAuth function:", error);
      response.status(500).json({error: "An internal server error occurred."});
    }
  });
});
