<div align="center">

[🇺🇸 English](./CONTRIBUTING.md) `‖` [🇪🇸 Español](./CONTRIBUTING_ES.md) `‖` [🇵🇹 Português](./CONTRIBUTING_PT.md) `‖` [🇫🇷 Français](./CONTRIBUTING_FR.md) `‖` [🇮🇹 Italiano](./CONTRIBUTING_IT.md)

<hr />

<img src="./public/static/kito_banner_pt.png" alt="Kito Banner" />

<hr />

</div>

## 🙌🏼 Bem-vindo

Bem-vindo ao guia de contribuição do Kito! Este guia fornecerá informações importantes para ter em mente ao contribuir com o projeto.

## 🌸 Como Contribuir

1. **Reporte problemas ou bugs.**  
   Se encontrar ou experimentar um problema ou bug com o Kito, você pode relatá-lo abrindo uma issue neste repositório com a tag `bug`. Certifique-se de descrevê-lo de forma clara e concisa, explicando o que precisa ser resolvido e por que você acredita que é um problema válido.

2. **Solicite novas funcionalidades e melhorias.**  
   Tem uma ideia ou melhoria em mente? Fique à vontade para compartilhá-la! Abra uma issue neste repositório com a tag `feat`, e ela será revisada. Forneça uma descrição detalhada do que você quer adicionar e os benefícios potenciais.

3. **Contribua com código.**  
   Se você deseja contribuir diretamente com o código, siga estas etapas:

- Faça um fork do repositório.
- Crie uma nova branch (`git checkout -b feature/nova-funcionalidade`).
- Faça suas alterações na sua branch.
- Faça o commit das suas alterações (consulte o [Guia de Commits](#-guia-de-commits)).
- Faça o push da sua branch (`git push origin feature/nova-funcionalidade`).
- Abra um Pull Request detalhando as alterações que você fez.

## 📕 Guia de Commits

Para manter um histórico de commits bem organizado e claro, recomenda-se seguir estas diretrizes ao escrever commits. As diretrizes descritas melhoram a qualidade das contribuições e podem aumentar a relevância da revisão.

#### Convenção

Siga a convenção [Conventional Commits](https://conventionalcommits.org). O uso de emojis é recomendado, mas não obrigatório.

#### Comprimento

- A primeira linha não deve exceder 50 caracteres e deve ser breve, mas descritiva o suficiente para entender a mudança realizada.

- Após a primeira linha, adicione uma linha em branco e, se necessário, inclua uma descrição mais detalhada em um parágrafo que não exceda 72 caracteres por linha.

- Na descrição estendida, inclua o "porquê" e o "como", não apenas o "o quê".

**Exemplo:**

✨ feat(user-auth): Adicionar autenticação baseada em JWT

Implementado um mecanismo de autenticação baseado em JWT para usuários. Isso substitui a abordagem anterior baseada em sessões, melhorando a escalabilidade e segurança em ambientes distribuídos. Testes e documentação foram atualizados de acordo.

#### Foco

Cada commit deve focar em uma única tarefa ou propósito. Evite fazer muitas alterações em um único commit e não misture modificações de diferentes escopos ou tipos.

**Exemplo:**

_Commit 1:_ `📦 build(deps): Atualizar dependência X para a versão Y.`

_Commit 2:_ `✨ feat(user-auth): Adicionar funcionalidade de recuperação de senha.`

#### Documentação

Se o seu commit também modificar a documentação (por exemplo, adicionando um recurso), inclua as alterações de documentação no mesmo commit. Isso ajuda a manter a coerência entre o commit e a documentação do projeto.

#### Commits WIP

Commits WIP (Work in Progress - Trabalho em Progresso) são para mudanças que ainda estão em desenvolvimento e não estão prontas para serem mescladas na branch principal. Em vez de fazer commits WIP e interromper o fluxo de trabalho, você pode usar `git stash` para mantê-las em um estado temporário sem fazer commit na história.

#### Referências

Sempre que um commit estiver relacionado a uma issue ou ticket, inclua uma referência a ela na mensagem do commit. Isso ajuda a manter um histórico claro e facilita o rastreamento de issues.

**Exemplo:**

```
✨ feat(user-auth): Adicionar funcionalidade de recuperação de senha

Fecha #123
```

#### Squash

O termo "squash" refere-se a um método de combinar commits. Quando você tiver mais de um commit para o mesmo propósito, use este método para reduzir o número de commits e melhorar a legibilidade.

Use `git rebase -i` para fazer squash dos commits.

💡 **Dica adicional:** Quando você precisar corrigir algo em um commit recente (e antes de fazer o push), use o formato `fixup!` para indicar que você está corrigindo ou ajustando um commit anterior. Esses commits são úteis antes de fazer um squash.

## 👷 Guia de Pull Request

Por favor, certifique-se de que seu Pull Request atenda aos seguintes requisitos:

- **Descrição clara:** Explique o propósito de sua contribuição e como ela melhora o projeto.
- **Documentação atualizada:** Se você adicionar novas funcionalidades, atualize a documentação de acordo.
- **Testes incluídos:** Se você fizer mudanças significativas no código, certifique-se de adicionar testes para verificar a funcionalidade.

Após abrir um Pull Request, outros colaboradores podem revisar seu código e sugerir mudanças antes que ele seja aceito.

## 🚧 Testes

É crucial garantir que todas as mudanças passem pelos testes atuais do projeto. Se suas modificações forem significativas, você deve escrever seus próprios testes para a funcionalidade que está implementando.

## 🎩 Padrões

É essencial seguir os padrões do Kito. Isso inclui o formato das mensagens de commit, formatação do código, estrutura de pastas, documentação, testes e todos os outros aspectos do projeto.

Seja consistente com o estilo definido e siga as melhores práticas.

## 🎉 Obrigado!

Obrigado por ler e esperamos que este guia ajude você a começar a contribuir!
