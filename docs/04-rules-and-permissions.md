# Regras de Negocio, Permissoes e Auditoria

## Regras de negocio que precisam ficar claras cedo

### Um aluno pode pertencer a mais de uma classe?

Sugestao inicial: nao no MVP. Manter uma unica classe reduz complexidade.

### Um professor pode ter mais de uma classe?

Sugestao: sim. Isso e util e aumenta pouco a complexidade.

### Achievements podem ser concedidos mais de uma vez?

Sugestao: depende do tipo. Leitura geralmente nao; eventos ou participacao talvez sim. Melhor ter regra por achievement.

### Quem pode remover uma conquista concedida por engano?

Sugestao: professor que concedeu, diretor da area e superadmin. Sempre com auditoria.

### Convites podem expirar?

Sugestao: sim, por exemplo em 7 dias.

### Usuario pode existir sem aceitar convite ainda?

Sim. Fica em estado pendente.

## Permissoes detalhadas por perfil

### Superadmin

Pode ver tudo, editar tudo, convidar qualquer perfil, criar achievements, mover usuarios entre estruturas, desativar qualquer usuario e acessar relatorios globais.

### Diretor

Pode ver professores sob sua gestao, convidar professores, editar professores sob sua gestao, ver classes da sua area, ver e editar alunos da sua area e conceder achievements aos alunos da sua area.

Nao pode criar superadmins nem alterar regras globais.

### Professor

Pode ver somente suas classes, convidar alunos, editar alunos da propria classe, conceder achievements aos proprios alunos e ver o album de seus alunos.

Nao pode ver professores de outras classes nem criar achievements globais.

### Aluno

Pode ver somente seu proprio album e perfil.

Nao pode editar estrutura nem conceder achievements.

## Regras formais do sistema

### Acesso e convites

- RN001. Todo usuario entra apenas por convite.
- RN002. Convite possui token unico, expiracao e papel definido.
- RN003. Convite aceito nao pode ser reutilizado.
- RN004. Usuario desativado nao pode acessar.
- RN005. Todas as acoes respeitam escopo por papel.

### Hierarquia

- RN006. Superadmin pode convidar qualquer perfil.
- RN007. Diretor pode convidar professores e alunos dentro do seu escopo.
- RN008. Professor pode convidar apenas alunos vinculados a sua classe.
- RN009. Aluno nao pode convidar ninguem.
- RN010. Diretor nao pode criar superadmin.

### Classes

- RN011. Toda classe deve possuir ao menos um professor responsavel.
- RN012. Todo aluno ativo deve estar vinculado a uma classe ativa.
- RN013. Um professor pode ter uma ou mais classes.
- RN014. No MVP, um aluno pertence a apenas uma classe ativa por vez.
- RN015. Transferencia de aluno entre classes deve gerar auditoria.

### Achievements

- RN016. Achievements devem ser previamente cadastrados no catalogo.
- RN017. Somente usuarios autorizados podem conceder achievements.
- RN018. Professor so pode conceder achievements aos proprios alunos.
- RN019. Diretor pode conceder achievements a qualquer aluno do seu escopo.
- RN020. Superadmin pode conceder achievements a qualquer aluno.
- RN021. Achievement nao repetivel nao pode ser concedido duas vezes ao mesmo aluno.
- RN022. Achievement repetivel pode ter multiplas concessoes, conforme configuracao.
- RN023. Remocao de achievement concedido deve gerar registro de auditoria.
- RN024. Achievement inativo nao pode ser concedido novamente, mas pode continuar visivel no historico.

### Album

- RN025. O aluno visualiza apenas o proprio album.
- RN026. Professor visualiza o album dos alunos de sua classe.
- RN027. Diretor visualiza o album dos alunos do seu escopo.
- RN028. Conquistas removidas nao devem contar no progresso atual.
- RN029. A ordem de exibicao do album deve respeitar colecao e ordenacao do catalogo.

### Compartilhamento social

- RN030. O aluno pode compartilhar apenas achievements que ja recebeu.
- RN031. O compartilhamento deve expor apenas dados permitidos.
- RN032. O sistema nao deve exibir e-mail, classe ou dados internos no card publico.
- RN033. O link publico deve ser unico e dificil de adivinhar.
- RN034. O link publico pode ser desativado por regra administrativa.
- RN035. Se a concessao for removida, o compartilhamento publico deve ser invalidado.
- RN036. O compartilhamento deve respeitar configuracoes de privacidade da organizacao.

### Convites

- RN037. Convites devem expirar automaticamente apos o periodo configurado.
- RN038. Convites cancelados nao podem ser aceitos.
- RN039. Convites expirados podem ser reenviados com novo token.
- RN040. O aceite do convite deve vincular o usuario ao papel e estrutura definidos na origem.

### Auditoria

- RN041. Toda concessao deve registrar quem concedeu, quando e para quem.
- RN042. Toda remocao deve registrar responsavel e motivo opcional.
- RN043. Toda mudanca de vinculo organizacional deve ser auditada.
- RN044. Toda geracao de link publico de compartilhamento deve ser auditada.

## Historico e auditoria

O que registrar:

- Quem convidou quem
- Quando o convite foi enviado
- Quando foi aceito
- Quem concedeu um achievement
- Quando concedeu
- Quem removeu ou corrigiu um achievement
- Mudancas de vinculo entre professor, aluno e classe
- Ativacao e desativacao de contas

Beneficios:

- Evita confusao
- Permite suporte confiavel
- Garante rastreabilidade
- Ajuda a resolver disputas ou erros
