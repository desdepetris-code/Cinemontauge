import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Setup CORS to allow your frontend to talk to this API
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, refreshToken, redirectUri } = req.body;
  
  // These must be set in the Vercel Dashboard Environment Variables
  const clientId = process.env.TRAKT_ID;
  const clientSecret = process.env.TRAKT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Registry Configuration Error: Missing Trakt Secret in Environment.' });
  }

  if (!redirectUri) {
    return res.status(400).json({ error: "Missing 'redirectUri' in request body." });
  }

  let body: any;

  if (code) {
    // Initial code exchange
    body = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };
  } else if (refreshToken) {
    // Token refresh
    body = {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'refresh_token',
    };
  } else {
    return res.status(400).json({ error: "Missing 'code' or 'refreshToken' in request body." });
  }

  try {
    const traktResponse = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseData = await traktResponse.json();

    if (!traktResponse.ok) {
      console.error('Trakt API Error:', responseData);
      return res.status(traktResponse.status).json({ 
        error: responseData.error_description || 'Failed to authenticate with Trakt.' 
      });
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Registry API Error:', error);
    return res.status(500).json({ error: 'An internal registry error occurred during sync.' });
  }
}