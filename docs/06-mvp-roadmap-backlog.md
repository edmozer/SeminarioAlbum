# MVP, Roadmap e Backlog

## MVP recomendado

Objetivo: entregar a menor versao que ja opere classes reais com valor concreto.

Escopo ideal do MVP:

- Autenticacao por convite
- Login
- Perfis por permissao
- Cadastro de diretores por superadmin
- Cadastro de professores por diretor
- Cadastro de alunos por professor
- Criacao de classes
- Catalogo basico de achievements
- Concessao individual de achievements
- Album simples do aluno
- Historico basico de concessoes

Versao MVP expandida recomendada:

### Acesso e convites

- Login
- Aceite de convite
- Criacao de senha
- Recuperacao de senha
- Convites por papel
- Reenvio e cancelamento de convites

### Estrutura de usuarios

- Superadmin
- Diretor
- Professor
- Aluno

### Gestao basica

- Criacao de classes
- Vinculo de professor a classe
- Convite de aluno pelo professor
- Listagem de alunos por classe
- Edicao basica de aluno

### Achievements

- Catalogo basico de achievements
- Categoria e colecao
- Concessao individual
- Concessao em lote simples
- Remocao manual com auditoria

### Album

- Visualizacao do album do aluno
- Visualizacao de conquistas recebidas
- Visualizacao de progresso por colecao

### Compartilhamento

- Gerar card visual
- Baixar imagem
- Copiar link publico
- Compartilhar por WhatsApp
- Revogar link publico ao remover a conquista

### Auditoria

- Logs minimos de convite, concessao, remocao e mudanca de vinculo

### Dashboards minimos

- Dashboard de professor
- Dashboard de diretor
- Dashboard basico do superadmin

## Fora do MVP

- Integracoes profundas com redes sociais
- Templates avancados de compartilhamento
- Automacao de achievements por regras
- Ranking gamificado
- App mobile nativo
- Notificacoes push
- Conquistas automaticas por presenca
- Multiplas organizacoes complexas, se o primeiro cliente for unico

## Roadmap recomendado por fases

### Fase 1. Fundacao do sistema

Objetivo: deixar a base funcional e segura.

Entregas:

- Estrutura de permissoes
- Convites
- Cadastro de usuarios
- Gestao de classes
- Catalogo de achievements
- Concessao manual
- Album do aluno

### Fase 2. Eficiencia operacional

Objetivo: reduzir esforco dos professores e diretores.

Entregas:

- Concessao em lote
- Filtros avancados
- Dashboard do professor
- Dashboard do diretor
- Historico completo
- Correcoes administrativas mais robustas

### Fase 3. Engajamento e escala

Objetivo: aumentar uso, retencao e valor percebido.

Entregas:

- Notificacoes
- Conquistas automaticas
- Colecoes especiais
- Series e marcos de constancia
- Versao mobile
- Exportacoes

## Epicos sugeridos para backlog

1. Autenticacao e convites
2. Gestao de usuarios e permissoes
3. Gestao de classes
4. Catalogo de achievements
5. Concessao de achievements
6. Album do aluno
7. Dashboards e relatorios
8. Auditoria e administracao global

## Backlog estrutural por epicos

### Epico 1. Autenticacao e convite

Historias principais:

- Como usuario convidado, quero aceitar um convite para criar minha conta.
- Como usuario, quero fazer login com e-mail e senha.
- Como administrador, quero reenviar convites pendentes.
- Como administrador, quero cancelar convites indevidos.
- Como usuario, quero redefinir minha senha.

### Epico 2. Papeis e permissoes

- Como superadmin, quero gerenciar papeis e acessos.
- Como diretor, quero operar somente dentro do meu escopo.
- Como professor, quero acessar somente minhas classes e alunos.
- Como aluno, quero ver apenas meus dados.

### Epico 3. Gestao de usuarios

- Como superadmin, quero convidar diretores.
- Como diretor, quero convidar professores.
- Como professor, quero convidar alunos.
- Como gestor, quero editar dados basicos de usuarios do meu escopo.
- Como gestor, quero ativar e desativar usuarios.

### Epico 4. Estrutura organizacional e classes

- Como gestor, quero criar classes.
- Como gestor, quero vincular professor a uma classe.
- Como professor, quero ver os alunos da minha classe.
- Como gestor, quero transferir aluno entre classes.
- Como diretor, quero visualizar todas as classes do meu escopo.

### Epico 5. Catalogo de achievements

- Como superadmin, quero cadastrar achievements.
- Como superadmin, quero agrupar achievements em colecoes.
- Como superadmin, quero definir se um achievement e repetivel.
- Como gestor, quero visualizar catalogo ativo para concessao.

### Epico 6. Concessao de achievements

- Como professor, quero conceder um achievement a um aluno.
- Como diretor, quero conceder achievement a alunos do meu escopo.
- Como gestor, quero remover uma concessao feita por engano.
- Como professor, quero conceder achievements em lote para minha turma.
- Como gestor, quero consultar historico de concessoes.

### Epico 7. Album do aluno

- Como aluno, quero ver meu album.
- Como aluno, quero ver o que ja conquistei e o que falta.
- Como professor, quero acompanhar o album dos meus alunos.
- Como diretor, quero ver o progresso dos alunos sob meu escopo.

### Epico 8. Compartilhamento social

- Como aluno, quero gerar uma imagem do meu achievement.
- Como aluno, quero baixar essa imagem.
- Como aluno, quero compartilhar essa conquista por WhatsApp.
- Como aluno, quero copiar um link publico da conquista.
- Como administrador, quero controlar se o compartilhamento publico esta ativo.
- Como sistema, quero invalidar o compartilhamento quando a concessao for removida.

### Epico 9. Relatorios e dashboards

- Como professor, quero ver o progresso da minha turma.
- Como diretor, quero ver status de professores, classes e convites.
- Como superadmin, quero acompanhar uso global do sistema.
- Como gestor, quero filtrar relatorios por periodo.

### Epico 10. Auditoria e governanca

- Como administrador, quero consultar logs de acoes criticas.
- Como sistema, quero registrar concessoes e remocoes.
- Como sistema, quero registrar convites enviados e aceitos.
- Como sistema, quero registrar revogacao de compartilhamentos publicos.

## Ordem recomendada de execucao

### Fase 1. Fundacao

- Autenticacao
- Aceite de convite
- Papeis e permissoes
- Gestao basica de usuarios
- Criacao de classes
- Listagem de alunos por classe

### Fase 2. Nucleo do produto

- Catalogo de achievements
- Concessao individual
- Concessao em lote simples
- Album do aluno
- Historico de concessoes

### Fase 3. Diferencial principal

- Geracao de card visual
- Link publico de compartilhamento
- Baixar imagem
- Compartilhamento via WhatsApp
- Revogacao de compartilhamento

### Fase 4. Gestao e escala

- Dashboards
- Relatorios
- Auditoria mais robusta
- Filtros avancados
- Transferencia de alunos entre classes

## Perguntas em aberto para fechar a definicao

- Os alunos terao login individual desde o MVP?
- Os achievements serao sempre concedidos manualmente?
- Vai existir apenas uma organizacao ou varias?
- O diretor gerencia uma escola, uma unidade ou uma regiao?
- O professor pode mudar um aluno de classe?
- Achievements terao imagem customizada ja no MVP?
- O album sera publico para o professor e privado para o aluno?
- Sera necessario historico de presenca futuramente?

## Uso recomendado deste arquivo

- Use este arquivo para planejamento, priorizacao e refinamento.
- Quando uma duvida de escopo surgir, registre aqui antes de atualizar os outros arquivos.
- Depois que as respostas abertas forem decididas, propague a decisao para regras, dados e rotas.
