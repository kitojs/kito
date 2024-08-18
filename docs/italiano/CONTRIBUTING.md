<div align="center">

[🇺🇸 English](../../CONTRIBUTING.md) `‖` [🇪🇸 Español](../español/CONTRIBUTING.md) `‖` [🇵🇹 Português](../portugues/CONTRIBUTING.md) `‖` [🇫🇷 Français](../francais/CONTRIBUTING.md) `‖` [🇮🇹 Italiano](../italiano/CONTRIBUTING.md)

<hr />

<img src="../../public/static/banners/kito_banner_it.png" alt="Kito Banner" />

<hr />

</div>

## 🙌🏼 Benvenuto

Benvenuto nella guida di contributo di Kito! Questa guida ti fornirà informazioni importanti da tenere a mente quando contribuisci al progetto.

## 🌸 Come Contribuire

1. **Segnala problemi o bug.**
   Se trovi o riscontri un problema o bug con Kito, puoi segnalarlo aprendo un issue su questo repository con il tag `bug`. Assicurati di descriverlo chiaramente e concisamente, spiegando cosa deve essere risolto e perché pensi che sia un problema valido.

2. **Richiedi nuove funzionalità e miglioramenti.**
   Hai un'idea o un miglioramento in mente? Sentiti libero di condividerlo! Apri un issue su questo repository con il tag `feat`, e verrà esaminato. Fornisci una descrizione dettagliata di ciò che vuoi aggiungere e dei possibili benefici.

3. **Contribuisci con codice.**
   Se desideri contribuire direttamente al codice, segui questi passaggi:

- Effettua un fork del repository.
- Crea un nuovo branch (`git checkout -b feature/nuova-funzionalità`).
- Apporta le modifiche sul tuo branch.
- Esegui il commit delle modifiche (vedi la [Guida ai Commit](#-guida-ai-commit)).
- Esegui il push del branch (`git push origin feature/nuova-funzionalità`).
- Apri una Pull Request dettagliando le modifiche apportate.

## 📕 Guida ai Commit

Per mantenere una cronologia dei commit ben organizzata e chiara, si consiglia di seguire queste linee guida durante la scrittura dei commit. Le linee guida descritte migliorano la qualità dei contributi e possono aumentare la rilevanza delle revisioni.

#### Convenzione

Segui la convenzione [Conventional Commits](https://conventionalcommits.org). L'uso di emoji è consigliato ma non obbligatorio.

#### Lunghezza

La prima riga non deve superare i 50 caratteri e deve essere breve, ma sufficientemente descrittiva per capire la modifica apportata.

Dopo la prima riga, aggiungi una riga vuota e, se necessario, includi una descrizione più dettagliata in un paragrafo che non superi i 72 caratteri per riga.

Nella descrizione estesa, includi il "perché" e il "come", non solo il "cosa".

**Esempio:**

`✨ feat(user-auth): Aggiunta autenticazione basata su JWT`

Implementato un meccanismo di autenticazione basato su JWT per gli utenti. Questo sostituisce il precedente approccio basato su sessioni, migliorando la scalabilità e la sicurezza in ambienti distribuiti. Sono stati aggiornati i test e la documentazione di conseguenza.

#### Focus

Ogni commit dovrebbe concentrarsi su un singolo compito o scopo. Evita di apportare troppi cambiamenti in un solo commit e non mescolare modifiche di ambiti o tipi diversi.

**Esempio:**

_Commit 1:_ `📦 build(deps): Aggiorna dipendenza X alla versione Y.`

_Commit 2:_ `✨ feat(user-auth): Aggiungi funzionalità di recupero password.`

#### Documentazione

Se il tuo commit modifica anche la documentazione (ad esempio, aggiungendo una funzionalità), includi le modifiche alla documentazione nello stesso commit. Questo aiuta a mantenere coerenza tra il commit e la documentazione del progetto.

#### Commits WIP

I commit WIP (Work in Progress - Lavoro in corso) sono per cambiamenti che sono ancora in fase di sviluppo e non sono pronti per essere integrati nel branch principale. Invece di eseguire commit WIP che potrebbero interrompere il flusso di lavoro, puoi utilizzare `git stash` per mantenerli in uno stato temporaneo senza eseguirne il commit nella cronologia.

#### Riferimenti

Ogni volta che un commit è correlato a un issue o ticket, includi un riferimento ad esso nel messaggio del commit. Questo aiuta a mantenere una cronologia chiara e facilita il monitoraggio dei problemi.

**Esempio:**

```
✨ feat(user-auth): Aggiungi funzionalità di recupero password

Chiude #123
```

#### Squash

Il termine "squash" si riferisce a un metodo per combinare i commit. Quando hai più di un commit per lo stesso scopo, usa questo metodo per ridurre il numero di commit e migliorare la leggibilità.

Usa `git rebase -i` per fare squash dei commit.

💡 **Suggerimento aggiuntivo:** Quando hai bisogno di correggere qualcosa in un commit recente (e prima di fare push), usa il formato `fixup!` per indicare che stai correggendo o aggiustando un commit precedente. Questi commit sono utili prima di eseguire uno squash.

## 👷 Guida alla Pull Request

Assicurati che la tua Pull Request soddisfi i seguenti requisiti:

- **Descrizione chiara:** Spiega lo scopo del tuo contributo e come migliora il progetto.

- **Documentazione aggiornata:** Se aggiungi nuove funzionalità, aggiorna la documentazione di conseguenza.

- **Test inclusi:** Se apporti modifiche significative al codice, assicurati di aggiungere test per verificare la funzionalità.

Dopo aver aperto una Pull Request, altri collaboratori potranno rivedere il tuo codice e suggerire modifiche prima che venga accettato.

## 🚧 Test

È fondamentale assicurarsi che tutte le modifiche superino i test attuali del progetto. Se le tue modifiche sono significative, dovresti scrivere i tuoi test per la funzionalità che stai implementando.

## 🎩 Standard

È essenziale seguire gli standard di Kito. Questo include la formattazione dei messaggi di commit, la formattazione del codice, la struttura delle cartelle, la documentazione, i test e tutti gli altri aspetti del progetto.

Sii coerente con lo stile definito e segui le migliori pratiche.

## 🎉 Grazie!

Grazie per aver letto e speriamo che questa guida ti aiuti a iniziare a contribuire!
