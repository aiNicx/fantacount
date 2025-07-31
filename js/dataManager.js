export class DataManager {
    constructor() {
        this.participants = [];
        this.players = [];
        this.initialBudget = 500;
        this.storageKey = 'fantasyAuctionData';
    }

    setParticipants(participants) {
        this.participants = participants;
    }

    setPlayers(players) {
        this.players = players.map(player => ({
            ...player,
            status: 'libero',
            boughtBy: null,
            boughtPrice: null
        }));
    }

    setInitialBudget(budget) {
        this.initialBudget = budget;
    }

    getParticipants() {
        return this.participants;
    }

    getPlayers() {
        return this.players;
    }

    getAvailablePlayers() {
        return this.players.filter(player => player.status === 'libero');
    }

    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }

    getParticipantByName(name) {
        return this.participants.find(participant => participant.name === name);
    }

    buyPlayer(playerId, participantName, price) {
        const player = this.getPlayerById(playerId);
        const participant = this.getParticipantByName(participantName);

        if (!player || !participant) return false;

        if (player.status === 'comprato') return false;
        if (participant.budget < price) return false;

        player.status = 'comprato';
        player.boughtBy = participantName;
        player.boughtPrice = price;

        participant.budget -= price;
        participant.players.push({
            ...player,
            boughtPrice: price
        });

        return true;
    }

    getParticipantRoster(participantName) {
        return this.players.filter(player => player.boughtBy === participantName);
    }

    updatePlayerPrice(playerId, participantName, newPrice) {
        const player = this.getPlayerById(playerId);
        const participant = this.getParticipantByName(participantName);

        if (!player || !participant) return false;
        if (player.status !== 'comprato' || player.boughtBy !== participantName) return false;

        const oldPrice = player.boughtPrice;
        const priceDifference = newPrice - oldPrice;

        // Check if participant has enough budget for price increase
        if (participant.budget < priceDifference) return false;

        // Update player price in main players array
        player.boughtPrice = newPrice;

        // Update participant budget
        participant.budget -= priceDifference;

        // Update player in participant's roster
        const playerInRoster = participant.players.find(p => p.id === playerId);
        if (playerInRoster) {
            playerInRoster.boughtPrice = newPrice;
        }

        return true;
    }

    removePlayerFromParticipant(playerId, participantName) {
        const player = this.getPlayerById(playerId);
        const participant = this.getParticipantByName(participantName);

        if (!player || !participant) return false;
        if (player.status !== 'comprato' || player.boughtBy !== participantName) return false;

        // Reset player status
        player.status = 'libero';
        player.boughtBy = null;
        const refundAmount = player.boughtPrice;
        player.boughtPrice = null;

        // Refund budget to participant
        participant.budget += refundAmount;

        // Remove player from participant's roster
        participant.players = participant.players.filter(p => p.id !== playerId);

        return true;
    }

    getPlayerStats() {
        const totalPlayers = this.players.length;
        const boughtPlayers = this.players.filter(p => p.status === 'comprato').length;
        const availablePlayers = totalPlayers - boughtPlayers;

        const roleStats = {
            P: { total: 0, bought: 0 },
            D: { total: 0, bought: 0 },
            C: { total: 0, bought: 0 },
            A: { total: 0, bought: 0 }
        };

        this.players.forEach(player => {
            const role = player.ruolo;
            if (roleStats[role]) {
                roleStats[role].total++;
                if (player.status === 'comprato') {
                    roleStats[role].bought++;
                }
            }
        });

        return {
            total: totalPlayers,
            bought: boughtPlayers,
            available: availablePlayers,
            roles: roleStats
        };
    }

    saveToStorage() {
        const data = {
            participants: this.participants,
            players: this.players,
            initialBudget: this.initialBudget,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.participants = data.participants || [];
                this.players = data.players || [];
                this.initialBudget = data.initialBudget || 500;
                return data;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return null;
    }

    clearAll() {
        this.participants = [];
        this.players = [];
        this.initialBudget = 500;
        
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    exportData() {
        const data = {
            participants: this.participants,
            players: this.players,
            stats: this.getPlayerStats(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fantasy-auction-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportToExcel() {
        try {
            const workbook = XLSX.utils.book_new();
            
            // Foglio 1: Riepilogo Asta
            const summaryData = this.createSummarySheet();
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Riepilogo Asta");
            
            // Foglio 2: Partecipanti e Rose
            const participantsData = this.createParticipantsSheet();
            const participantsSheet = XLSX.utils.aoa_to_sheet(participantsData);
            XLSX.utils.book_append_sheet(workbook, participantsSheet, "Partecipanti");
            
            // Foglio 3: Tutti i Giocatori
            const playersData = this.createPlayersSheet();
            const playersSheet = XLSX.utils.aoa_to_sheet(playersData);
            XLSX.utils.book_append_sheet(workbook, playersSheet, "Giocatori");
            
            // Foglio 4: Dati per Importazione
            const importData = this.createImportSheet();
            const importSheet = XLSX.utils.aoa_to_sheet(importData);
            XLSX.utils.book_append_sheet(workbook, importSheet, "Dati Importazione");
            
            // Genera e scarica il file
            const fileName = `Fantacalcio_Asta_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            return true;
        } catch (error) {
            console.error('Errore nell\'export Excel:', error);
            return false;
        }
    }

    createSummarySheet() {
        const stats = this.getPlayerStats();
        const data = [
            ['RIEPILOGO ASTA FANTACALCIO'],
            ['Data Export:', new Date().toLocaleDateString('it-IT')],
            [''],
            ['STATISTICHE GENERALI'],
            ['Partecipanti:', this.participants.length],
            ['Budget Iniziale:', this.initialBudget + ' FM'],
            ['Giocatori Totali:', stats.total],
            ['Giocatori Acquistati:', stats.bought],
            ['Giocatori Disponibili:', stats.available],
            [''],
            ['GIOCATORI PER RUOLO'],
            ['Ruolo', 'Totali', 'Acquistati', 'Disponibili'],
            ['Portieri', stats.roles.P.total, stats.roles.P.bought, stats.roles.P.total - stats.roles.P.bought],
            ['Difensori', stats.roles.D.total, stats.roles.D.bought, stats.roles.D.total - stats.roles.D.bought],
            ['Centrocampisti', stats.roles.C.total, stats.roles.C.bought, stats.roles.C.total - stats.roles.C.bought],
            ['Attaccanti', stats.roles.A.total, stats.roles.A.bought, stats.roles.A.total - stats.roles.A.bought]
        ];
        
        return data;
    }

    createParticipantsSheet() {
        const data = [
            ['PARTECIPANTI E ROSE'],
            [''],
            ['Nome Partecipante', 'Budget Rimanente', 'Giocatori', 'Totale Speso', 'P', 'D', 'C', 'A']
        ];
        
        this.participants.forEach(participant => {
            const roleCounts = { P: 0, D: 0, C: 0, A: 0 };
            let totalSpent = 0;
            
            participant.players.forEach(player => {
                if (player.ruolo && roleCounts.hasOwnProperty(player.ruolo)) {
                    roleCounts[player.ruolo]++;
                }
                totalSpent += player.boughtPrice || 0;
            });
            
            data.push([
                participant.name,
                participant.budget,
                participant.players.length,
                totalSpent,
                roleCounts.P,
                roleCounts.D,
                roleCounts.C,
                roleCounts.A
            ]);
        });
        
        // Dettaglio rose per ogni partecipante
        data.push([''], ['DETTAGLIO ROSE']);
        
        this.participants.forEach(participant => {
            data.push([''], [`ROSA DI ${participant.name.toUpperCase()}`]);
            data.push(['Nome Giocatore', 'Ruolo', 'Squadra', 'Prezzo Pagato', 'Quotazione Attuale']);
            
            participant.players
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .forEach(player => {
                    data.push([
                        player.nome,
                        player.ruolo,
                        player.squadra,
                        player.boughtPrice,
                        player.quotazioneA || 0
                    ]);
                });
        });
        
        return data;
    }

    createPlayersSheet() {
        const data = [
            ['TUTTI I GIOCATORI'],
            [''],
            ['Nome', 'Ruolo', 'Squadra', 'Qt.A', 'Qt.I', 'FVM', 'Status', 'Acquistato da', 'Prezzo Pagato']
        ];
        
        this.players
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .forEach(player => {
                data.push([
                    player.nome,
                    player.ruolo,
                    player.squadra,
                    player.quotazioneA || 0,
                    player.quotazioneI || 0,
                    player.fvm || 0,
                    player.status === 'comprato' ? 'Comprato' : 'Libero',
                    player.boughtBy || '',
                    player.boughtPrice || ''
                ]);
            });
        
        return data;
    }

    createImportSheet() {
        // Questo foglio contiene i dati strutturati per l'importazione
        const data = [
            ['DATI PER IMPORTAZIONE - NON MODIFICARE'],
            [''],
            ['=== CONFIGURAZIONE ASTA ==='],
            ['PARTICIPANTS_COUNT', this.participants.length],
            ['INITIAL_BUDGET', this.initialBudget],
            ['EXPORT_DATE', new Date().toISOString()],
            [''],
            ['=== PARTECIPANTI ==='],
            ['PARTICIPANT_NAME', 'CURRENT_BUDGET', 'PLAYERS_DATA']
        ];
        
        this.participants.forEach(participant => {
            const playersJson = JSON.stringify(participant.players);
            data.push([participant.name, participant.budget, playersJson]);
        });
        
        data.push([''], ['=== GIOCATORI ===']);
        data.push(['PLAYER_ID', 'NOME', 'RUOLO', 'SQUADRA', 'QT_A', 'QT_I', 'FVM', 'STATUS', 'BOUGHT_BY', 'BOUGHT_PRICE']);
        
        this.players.forEach(player => {
            data.push([
                player.id,
                player.nome,
                player.ruolo,
                player.squadra,
                player.quotazioneA || 0,
                player.quotazioneI || 0,
                player.fvm || 0,
                player.status,
                player.boughtBy || '',
                player.boughtPrice || ''
            ]);
        });
        
        return data;
    }

    async importFromExcel(fileData) {
        try {
            const workbook = XLSX.read(fileData, { 
                type: 'array',
                cellText: true,
                cellDates: true,
                raw: false
            });
            
            // Cerca il foglio "Dati Importazione"
            const importSheetName = "Dati Importazione";
            if (!workbook.SheetNames.includes(importSheetName)) {
                throw new Error('File non valido: foglio "Dati Importazione" non trovato');
            }
            
            const importSheet = workbook.Sheets[importSheetName];
            const importData = XLSX.utils.sheet_to_json(importSheet, { 
                header: 1,
                defval: ''
            });
            
            console.log('Dati importazione trovati:', importData.length, 'righe');
            
            // Parsing dei dati
            const parsedData = this.parseImportData(importData);
            
            // Valida i dati
            this.validateImportData(parsedData);
            
            // Applica i dati importati
            this.applyImportData(parsedData);
            
            return {
                success: true,
                participantsCount: parsedData.participants.length,
                playersCount: parsedData.players.length,
                boughtPlayersCount: parsedData.players.filter(p => p.status === 'comprato').length
            };
            
        } catch (error) {
            console.error('Errore nell\'import:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    parseImportData(importData) {
        const result = {
            config: {},
            participants: [],
            players: []
        };
        
        let currentSection = null;
        let participantsStartIndex = -1;
        let playersStartIndex = -1;
        
        // Trova le sezioni
        for (let i = 0; i < importData.length; i++) {
            const row = importData[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = String(row[0] || '').trim();
            
            if (firstCell === 'PARTICIPANTS_COUNT') {
                result.config.participantsCount = parseInt(row[1]) || 0;
            } else if (firstCell === 'INITIAL_BUDGET') {
                result.config.initialBudget = parseInt(row[1]) || 500;
            } else if (firstCell === 'PARTICIPANT_NAME') {
                participantsStartIndex = i + 1;
            } else if (firstCell === 'PLAYER_ID') {
                playersStartIndex = i + 1;
                break;
            }
        }
        
        // Parsing partecipanti
        if (participantsStartIndex > 0) {
            for (let i = participantsStartIndex; i < importData.length; i++) {
                const row = importData[i];
                if (!row || row.length < 2 || String(row[0] || '').trim() === '') break;
                
                const participantName = String(row[0] || '').trim();
                const currentBudget = parseInt(row[1]) || 0;
                const playersDataJson = String(row[2] || '').trim();
                
                let playersData = [];
                if (playersDataJson) {
                    try {
                        playersData = JSON.parse(playersDataJson);
                    } catch (e) {
                        console.warn('Errore parsing dati giocatori per', participantName);
                    }
                }
                
                result.participants.push({
                    name: participantName,
                    budget: currentBudget,
                    players: playersData
                });
            }
        }
        
        // Parsing giocatori
        if (playersStartIndex > 0) {
            for (let i = playersStartIndex; i < importData.length; i++) {
                const row = importData[i];
                if (!row || row.length < 8 || String(row[0] || '').trim() === '') break;
                
                const player = {
                    id: parseInt(row[0]) || Math.floor(Math.random() * 100000),
                    nome: String(row[1] || '').trim(),
                    ruolo: String(row[2] || '').trim(),
                    squadra: String(row[3] || '').trim(),
                    quotazioneA: parseFloat(row[4]) || 0,
                    quotazioneI: parseFloat(row[5]) || 0,
                    fvm: parseFloat(row[6]) || 0,
                    status: String(row[7] || '').trim() || 'libero',
                    boughtBy: String(row[8] || '').trim() || null,
                    boughtPrice: parseInt(row[9]) || null
                };
                
                if (player.nome) {
                    result.players.push(player);
                }
            }
        }
        
        return result;
    }

    validateImportData(data) {
        if (!data.config.participantsCount || data.config.participantsCount < 2) {
            throw new Error('Numero partecipanti non valido');
        }
        
        if (!data.config.initialBudget || data.config.initialBudget < 100) {
            throw new Error('Budget iniziale non valido');
        }
        
        if (!data.participants || data.participants.length === 0) {
            throw new Error('Nessun partecipante trovato nei dati');
        }
        
        if (!data.players || data.players.length === 0) {
            throw new Error('Nessun giocatore trovato nei dati');
        }
        
        // Verifica che i nomi partecipanti siano unici
        const participantNames = data.participants.map(p => p.name);
        const uniqueNames = new Set(participantNames);
        if (participantNames.length !== uniqueNames.size) {
            throw new Error('Trovati nomi partecipanti duplicati');
        }
    }

    applyImportData(data) {
        // Applica configurazione
        this.initialBudget = data.config.initialBudget;
        
        // Applica partecipanti
        this.participants = data.participants;
        
        // Applica giocatori
        this.players = data.players;
        
        console.log('Dati importati con successo:');
        console.log('- Partecipanti:', this.participants.length);
        console.log('- Giocatori:', this.players.length);
        console.log('- Budget iniziale:', this.initialBudget);
    }

    getTeams() {
        const teams = new Set();
        this.players.forEach(player => {
            if (player.squadra) {
                teams.add(player.squadra);
            }
        });
        return Array.from(teams).sort();
    }
}