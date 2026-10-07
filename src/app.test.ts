import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('cargo api', () => {
  it('reports health with the running version', async () => {
    const res = await request(createApp({ version: 'abc1234' })).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', version: 'abc1234' })
  })

  it('creates, lists, reads and deletes items', async () => {
    const app = createApp()
    const created = await request(app).post('/items').send({ name: 'crate' })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ id: 1, name: 'crate' })
    expect((await request(app).get('/items')).body).toEqual([{ id: 1, name: 'crate' }])
    expect((await request(app).get('/items/1')).body).toEqual({ id: 1, name: 'crate' })
    expect((await request(app).delete('/items/1')).status).toBe(204)
    expect((await request(app).get('/items/1')).status).toBe(404)
  })

  it('rejects empty or oversized item names', async () => {
    const app = createApp()
    expect((await request(app).post('/items').send({ name: '   ' })).status).toBe(400)
    expect((await request(app).post('/items').send({ name: 'x'.repeat(201) })).status).toBe(400)
    expect((await request(app).post('/items').send({})).status).toBe(400)
  })

  it('throws on /boom so error tracking has something to catch', async () => {
    const res = await request(createApp()).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'internal error' })
  })

  it('waits on /slow, capped at 5s', async () => {
    const started = Date.now()
    const res = await request(createApp()).get('/slow?ms=50')
    expect(res.status).toBe(200)
    expect(Date.now() - started).toBeGreaterThanOrEqual(45)
    expect((await request(createApp()).get('/slow?ms=abc')).body).toEqual({ waitedMs: 0 })
  })
})
