# Album de Conquistas - Web App

Aplicacao React + TypeScript com arquitetura de estado tipada para prototipar o sistema de achievements de seminario.

Nota: este sistema foi desenhado como mobile-first.

## Rodar localmente

```bash
npm install
npm run dev
```

Build de validacao:

```bash
npm run build
```

## O que foi implementado

- App real em React + TypeScript + Vite
- Estado central com reducer e acoes tipadas
- Rotas com `react-router-dom` + guard por perfil
- Fluxo professor:
  - ver alunos da classe selecionada
  - conceder achievements em lote
  - remover conquista no detalhe do aluno
  - criar convite por email
  - cancelar convite
  - simular aceite e adicionar aluno na turma
- Album do aluno com progresso
- Catalogo e auditoria para diretor/superadmin

## Estrutura principal

- `src/domain/*`: tipos e dados seed
- `src/state/AppState.tsx`: estado global e regras de negocio
- `src/layout/AppShell.tsx`: shell e navegacao
- `src/pages/*`: telas de fluxo
- `src/index.css`: design system do app

## Proximos gaps (roadmap tecnico)

1. Persistencia real (API + banco) e autenticacao
2. Controle granular de permissoes por entidade
3. Historico completo de remocoes com justificativa obrigatoria
4. Upload de arte dos achievements e templates de compartilhamento social
5. Testes automatizados (unitarios + integracao)
