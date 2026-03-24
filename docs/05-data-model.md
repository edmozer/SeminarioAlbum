# Modelo de Dados e Entidades

## Estrutura de dados sugerida inicialmente

Entidades principais originais:

- User
- Role
- ClassRoom
- StudentProfile
- TeacherProfile
- DirectorProfile
- Achievement
- StudentAchievement
- Invite
- AuditLog

## Entidades recomendadas para modelagem evolutiva

### 1. User

Finalidade: representa qualquer pessoa com acesso ao sistema.

Campos sugeridos:

- id
- name
- email
- password_hash
- role
- status
- last_login_at
- invited_by_user_id
- created_at
- updated_at

### 2. UserProfile

Finalidade: armazenar informacoes complementares do usuario.

Campos sugeridos:

- id
- user_id
- first_name
- last_name
- phone nullable
- photo_url nullable
- display_name nullable

### 3. Organization

Finalidade: representar a instituicao principal, caso o sistema suporte multiplas organizacoes.

Campos sugeridos:

- id
- name
- slug
- status
- created_at
- updated_at

### 4. DirectorScope

Finalidade: representar unidade, area ou diretoria sob responsabilidade de um diretor.

Campos sugeridos:

- id
- organization_id
- name
- status
- created_at
- updated_at

### 5. Classroom

Finalidade: representar turma ou classe.

Campos sugeridos:

- id
- organization_id
- director_scope_id
- name
- teacher_user_id
- period
- status
- created_at
- updated_at

### 6. ClassroomStudent

Finalidade: vinculo entre aluno e classe.

Campos sugeridos:

- id
- classroom_id
- student_user_id
- joined_at
- left_at nullable
- status

### 7. AchievementCategory

Finalidade: agrupar achievements por natureza.

Campos sugeridos:

- id
- name
- slug
- status

### 8. AchievementCollection

Finalidade: agrupar achievements em albuns ou colecoes.

Campos sugeridos:

- id
- name
- slug
- description nullable
- order_index
- status

### 9. Achievement

Finalidade: definir um achievement disponivel para concessao.

Campos sugeridos:

- id
- category_id
- collection_id
- name
- slug
- description
- image_url
- share_template_type nullable
- order_index
- is_repeatable boolean
- is_active boolean
- created_by_user_id
- created_at
- updated_at

### 10. StudentAchievement

Finalidade: registrar cada concessao de achievement para um aluno.

Campos sugeridos:

- id
- student_user_id
- achievement_id
- granted_by_user_id
- granted_by_role
- granted_at
- notes nullable
- status
- removed_at nullable
- removed_by_user_id nullable
- remove_reason nullable

### 11. Invite

Finalidade: representar convites de entrada.

Campos sugeridos:

- id
- email
- role
- token
- status
- invited_by_user_id
- organization_id nullable
- director_scope_id nullable
- classroom_id nullable
- expires_at
- accepted_at nullable
- created_at
- updated_at

### 12. ShareAsset

Finalidade: representar ativo compartilhavel gerado para achievement.

Campos sugeridos:

- id
- student_achievement_id
- public_token
- image_url nullable
- public_url nullable
- is_public boolean
- created_at
- revoked_at nullable

### 13. AuditLog

Finalidade: registrar acoes sensiveis.

Campos sugeridos:

- id
- actor_user_id nullable
- action
- entity_type
- entity_id
- metadata_json
- created_at

### 14. Session or AuthToken

Finalidade: gerenciar sessao ou autenticacao persistente.

Campos sugeridos:

- id
- user_id
- token_hash
- expires_at
- revoked_at nullable
- created_at

## Relacionamentos logicos principais

- Uma `Organization` possui varios `DirectorScope`.
- Um `DirectorScope` possui varias `Classroom`.
- Uma `Classroom` possui um professor responsavel e varios alunos via `ClassroomStudent`.
- Um `Achievement` pertence a uma `AchievementCategory` e a uma `AchievementCollection`.
- Um aluno recebe varios `StudentAchievement`.
- Um `ShareAsset` depende de um `StudentAchievement`.
- Um `Invite` vincula o usuario futuro ao papel e ao contexto estrutural correto.
- Um `AuditLog` registra todas as acoes sensiveis do dominio.

## Observacoes de modelagem

- O MVP pode operar com uma unica organizacao, mas manter `Organization` na modelagem ajuda a evitar retrabalho.
- `ClassroomStudent` deixa a transferencia de aluno auditavel e historica.
- `StudentAchievement` precisa suportar remocao logica e auditoria de revogacao.
- `ShareAsset` deve ser invalidado quando a concessao associada for removida.
