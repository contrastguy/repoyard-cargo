import { createApp } from './app.js'

const version = process.env.GIT_SHA ?? 'dev'
const port = Number(process.env.PORT ?? 8080)

// Observabilidade opcional: só liga com as variáveis de ambiente (o segredo vem de um Secret no cluster).
let onError: ((err: unknown) => void) | undefined
if (process.env.SENTRY_DSN) {
  const Sentry = await import('@sentry/node')
  Sentry.init({ dsn: process.env.SENTRY_DSN, release: version, environment: process.env.DD_ENV ?? 'kind' })
  onError = (err) => Sentry.captureException(err)
}
if (process.env.DD_AGENT_HOST) {
  const tracer = (await import('dd-trace')).default
  tracer.init({ service: process.env.DD_SERVICE ?? 'cargo', version, env: process.env.DD_ENV ?? 'kind' })
}

createApp({ version, onError }).listen(port, () => {
  console.log(`[cargo] ${version} ouvindo em :${port}`)
})
