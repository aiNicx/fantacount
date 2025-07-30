# Istruzioni per lo Sviluppo App Fantacalcio Asta

## Panoramica
App web responsive per gestire l'asta del fantacalcio con caricamento da file Excel.

## Struttura File
```
fantacount/
├── index.html
├── styles.css
├── script.js
├── Quotazioni_Fantacalcio_Stagione_2025_26.xlsx
└── instructions.md
```

## 1. Setup Iniziale

### HTML (index.html)
- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- **Font**: Import Google Fonts per mobile readability
- **Struttura principale**:
  - Header con titolo
  - Sezione setup asta (numero partecipanti, nomi, fantamilioni)
  - Sezione ricerca/ordinamento giocatori
  - Lista giocatori filtrabile
  - Sezione asta in corso
  - Riepilogo rose e fantamilioni

### CSS (styles.css)
- **Mobile-first**: Design responsive con flexbox/grid
- **Breakpoints**: 320px, 768px, 1024px
- **Touch-friendly**: Minimo 44x44px per bottoni
- **Colori**: Verde fantacalcio (#00A651), grigi chiari per background
- **Animazioni**: Transizioni smooth per aggiornamenti real-time

### JavaScript (script.js)
- **Librerie**: SheetJS per Excel, niente altre dipendenze
- **Moduli**:
  - `excelParser.js`: Carica e parsa il file Excel
  - `playerManager.js`: Gestisce lista giocatori e filtri
  - `auctionManager.js`: Gestisce asta e aggiornamenti
  - `uiManager.js`: Gestisce interfaccia e rendering

## 2. Funzionalità Principali

### Setup Asta
1. Input numero partecipanti (2-12)
2. Input nomi partecipanti
3. Input fantamilioni iniziali (default 500)
4. Salvataggio in localStorage

### Lista Giocatori
- **Filtri**: Ruolo (P, D, C, A), squadra, nome
- **Ordinamento**: Alfabetico, quotazione attuale (Qt.A), ruolo, fantavoto medio (FVM)
- **Ricerca**: Input testuale con debounce (nome, squadra)
- **Visualizzazione**: Card responsive per mobile con dettagli completi:
  - Nome e squadra
  - Ruolo specifico (RM)
  - Quotazione attuale (Qt.A)
  - Fantavoto medio (FVM)
  - Stato di acquisto (libero/comprato)

### Asta
- **Selezione**: Tap su giocatore per dettagli
- **Offerta**: Input numerico con validazione
- **Assegnazione**: Seleziona partecipante vincitore
- **Aggiornamento**: Fantamilioni e rosa automatici

### Riepilogo
- **Rose**: Visualizzazione per partecipante
- **Fantamilioni**: Display real-time
- **Statistiche**: Numero giocatori per ruolo

## 3. Gestione Dati

### Struttura Giocatore
```javascript
{
  id: 0,
  nome: "",
  ruolo: "P|D|C|A",
  ruoloSpecifico: "",
  squadra: "",
  quotazioneA: 0,
  quotazioneI: 0,
  diff: 0,
  quotazioneAM: 0,
  quotazioneIM: 0,
  diffM: 0,
  fvm: 0,
  fvmM: 0,
  status: "libero|comprato"
}
```

### Struttura Partecipante
```javascript
{
  nome: "",
  fantamilioni: 500,
  rosa: [playerIds...],
  budget: { P: 3, D: 8, C: 8, A: 6 }
}
```

### LocalStorage
- `fantacalcio_setup`: Configurazione asta
- `fantacalcio_players`: Lista giocatori
- `fantacalcio_auction`: Stato asta corrente

## 4. Excel Parser

### Setup SheetJS
```javascript
// Caricamento file
const workbook = XLSX.read(data, { type: 'binary' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Parsing dati con struttura corretta
const headers = rawData[0];
const players = rawData.slice(1).map(row => ({
  id: row[0],
  nome: row[3],
  ruolo: row[1],
  ruoloSpecifico: row[2],
  squadra: row[4],
  quotazioneA: row[5],
  quotazioneI: row[6],
  diff: row[7],
  quotazioneAM: row[8],
  quotazioneIM: row[9],
  diffM: row[10],
  fvm: row[11],
  fvmM: row[12],
  status: 'libero'
}));
```

### Mappatura Colonne Excel
- **Id**: Identificatore unico giocatore (colonna A)
- **R**: Ruolo principale (P=Portiere, D=Difensore, C=Centrocampista, A=Attaccante) (colonna B)
- **RM**: Ruolo specifico (es. Por, Ter, Cen, Att) (colonna C)
- **Nome**: Nome completo giocatore (colonna D)
- **Squadra**: Squadra di appartenenza (colonna E)
- **Qt.A**: Quotazione attuale (colonna F)
- **Qt.I**: Quotazione iniziale (colonna G)
- **Diff**: Differenza quotazione (colonna H)
- **Qt.A M**: Quotazione attuale Mantra (colonna I)
- **Qt.I M**: Quotazione iniziale Mantra (colonna J)
- **Diff.M**: Differenza quotazione Mantra (colonna K)
- **FVM**: Fantavoto medio (colonna L)
- **FVM M**: Fantavoto medio Mantra (colonna M)

## 5. UI/UX Mobile

### Interazioni Touch
- **Swipe**: Per navigare tra sezioni
- **Long press**: Per azioni contestuali
- **Pull-to-refresh**: Per aggiornare dati

### Performance
- **Lazy loading**: Caricamento progressivo lista
- **Virtual scrolling**: Per liste lunghe
- **Debouncing**: Su input di ricerca

### Accessibilità
- **ARIA labels**: Per screen readers
- **Focus management**: Navigazione tastiera
- **Color contrast**: WCAG 2.1 AA

## 6. Testing

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Device Testing
- iPhone SE (375px)
- iPhone 12 (390px)
- Samsung Galaxy S21 (384px)
- iPad (768px)

## 7. Deploy

### Hosting
- GitHub Pages
- Netlify
- Vercel

### Ottimizzazioni
- Minify CSS/JS
- Compress images
- Enable gzip

## Comandi per Avvio
```bash
# Installa server locale
npm install -g live-server

# Avvia sviluppo
live-server --port=3000
```

## Note Importanti
- Backup automatico ogni 5 minuti
- Reset possibile solo da setup
- Validazione budget per ruolo
- Prevenzione offerte negative