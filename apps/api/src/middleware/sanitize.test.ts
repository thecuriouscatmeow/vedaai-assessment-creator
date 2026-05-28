import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { sanitizeBody } from './sanitize';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/test', sanitizeBody(), (req, res) => {
    res.status(200).json({ body: req.body });
  });
  return app;
}

describe('sanitizeBody', () => {
  it('strips script tags from string values', async () => {
    const res = await request(buildApp())
      .post('/test')
      .send({ name: '<script>alert(1)</script>' });
    expect(res.status).toBe(200);
    expect(res.body.body.name).not.toContain('<script>');
    expect(res.body.body.name).not.toContain('</script>');
  });

  it('leaves number fields untouched', async () => {
    const res = await request(buildApp()).post('/test').send({ count: 42 });
    expect(res.status).toBe(200);
    expect(res.body.body.count).toBe(42);
  });

  it('leaves boolean fields untouched', async () => {
    const res = await request(buildApp()).post('/test').send({ active: true });
    expect(res.status).toBe(200);
    expect(res.body.body.active).toBe(true);
  });

  it('sanitizes XSS in nested object strings', async () => {
    const res = await request(buildApp())
      .post('/test')
      .send({ user: { bio: '<img src=x onerror=alert(1)>' } });
    expect(res.status).toBe(200);
    expect(res.body.body.user.bio).not.toContain('onerror');
  });

  it('sanitizes XSS inside arrays of strings', async () => {
    const res = await request(buildApp())
      .post('/test')
      .send({ tags: ['<b>safe</b>', '<script>hack</script>'] });
    expect(res.status).toBe(200);
    expect(res.body.body.tags[1]).not.toContain('<script>');
  });
});
