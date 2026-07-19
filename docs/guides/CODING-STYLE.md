# Guia de Estilo de Código — Omnia

> Status: Ativo · Última revisão: 2026-07-19
> Formatação é automática (Spotless/Prettier) — este guia trata do que ferramenta não decide.

## Java (backend)

### Estrutura

- Pacotes por módulo de negócio, camadas `domain / application / adapter` (ADR-004).
- Um caso de uso público por classe (`CreateCustomerUseCase`), método `execute(...)` ou nome do verbo.
- Controllers finos: validam DTO, chamam caso de uso, mapeiam resposta. Zero regra de negócio.
- Regra de negócio mora no domínio (métodos de agregado / domain services), não em services anêmicos.

### Nomenclatura

- Inglês em todo o código; termos canônicos do DOMAIN.md (`Customer`, nunca `Cliente`/`Patient`).
- Sufixos: `UseCase`, `Repository` (port), `JpaRepository` (adapter), `Controller`, `Request`/`Response`
  (DTOs web), `Event` (domínio, pretérito: `CustomerRegisteredEvent`).
- Constantes de permissão: `module:action` (`customers:read`, `finance:manage`).

### Regras

- **Records** para VOs, DTOs, eventos e comandos. Classes só quando há mutabilidade/identidade.
- **Lombok restrito**: permitido `@Slf4j`; em entidades JPA `@Getter` e `@NoArgsConstructor(access=PROTECTED)`.
  Proibido `@Data`, `@Setter` público em entidade, `@Builder` em agregado (use factory com invariantes).
- Nulidade: `Optional` em retornos de port; jamais em campos/parâmetros. JSpecify/`@Nullable` onde couber.
- Exceções: hierarquia `DomainException` (400-level semântico) e subclasses por módulo com `code` estável.
  Nunca engolir exceção; nunca logar e relançar.
- Transação (`@Transactional`) apenas na camada application. Read-only explícito em consultas.
- Tempo: `Instant` no domínio/banco (UTC); conversão para timezone do tenant só na borda.
- Dinheiro: VO `Money` (amount+currency); proibido `double`/`float` para valores.
- Testes: nome `deveXxx_quandoYyy` ou `should_xxx_when_yyy` (escolhido: inglês `shouldXxx_whenYyy`);
  padrão AAA; um assert lógico por teste; Testcontainers para tudo que toca SQL/RLS.
- Comentários: apenas para invariantes/razões não óbvias. Javadoc obrigatório em API pública de módulo e ports.

## TypeScript/Angular (frontend)

- Standalone components; signals para estado; RxJS apenas para fluxos (HTTP, eventos) — converter na
  borda com `toSignal`. Sem `any`; `strict` ligado.
- Componentes de apresentação burros + containers/páginas com injeção de services.
- Arquivos: `feature/pages/…`, `feature/components/…`, `feature/data/…` (services+modelos).
- Nomes de arquivo Angular padrão (`customer-list.page.ts`, `customer.service.ts`).
- Estilo: Tailwind para layout/espaçamento; tokens do tema (CSS vars) para cor — nunca hex hardcoded.
- Acessibilidade: componentes Material como base; toda ação tem foco visível e label; testar teclado.
- i18n: nenhuma string de UI hardcoded fora dos arquivos de mensagens (pt-BR default).

## SQL / Migrações

- Convenções em [DATABASE.md](../architecture/DATABASE.md): snake_case, `(tenant_id, …)` indexes,
  RLS em toda tabela de negócio, colunas de auditoria, `NUMERIC` para dinheiro.
- Migração pequena, uma intenção, nome descritivo; nunca editar migração aplicada.

## Git

- Conventional Commits (escopo = módulo: `feat(scheduling): …`). Detalhes em CONTRIBUTING.md.
- Commits pequenos e atômicos; PRs < ~400 linhas de diff sempre que possível.
