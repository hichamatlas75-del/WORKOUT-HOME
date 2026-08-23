/**
 * CLOUDFLARE PAGES API GATEWAY
 * Passerelle sécurisée serveur-à-serveur vers Firebase (Insensible aux bloqueurs de pub)
 */

const FIREBASE_ENDPOINT = 'https://workout-homefb17-default-rtdb.europe-west1.firebasedatabase.app';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const user = url.searchParams.get('user');

  if (!user) {
    return new Response(JSON.stringify({ error: 'Missing user param' }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  const cleanUser = user.replace(/[^a-z0-9_-]/gi, '_');
  const targetUrl = `${FIREBASE_ENDPOINT}/workout_profiles/${cleanUser}.json`;

  try {
    const fbResp = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const data = await fbResp.text();
    return new Response(data || 'null', {
      status: fbResp.status,
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function onRequestPut(context) {
  const url = new URL(context.request.url);
  const user = url.searchParams.get('user');

  if (!user) {
    return new Response(JSON.stringify({ error: 'Missing user param' }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  const cleanUser = user.replace(/[^a-z0-9_-]/gi, '_');
  const targetUrl = `${FIREBASE_ENDPOINT}/workout_profiles/${cleanUser}.json`;
  const bodyText = await context.request.text();

  try {
    const fbResp = await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText
    });
    const data = await fbResp.text();
    return new Response(data || '{}', {
      status: fbResp.status,
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
