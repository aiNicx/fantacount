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