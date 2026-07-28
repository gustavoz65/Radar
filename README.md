# Radar

> Plataforma pessoal de inteligência financeira — centraliza dados de Open Finance
> (via Pierre) e cruza com indicadores econômicos, notícias e histórico de mercado para
> gerar análises probabilísticas de apoio a decisões de investimento em renda fixa,
> cripto e ações. Nunca recomenda uma compra específica; mostra um cenário atual do
> mercado com um score de confiança explicável.

## Por onde começar

| Quero…                           | Documento                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Entender o produto e as decisões | [docs/superpowers/specs/](docs/superpowers/specs/) — uma spec por sub-projeto |
| Contribuir                       | [CONTRIBUTING.md](CONTRIBUTING.md)                                            |
| Contexto para agentes de IA      | [CLAUDE.md](CLAUDE.md)                                                        |

## Sub-projetos

O Radar é dividido em quatro sub-projetos independentes:

1. [Frontend (Next.js)](docs/superpowers/specs/2026-07-26-radar-frontend-mvp-design.md)
   — **construído.** Dashboard com oito abas; toda leitura de dados passa por
   `lib/data/services.ts`.
2. [Integração Open Finance via Pierre](docs/superpowers/specs/2026-07-26-radar-pierre-integration-design.md)
   — **construído e validado contra a API real.** Contas, cartões, transações e
   "caixinhas" vêm do MySQL, alimentados por um sync sob demanda. Sinais, notícias e taxas
   continuam mocados até os sub-projetos 3 e 4.
3. [Ingestão de dados de mercado](docs/superpowers/specs/2026-07-26-radar-market-data-design.md)
   — ainda não iniciado.
4. [Motor de análise / score de confiança](docs/superpowers/specs/2026-07-26-radar-ai-scoring-engine-design.md)
   — ainda não iniciado.

## Como rodar

Precisa de Node 20+ e Docker.

```bash
npm install
cp .env.example .env.local

docker compose up -d          # MySQL 8 em 127.0.0.1:3306
npm run db:migrate            # cria as tabelas
npm run db:setup:test         # banco separado para os testes (uma vez só)
```

Preencha o `.env.local`:

- `AUTH_SECRET` — gere com `npx auth secret`
- `AUTH_USER_EMAIL` — o e-mail do único usuário permitido
- `AUTH_USER_PASSWORD_HASH` — **use `node set-password.cjs 'sua-senha'`**, não cole um hash
  à mão. O `dotenv-expand` do Next trata `$2b$12$…` como expansão de variável e corrompe o
  valor silenciosamente; o script escapa cada `$` e verifica o resultado num processo novo.
- `PIERRE_API_KEY` — chave em pierre.finance. Sem ela o app roda normalmente e só o botão
  "Atualizar agora" falha, com mensagem clara.

```bash
npm run dev                   # http://localhost:3000
npm run sync                  # opcional: sync da Pierre pela CLI, sem abrir o navegador
```

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`.next`)
- `npm run build:check` — build de verificação em `.next-check`; use este com o `dev` de pé,
  senão o build sobrescreve os chunks da aba aberta e a página perde o CSS
- `npm run lint` / `npm run typecheck` / `npm run format`
- `npm test` — Vitest. Roda contra `radar_test`, nunca contra o banco de desenvolvimento
- `npm run db:generate` / `db:migrate` / `db:studio` — Drizzle
- `npm run sync` — dispara um sync real da Pierre pela linha de comando

## Licença

Proprietário. Todos os direitos reservados.
