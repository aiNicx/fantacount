# Fantacalcio Asta 2025-26

Un'applicazione web responsive per gestire aste di fantacalcio con caricamento dati da file Excel.

## Caratteristiche

- **Interfaccia Mobile-First**: Design ottimizzato per smartphone e tablet
- **Caricamento Excel**: Importa quotazioni giocatori da file .xlsx
- **Gestione Partecipanti**: Configura numero partecipanti e budget iniziale
- **Filtri e Ricerca**: Filtra giocatori per ruolo, squadra, nome
- **Asta in Tempo Reale**: Registra offerte e aggiorna budget partecipanti
- **Salvataggio Automatico**: Tutti i dati vengono salvati nel browser
- **Reset Completo**: Possibilità di resettare l'asta

## Come Iniziare

1. **Apri il file `index.html`** in qualsiasi browser moderno
2. **Configura l'asta**:
   - Seleziona il numero di partecipanti
   - Inserisci i nomi dei partecipanti
   - Imposta il budget iniziale (default: 500 FM)
3. **Carica le quotazioni**:
   - Clicca su "Seleziona file Excel"
   - Carica il file `Quotazioni_Fantacalcio_Stagione_2025_26.xlsx`
4. **Inizia l'asta**:
   - Cerca giocatori per nome, ruolo o squadra
   - Clicca su un giocatore per fare un'offerta
   - Inserisci l'importo e conferma l'acquisto

## Requisiti File Excel

Il file Excel deve contenere le seguenti colonne:
- **Id**: Identificativo numerico
- **Nome**: Nome del giocatore
- **Ruolo**: P (Portiere), D (Difensore), C (Centrocampista), A (Attaccante)
- **Squadra**: Squadra di appartenenza
- **Qt. A**: Quotazione attuale
- **FVM**: Fantavoto medio

## Struttura Progetto

```
├── index.html          # File principale HTML
├── styles.css          # Stili CSS responsive
├── js/
│   ├── app.js          # Coordinatore principale
│   ├── dataManager.js  # Gestione dati e localStorage
│   ├── excelParser.js  # Parser file Excel
│   ├── uiManager.js    # Gestione interfaccia
│   └── auctionManager.js # Gestione aste
├── instructions.md     # Istruzioni dettagliate
└── README.md          # Questo file
```

## Utilizzo da Mobile

L'app è completamente responsive e ottimizzata per dispositivi mobile:
- Touch-friendly interface
- Design a schermo intero
- Scroll fluido
- Feedback aptico (vibrazione) all'acquisto

## Salvataggio Dati

Tutti i dati vengono salvati automaticamente nel browser tramite localStorage. Per:
- **Esportare dati**: Usa la funzione export nel browser console
- **Resettare**: Clicca sul bottone 🔄 in alto a destra
- **Backup**: I dati persistono tra sessioni

## Browser Supportati

- Chrome (consigliato)
- Firefox
- Safari
- Edge

## Risoluzione Problemi

**File Excel non caricato**: Verifica che il file sia in formato .xlsx
**Dati non salvati**: Controlla che il browser supporti localStorage
**Interfaccia lenta**: Prova a chiudere altre schede del browser

## Sviluppo

Per modifiche o personalizzazioni:
1. I file JavaScript sono modulari e separati per funzionalità
2. Usa CSS custom properties per personalizzare i colori
3. Tutte le funzioni principali sono documentate nei file

## Licenza

Progetto open source per uso personale e non commerciale.