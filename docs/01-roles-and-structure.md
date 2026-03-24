# Papeis e Estrutura Organizacional

## Hierarquia de acesso

### Superadministrador

Nivel mais alto do sistema.

Responsabilidades:

- Gerenciar toda a organizacao
- Criar e editar diretores
- Visualizar todos os professores, alunos e classes
- Criar catalogos de achievements
- Definir regras globais do sistema
- Acessar relatorios gerais
- Corrigir dados manualmente quando necessario
- Atuar em qualquer classe
- Gerenciar convites em todos os niveis
- Configurar parametros institucionais

Permissao: acesso total de leitura, criacao, edicao e remocao em todo o sistema.

### Diretor

Gestor intermediario com papel de supervisao operacional.

Responsabilidades:

- Cadastrar e convidar professores
- Gerenciar classes sob sua responsabilidade
- Acompanhar o progresso geral de alunos e professores
- Ajudar no suporte operacional
- Cadastrar alunos e conceder achievements quando necessario
- Visualizar relatorios da sua area
- Redistribuir professores entre classes ou unidades, se aplicavel

Permissao: acesso amplo dentro da propria area, sem poder estrutural global.

### Professor

Operador principal do dia a dia.

Responsabilidades:

- Criar ou convidar alunos para sua classe
- Editar dados dos alunos da sua classe
- Conceder achievements aos seus alunos
- Acompanhar progresso individual e coletivo
- Ver album dos alunos
- Registrar observacoes no futuro, se existir funcionalidade
- Gerenciar presenca ou progresso de leitura, se fizer parte da evolucao

Permissao: acesso total a propria classe e aos proprios alunos, sem acesso estrutural a outras classes ou professores.

### Aluno

Usuario final com foco em visualizacao e engajamento.

Responsabilidades:

- Visualizar o proprio progresso
- Ver achievements recebidos
- Acompanhar seu album
- Aceitar convite e concluir cadastro
- Ver metas pendentes, se isso for implementado

Permissao: acesso apenas aos proprios dados.

## Modelo organizacional sugerido

Estrutura ideal:

1. Organizacao
2. Diretoria ou unidade
3. Classe
4. Usuarios
5. Achievements

Exemplo logico:

- Uma organizacao pode ter varios diretores.
- Cada diretor pode estar ligado a varias classes ou grupos.
- Cada professor pode estar ligado a uma ou mais classes.
- Cada aluno pertence a pelo menos uma classe.
- Cada achievement pertence a um catalogo institucional.
- Cada aluno possui um conjunto de achievements recebidos.

## Dados sugeridos por perfil

### Diretor

- Nome
- E-mail
- Telefone opcional
- Status
- Data de entrada
- Unidade ou area

### Professor

- Nome
- E-mail
- Telefone opcional
- Classe ou classes vinculadas
- Diretor responsavel
- Status

### Aluno

- Nome
- E-mail opcional, se obrigatorio para convite
- Idade opcional
- Classe vinculada
- Professor responsavel
- Data de entrada
- Status
- Foto opcional

## Classes

A classe e a unidade central de relacionamento entre professor e aluno.

Funcionalidades:

- Criar classe
- Editar classe
- Associar professor responsavel
- Adicionar ou remover alunos
- Visualizar painel da classe
- Ver progresso agregado

Dados da classe:

- Nome da classe
- Professor responsavel
- Diretor responsavel
- Periodo ou ano
- Quantidade de alunos
- Status

Regras importantes:

- Aluno deve sempre estar vinculado a uma classe ativa
- Professor pode ter uma ou mais classes conforme regra institucional
- Diretor pode visualizar todas as classes sob sua gestao
