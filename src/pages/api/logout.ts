import { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict;',
      'Location': '/login/sign-in',
    },
  });
};