import express, { type NextFunction, type Request, type Response } from 'express'

export interface Item {
  id: number
  name: string
}

export interface AppOptions {
  /** SHA da imagem em execução (vem de GIT_SHA no container). */
  version?: string
  /** Chamado com erros inesperados (o server.ts liga no Sentry quando há DSN). */
  onError?: (err: unknown) => void
}

const MAX_NAME = 200
const MAX_SLOW_MS = 5000

export function createApp(opts: AppOptions = {}) {
  const app = express()
  app.use(express.json({ limit: '16kb' }))
  const items = new Map<number, Item>()
  let nextId = 1

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: opts.version ?? 'dev' })
  })

  app.get('/items', (_req, res) => {
    res.json([...items.values()])
  })

  app.get('/items/:id', (req, res) => {
    const item = items.get(Number(req.params.id))
    if (!item) return void res.status(404).json({ error: 'not found' })
    res.json(item)
  })

  app.post('/items', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name || name.length > MAX_NAME) return void res.status(400).json({ error: `name must be 1-${MAX_NAME} chars` })
    const item = { id: nextId++, name }
    items.set(item.id, item)
    res.status(201).json(item)
  })

  app.delete('/items/:id', (req, res) => {
    items.delete(Number(req.params.id))
    res.status(204).end()
  })

  // Endpoints de demonstração para a Torre de controle (Sentry e Datadog).
  app.get('/boom', () => {
    throw new Error('boom: erro de demonstração para o Sentry')
  })

  app.get('/slow', async (req, res) => {
    const ms = Math.min(MAX_SLOW_MS, Math.max(0, Number(req.query.ms) || 0))
    await new Promise((r) => setTimeout(r, ms))
    res.json({ waitedMs: ms })
  })

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    opts.onError?.(err)
    res.status(500).json({ error: 'internal error' })
  })

  return app
}
