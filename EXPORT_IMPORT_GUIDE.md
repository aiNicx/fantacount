# Guida Export/Import Asta Fantacalcio

## Nuove Funzionalità Implementate

### 🔄 Export Asta in Excel

Il nuovo bottone **📊** nell'header permette di esportare l'asta corrente in un file Excel completo.

#### Cosa viene esportato:
- **Foglio "Riepilogo Asta"**: Statistiche generali, conteggi per ruolo
- **Foglio "Partecipanti"**: Budget rimanente, numero giocatori, dettaglio rose complete
- **Foglio "Giocatori"**: Lista completa con status di acquisto
- **Foglio "Dati Importazione"**: Dati strutturati per re-importazione

#### Come utilizzare:
1. Durante l'asta, clicca sul bottone **📊** nell'header
2. Il file Excel viene scaricato automaticamente
3. Nome file: `Fantacalcio_Asta_YYYY-MM-DD.xlsx`

### 📂 Import Asta Esistente

Nella sezione setup è possibile importare un'asta precedentemente esportata.

#### Come utilizzare:
1. Nella schermata di configurazione, clicca su "Carica file Excel"
2. Seleziona un file Excel precedentemente esportato dall'app
3. I dati vengono automaticamente caricati:
   - Partecipanti con budget aggiornato
   - Giocatori con assegnazioni
   - Configurazione asta (budget iniziale, ecc.)
4. L'app procede automaticamente alla visualizzazione principale

#### Vantaggi:
- **Continuità**: Riprendi un'asta interrotta
- **Backup**: Sicurezza dei dati con file Excel
- **Condivisione**: Passa l'asta tra dispositivi diversi
- **Storico**: Mantieni uno storico delle aste precedenti

## Struttura File Excel Export

### Foglio "Dati Importazione"
Questo foglio contiene i dati strutturati che permettono la re-importazione:

```
=== CONFIGURAZIONE ASTA ===
PARTICIPANTS_COUNT | 8
INITIAL_BUDGET     | 500
EXPORT_DATE        | 2024-12-19T10:30:00.000Z

=== PARTECIPANTI ===
PARTICIPANT_NAME | CURRENT_BUDGET | PLAYERS_DATA
Mario           | 450            | [{"id":123,"nome":"Osimhen",...}]
Luigi           | 380            | [{"id":456,"nome":"Lukaku",...}]

=== GIOCATORI ===
PLAYER_ID | NOME     | RUOLO | SQUADRA | QT_A | STATUS  | BOUGHT_BY | BOUGHT_PRICE
123       | Osimhen  | A     | Napoli  | 32   | comprato| Mario     | 50
456       | Lukaku   | A     | Roma    | 28   | libero  |           |
```

## Compatibilità

- ✅ **File Export App**: Perfetta compatibilità con re-import
- ❌ **File Excel Quotazioni**: Non compatibile (struttura diversa)
- ✅ **Backup Sicuro**: I dati vengono validati durante l'import

## Flusso di Utilizzo Consigliato

### Scenario 1: Nuova Asta
1. Configura partecipanti e budget
2. Carica file quotazioni standard
3. Procedi con l'asta
4. **Export periodici** per backup

### Scenario 2: Ripresa Asta
1. Carica file Excel asta precedente
2. Conferma i dati importati
3. Continua da dove avevi lasciato

### Scenario 3: Asta Multi-Sessione
1. **Prima sessione**: Setup + Prime assegnazioni + Export
2. **Seconda sessione**: Import + Continua asta + Export
3. **Sessione finale**: Import + Completa asta + Export finale

## Note Tecniche

### Formato Dati
- Encoding: UTF-8
- Formato date: ISO 8601
- Struttura JSON per dati complessi dei giocatori
- Validazione completa durante import

### Sicurezza
- Validazione nomi partecipanti unici
- Controllo coerenza budget e assegnazioni
- Fallback su errori di parsing
- Messaggi di errore dettagliati

### Performance
- Parsing asincrono per file grandi
- Feedback progressivo durante caricamento
- Timeout protection per operazioni lunghe