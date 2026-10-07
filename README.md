# repoyard-cargo

API de exemplo que passa pela esteira do [repoyard](../repoyard): CI (lint/test/build) → SonarCloud + CodeQL → imagem no GHCR → Argo CD no kind → Datadog/Sentry/Uptime.

## Endpoints

| Rota | O que faz |
|---|---|
| `GET /health` | status + versão (SHA) em execução |
| `GET/POST /items`, `GET/DELETE /items/:id` | CRUD em memória |
| `GET /boom` | lança erro (demonstração para o Sentry) |
| `GET /slow?ms=` | atrasa a resposta, máx. 5 s (demonstração para o Datadog) |

## Desenvolvimento

```bash
npm install
npm test        # vitest + cobertura (lcov para o Sonar)
npm run lint
npm run dev     # :8080
```

## Publicar no GitHub (manual, uma vez)

O repositório precisa ser **público** (CodeQL e branch protection grátis só em repo público), então:

1. `gh repo create contrastguy/repoyard-cargo --public --source . --push`
2. Settings → Actions → General → **"Require approval for all outside collaborators"**
3. Settings → Branches → proteção na `main`: checks obrigatórios `lint`, `test`, `build`, `SonarCloud`, `CodeQL`; habilite **Allow auto-merge**
4. SonarCloud: importe o repo e crie o secret `SONAR_TOKEN`
5. Packages: deixe a imagem `repoyard-cargo` **pública** (o kind puxa sem pull secret)

Os agentes do repoyard só agem em PRs de `contrastguy`, `repoyard-bot` e `dependabot[bot]` com head no próprio repo (allowlist da spec §6).

## Pátio ao vivo

Cada push nesta API aparece como um caminhão no [repoyard](../repoyard): CI → SonarCloud/CodeQL → imagem → Argo CD → pods no kind.

Demonstrações para a Torre: `GET /boom` gera um erro no Sentry; `GET /slow?ms=` gera latência.

## Agentes do pátio

PRs deste repositório passam pelos agentes do repoyard: o Porteiro classifica e resume, o Inspetor revisa o diff depois do CI verde.
