export class UIManager {
    constructor() {
        this.currentFilters = {
            search: '',
            role: '',
            team: '',
            sort: 'nome'
        };
    }

    showMainApp() {
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }



    showFiltersSection() {
        document.getElementById('filtersSection').style.display = 'block';
    }

    showParticipantsStatus() {
        document.getElementById('participantsStatus').style.display = 'block';
        this.renderParticipantsStatus();
    }

    showPlayersSection() {
        document.getElementById('playersSection').style.display = 'block';
    }

    generateParticipantInputs(count) {
        const container = document.getElementById('participantsContainer');
        container.innerHTML = '';

        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label for="participant${i}">Partecipante ${i}</label>
                <input type="text" id="participant${i}" placeholder="Nome partecipante" required>
            `;
            container.appendChild(div);
        }
    }

    renderParticipantsStatus() {
        const participants = window.app.dataManager.getParticipants();
        const grid = document.getElementById('participantsGrid');
        
        grid.innerHTML = participants.map(participant => `
            <div class="participant-card">
                <div class="participant-name">${participant.name}</div>
                <div class="participant-budget">${participant.budget} FM</div>
                <div class="participant-players">${participant.players.length} giocatori</div>
            </div>
        `).join('');
    }

    populateTeamFilter(players) {
        const teams = [...new Set(players.map(p => p.squadra).filter(t => t))].sort();
        const select = document.getElementById('teamFilter');
        
        select.innerHTML = '<option value="">Tutte le squadre</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            select.appendChild(option);
        });
    }

    renderPlayers() {
        const players = this.getFilteredPlayers();
        const container = document.getElementById('playersList');
        const countEl = document.getElementById('playersCount');
        
        countEl.textContent = players.length;
        
        if (players.length === 0) {
            container.innerHTML = '<div class="loading">Nessun giocatore trovato</div>';
            return;
        }

        container.innerHTML = players.map(player => this.createPlayerCard(player)).join('');
    }

    createPlayerCard(player) {
        const isBought = player.status === 'comprato';
        const roleClass = this.getRoleClass(player.ruolo);
        
        return `
            <div class="player-card ${isBought ? 'comprato' : ''} fade-in" 
                 onclick="window.app.uiManager.openAuctionModal(${player.id})">
                <div class="player-header">
                    <div class="player-name">${player.nome}</div>
                    <div class="player-role ${roleClass}">${player.ruolo}</div>
                </div>
                <div class="player-team">${player.squadra}</div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-label">Quotazione</div>
                        <div class="stat-value">${player.quotazioneA}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">FVM</div>
                        <div class="stat-value">${player.fvm}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Diff</div>
                        <div class="stat-value">${player.diff}</div>
                    </div>
                </div>
                ${isBought ? `
                    <div class="player-status">
                        Comprato da ${player.boughtBy} (${player.boughtPrice} FM)
                    </div>
                ` : ''}
            </div>
        `;
    }

    getRoleClass(role) {
        const classes = {
            'P': 'role-keeper',
            'D': 'role-defender',
            'C': 'role-midfielder',
            'A': 'role-attacker'
        };
        return classes[role] || '';
    }

    getFilteredPlayers() {
        let players = window.app.dataManager.getPlayers();
        
        // Apply filters
        if (this.currentFilters.search) {
            const search = this.currentFilters.search.toLowerCase();
            players = players.filter(p => 
                p.nome.toLowerCase().includes(search) ||
                p.squadra.toLowerCase().includes(search)
            );
        }

        if (this.currentFilters.role) {
            players = players.filter(p => p.ruolo === this.currentFilters.role);
        }

        if (this.currentFilters.team) {
            players = players.filter(p => p.squadra === this.currentFilters.team);
        }

        // Sort
        players = this.sortPlayers(players, this.currentFilters.sort);

        return players;
    }

    sortPlayers(players, sortBy) {
        const sorted = [...players];
        
        switch (sortBy) {
            case 'nome':
                return sorted.sort((a, b) => a.nome.localeCompare(b.nome));
            case 'quotazioneA':
                return sorted.sort((a, b) => b.quotazioneA - a.quotazioneA);
            case 'fvm':
                return sorted.sort((a, b) => b.fvm - a.fvm);
            case 'squadra':
                return sorted.sort((a, b) => a.squadra.localeCompare(b.squadra));
            default:
                return sorted;
        }
    }

    filterPlayers() {
        this.currentFilters.search = document.getElementById('searchInput').value;
        this.currentFilters.role = document.getElementById('roleFilter').value;
        this.currentFilters.team = document.getElementById('teamFilter').value;
        this.renderPlayers();
    }

    handleSortChange() {
        this.currentFilters.sort = document.getElementById('sortBy').value;
        this.renderPlayers();
    }

    openAuctionModal(playerId) {
        const player = window.app.dataManager.getPlayerById(playerId);
        if (!player || player.status === 'comprato') return;

        const modal = document.getElementById('auctionModal');
        const details = document.getElementById('playerDetails');
        const bidderSelect = document.getElementById('bidder');
        const bidInput = document.getElementById('bidAmount');

        // Populate player details
        details.innerHTML = `
            <h4>${player.nome}</h4>
            <p><strong>Ruolo:</strong> ${player.ruolo} - ${player.squadra}</p>
            <p><strong>Quotazione:</strong> ${player.quotazioneA} FM</p>
            <p><strong>Fantavoto:</strong> ${player.fvm}</p>
        `;

        // Populate bidder select
        const participants = window.app.dataManager.getParticipants();
        bidderSelect.innerHTML = participants.map(p => 
            `<option value="${p.name}">${p.name} (${p.budget} FM disponibili)</option>`
        ).join('');

        // Set bid amount
        bidInput.value = player.quotazioneA;
        bidInput.min = 1;
        bidInput.max = participants[0]?.budget || 500;

        // Update max bid on bidder change
        bidderSelect.onchange = () => {
            const selectedParticipant = window.app.dataManager.getParticipantByName(bidderSelect.value);
            if (selectedParticipant) {
                bidInput.max = selectedParticipant.budget;
            }
        };

        // Store current player for auction
        window.currentAuctionPlayer = player;

        modal.style.display = 'flex';
    }

    closeAuctionModal() {
        document.getElementById('auctionModal').style.display = 'none';
        window.currentAuctionPlayer = null;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showLoading() {
        const container = document.getElementById('playersList');
        container.innerHTML = '<div class="loading">Caricamento...</div>';
    }

    showError(message) {
        const container = document.getElementById('playersList');
        container.innerHTML = `<div class="loading error">${message}</div>`;
    }
}