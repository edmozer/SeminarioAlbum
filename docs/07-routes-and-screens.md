# Telas, Navegacao e Rotas

## Telas principais sugeridas

### Superadmin

- Login
- Dashboard geral
- Gestao de diretores
- Gestao global de usuarios
- Gestao do catalogo de achievements
- Relatorios globais

### Diretor

- Dashboard da sua area
- Lista de professores
- Lista de classes
- Gestao de alunos da area
- Convites pendentes
- Relatorios locais

### Professor

- Dashboard da classe
- Lista de alunos
- Detalhe do aluno
- Conceder achievement
- Convites de alunos
- Visualizacao do album do aluno

### Aluno

- Meu album
- Meu progresso
- Meu perfil

## Navegacao funcional recomendada

### Superadmin

- Dashboard
- Usuarios
- Diretores
- Professores
- Alunos
- Classes
- Achievements
- Relatorios
- Auditoria
- Configuracoes

### Diretor

- Dashboard
- Professores
- Classes
- Alunos
- Achievements
- Convites
- Relatorios

### Professor

- Dashboard
- Minhas classes
- Meus alunos
- Conceder achievements
- Convites

### Aluno

- Meu album
- Minhas conquistas
- Compartilhar
- Meu perfil

## Rotas sugeridas da aplicacao

Observacao: as rotas abaixo sao funcionais. A implementacao pode ser server rendered, SPA, API REST ou hibrida.

### Rotas publicas

- `GET /login`
- `POST /login`
- `POST /logout`
- `GET /invites/:token`
- `POST /invites/:token/accept`
- `GET /password/forgot`
- `POST /password/forgot`
- `GET /password/reset/:token`
- `POST /password/reset/:token`
- `GET /share/a/:publicToken`

### Rotas autenticadas comuns

- `GET /dashboard`
- `GET /me`
- `PATCH /me`
- `PATCH /me/password`
- `GET /me/album`
- `GET /me/achievements`
- `GET /me/shares`

### Rotas de convites

- `GET /invites`
- `POST /invites`
- `GET /invites/:id`
- `POST /invites/:id/resend`
- `POST /invites/:id/cancel`

### Rotas de usuarios

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `POST /users/:id/activate`
- `POST /users/:id/deactivate`

### Rotas de diretores

- `GET /directors`
- `POST /directors`
- `GET /directors/:id`
- `PATCH /directors/:id`
- `GET /directors/:id/teachers`
- `GET /directors/:id/classes`
- `GET /directors/:id/students`

### Rotas de professores

- `GET /teachers`
- `POST /teachers`
- `GET /teachers/:id`
- `PATCH /teachers/:id`
- `GET /teachers/:id/classes`
- `GET /teachers/:id/students`

### Rotas de alunos

- `GET /students`
- `POST /students`
- `GET /students/:id`
- `PATCH /students/:id`
- `GET /students/:id/album`
- `GET /students/:id/achievements`
- `GET /students/:id/shareable-achievements`

### Rotas de classes

- `GET /classes`
- `POST /classes`
- `GET /classes/:id`
- `PATCH /classes/:id`
- `POST /classes/:id/archive`
- `POST /classes/:id/activate`
- `GET /classes/:id/students`
- `POST /classes/:id/students`
- `DELETE /classes/:id/students/:studentId`
- `POST /classes/:id/students/:studentId/transfer`

### Rotas de achievements

- `GET /achievements`
- `POST /achievements`
- `GET /achievements/:id`
- `PATCH /achievements/:id`
- `POST /achievements/:id/activate`
- `POST /achievements/:id/deactivate`
- `GET /achievement-categories`
- `POST /achievement-categories`
- `GET /achievement-collections`
- `POST /achievement-collections`

### Rotas de concessao de achievements

- `GET /student-achievements`
- `POST /student-achievements`
- `GET /student-achievements/:id`
- `POST /student-achievements/bulk-grant`
- `POST /student-achievements/:id/remove`

### Rotas de album

- `GET /albums/:studentId`
- `GET /albums/:studentId/collections/:collectionId`

### Rotas de compartilhamento social

- `POST /shares/student-achievements/:id/generate`
- `GET /shares/student-achievements/:id`
- `POST /shares/student-achievements/:id/revoke`
- `GET /shares/student-achievements/:id/image`
- `GET /shares/student-achievements/:id/public-link`
- `POST /shares/student-achievements/:id/whatsapp`
- `POST /shares/student-achievements/:id/facebook`
- `POST /shares/student-achievements/:id/x`

### Rotas de dashboards e relatorios

- `GET /reports/teacher`
- `GET /reports/director`
- `GET /reports/admin`
- `GET /reports/classes/:id`
- `GET /reports/students/:id`
- `GET /reports/achievements`
- `GET /reports/invites`

### Rotas de auditoria

- `GET /audit-logs`
- `GET /audit-logs/:id`

### Rotas de administracao global

- `GET /settings`
- `PATCH /settings`
- `GET /branding`
- `PATCH /branding`
