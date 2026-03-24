# Modulos e Fluxos Principais

## Modulos principais do sistema

### Autenticacao por convite

A criacao de conta sera somente por convite.

Motivos:

1. Mantem o sistema fechado e controlado
2. Evita cadastros indevidos
3. Permite hierarquia na entrada de usuarios

Regras do convite:

- Superadmin convida diretor
- Diretor convida professor
- Professor convida aluno
- Diretor tambem pode convidar aluno, se necessario
- Superadmin pode convidar qualquer perfil

Status do convite:

- Pendente
- Aceito
- Expirado
- Cancelado

Dados minimos no convite:

- Nome
- E-mail
- Tipo de perfil
- Classe vinculada, quando for aluno
- Diretor ou professor responsavel
- Data de expiracao
- Status

### Gestao de usuarios

Funcionalidades:

- Criar usuario por convite
- Editar nome e dados basicos
- Ativar ou desativar usuario
- Alterar vinculo entre classe e professor
- Visualizar historico do usuario
- Pesquisar e filtrar usuarios

### Gestao de classes

Funcionalidades:

- Criar classe
- Editar classe
- Associar professor responsavel
- Adicionar ou remover alunos
- Visualizar painel da classe
- Ver progresso agregado

### Dashboards e relatorios

#### Para professor

- Quantidade de alunos na classe
- Achievements concedidos no periodo
- Alunos sem progresso recente
- Colecoes mais concluidas
- Ranking de progresso, se apropriado

#### Para diretor

- Numero de professores ativos
- Numero de alunos ativos
- Classes com maior engajamento
- Professores com menor uso do sistema
- Achievements mais concedidos
- Convites pendentes

#### Para superadmin

- Visao global por unidade
- Total de diretores, professores e alunos
- Uso do sistema ao longo do tempo
- Achievements mais usados
- Taxa de aceitacao de convites
- Crescimento por periodo

## Fluxos principais de negocio

### Fluxo de criacao de diretor

1. Superadmin acessa gestao de usuarios
2. Clica em convidar diretor
3. Preenche dados
4. Sistema envia convite
5. Diretor aceita e finaliza cadastro
6. Diretor passa a ter acesso a sua area

### Fluxo de criacao de professor

1. Diretor acessa gestao de professores
2. Clica em convidar professor
3. Define classe ou deixa vinculo posterior
4. Professor aceita o convite
5. Diretor conclui o vinculo operacional, se necessario

### Fluxo de criacao de aluno

1. Professor acessa sua classe
2. Clica em convidar aluno
3. Preenche nome e e-mail
4. Sistema envia convite
5. Aluno aceita e cria senha
6. Aluno passa a visualizar seu album

### Fluxo de correcao administrativa

1. Diretor ou superadmin detecta erro
2. Abre historico do aluno
3. Remove ou corrige uma concessao
4. Sistema registra auditoria

## Experiencia do usuario recomendada

### Professor

Precisa ser muito rapida e clara.

Fluxo ideal:

1. Abrir a turma
2. Escolher um aluno
3. Marcar a conquista
4. Confirmar

### Aluno

Precisa ser visual e motivador.

Sensacoes desejadas:

- Estou avancando
- Tenho conquistas reais
- Quero completar a colecao

### Diretor

Precisa ser administrativo e orientado a supervisao.

Perguntas que deve responder rapidamente:

- Quais professores estao ativos
- Quais classes estao com pouco movimento
- Quais convites ainda nao foram aceitos

## Modulos funcionais detalhados

1. Autenticacao e acesso
2. Convites
3. Gestao de usuarios
4. Estrutura organizacional
5. Gestao de classes
6. Catalogo de achievements
7. Concessao de achievements
8. Album do aluno
9. Compartilhamento social
10. Relatorios e dashboards
11. Auditoria
12. Administracao global
