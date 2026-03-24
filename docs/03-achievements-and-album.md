# Achievements, Album e Compartilhamento

## Conceito de achievements

Achievements sao conquistas visuais que o aluno recebe ao cumprir marcos.

Exemplos:

- Leu Genesis
- Leu Exodo
- Completou o bloco Pentateuco
- Participou por 4 semanas seguidas
- Concluiu o modulo do Velho Testamento
- Memorizou uma escritura especifica
- Alcancou 100 por cento de presenca em um periodo

Podem ser exibidos como:

- Figurinhas em um album
- Selos colecionaveis
- Badges em perfil
- Medalhas por categoria

A proposta mais forte para engajamento e usar a ideia de album.

## Catalogo de achievements

Um achievement e uma entidade cadastrada previamente, com identidade visual e criterios claros.

Campos sugeridos:

- Nome do achievement
- Descricao
- Categoria
- Imagem da figurinha ou selo
- Cor ou tema visual
- Ordem de exibicao
- Bloco de ensino relacionado
- Tipo de conquista
- Ativo ou inativo

Categorias possiveis:

- Leitura
- Frequencia
- Participacao
- Memorizacao
- Conclusao de modulo
- Eventos especiais
- Comportamento exemplar

Exemplos praticos:

- Genesis concluido
- Exodo concluido
- Levitico concluido
- Numeros concluido
- Deuteronomio concluido
- Pentateuco completo
- Primeiro mes completo
- Presenca perfeita no mes
- Desafio de memorizacao concluido

Regras recomendadas:

- Somente superadmin cria catalogo global inicialmente
- Diretor pode apenas visualizar e usar
- Professor usa achievements existentes para conceder aos alunos
- No futuro, pode haver achievements locais criados por diretores

## Concessao de achievements

Fluxo principal:

1. Professor abre a lista de alunos da classe
2. Seleciona um aluno
3. Visualiza achievements disponiveis
4. Marca um ou mais achievements
5. Confirma a acao
6. Sistema salva quem concedeu, quando e para quem
7. Album do aluno e atualizado

Funcionalidades necessarias:

- Conceder achievement individual
- Conceder em lote para varios alunos
- Remover achievement concedido por engano, com historico
- Ver historico de concessoes
- Filtrar achievements por categoria ou modulo

Dados registrados por concessao:

- Aluno
- Achievement
- Concedido por
- Perfil de quem concedeu
- Data e hora
- Origem da concessao
- Status
- Observacao opcional

## Album do aluno

O album e a interface de valor percebido.

Objetivo:

- Mostrar o que ja conquistou
- Mostrar o que falta conquistar
- Mostrar a jornada
- Mostrar progresso acumulado

Formatos possiveis:

### Album por colecao

Exemplos:

- Velho Testamento
- Novo Testamento
- Presenca
- Desafios especiais

### Album por trilha

Exemplos:

- Trilha da leitura
- Trilha da participacao
- Trilha da memorizacao

Elementos visuais importantes:

- Espacos vazios para conquistas nao obtidas
- Conquistas coloridas para as obtidas
- Progresso percentual por colecao
- Ordem logica de progressao
- Identidade visual clara

Dados exibidos no album:

- Quantidade total de achievements possiveis
- Quantidade recebida
- Percentual de conclusao
- Ultimos achievements recebidos
- Colecoes completas

## Compartilhamento social

O sistema deve permitir que o aluno transforme cada conquista em algo compartilhavel, bonito e simples de publicar.

Impactos:

- Engajamento do aluno
- Orgulho pela conquista
- Divulgacao organica do seminario
- Valor percebido do sistema
- Desejo de continuar completando o album

### Canais alvo

- WhatsApp
- Instagram
- Facebook
- X
- Outras plataformas com link ou imagem

### Formas recomendadas de compartilhamento

#### 1. Imagem pronta

O sistema gera um card visual com:

- Nome do aluno
- Nome do achievement
- Imagem da figurinha ou selo
- Colecao correspondente
- Mensagem curta de comemoracao
- Identidade visual do seminario

Esse formato e o mais importante para MVP social.

#### 2. Link publico controlado

O sistema gera um link publico da conquista com:

- Nome do aluno
- Achievement conquistado
- Imagem
- Mensagem de celebracao
- Possivel contexto da colecao

#### 3. Compartilhamento combinado

Idealmente oferecer:

- Baixar imagem
- Compartilhar link

### Regras de produto para compartilhamento

- O aluno compartilha apenas os proprios achievements
- Compartilhamento social e centrado no aluno
- Deve existir controle administrativo para ativar ou desativar compartilhamento publico
- O sistema deve permitir ocultar dados sensiveis
- O compartilhamento nunca deve expor dados de classe, e-mail ou informacoes privadas

### Dados visiveis no compartilhamento

Recomendacao inicial:

- Primeiro nome do aluno ou nome configuravel
- Nome do achievement
- Imagem da conquista
- Colecao
- Mensagem comemorativa

Dados que nao devem aparecer por padrao:

- E-mail
- Nome completo obrigatorio
- Classe
- Professor
- Diretor
- Dados internos do sistema
- Historico completo do aluno

### MVP de compartilhamento

Prioridades:

1. Gerar imagem bonita do achievement
2. Baixar imagem
3. Compartilhar via WhatsApp
4. Copiar link publico

### Fase posterior

- Facebook e X com fluxo refinado
- Templates visuais diferentes
- Escolha de mensagem personalizada
- Compartilhamento de colecao completa
- Compartilhamento de progresso do album

### Regras tecnicas e de privacidade

- Links publicos devem ser dificeis de adivinhar
- Deve existir opcao de desativar link publico
- Se o achievement for removido, o link deve deixar de exibir a conquista
- Toda geracao de link deve ser auditavel
