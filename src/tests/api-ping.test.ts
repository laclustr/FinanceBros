import { describe, it, expect } from 'vitest';
import { fetch } from 'undici';

describe('/api/ping API route', () => {
  it('responds with { message: "pong" }', async () => {
    // Replace with your local dev server URL or deployed URL
    const response = await fetch('http://localhost:4322/api/ping');

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ message: 'pong' });
  });
});