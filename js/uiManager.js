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
        
        // Ordina i partecipanti per fantamilioni decrescenti
        const sortedParticipants = [...participants].sort((a, b) => b.budget - a.budget);
        
        // Trova budget min e max per sfumatura
        const budgets = sortedParticipants.map(p => p.budget);
        const maxBudget = Math.max(...budgets);
        const minBudget = Math.min(...budgets);
        const budgetRange = maxBudget - minBudget;
        
        grid.innerHTML = sortedParticipants.map((participant, index) => {
            // Calcola il rapporto per la scala di colore - INVERTITO: verde = più fanta
            const budgetRatio = budgetRange > 0 ? (participant.budget - minBudget) / budgetRange : 0.5;
            
            // Calcola colore HSL dinamico (verde -> arancione -> rosso) - INVERTITO
            const hue = 0 + (budgetRatio * 120); // 0 (rosso) a 120 (verde)
            const saturation = 70;
            const lightness = 50 + (budgetRatio * 10);
            
            // Squadra 1 ha stella in alto a destra
            const originalParticipants = window.app.dataManager.getParticipants();
            const isOwnTeam = participant.name === originalParticipants[0]?.name;
            const starIcon = isOwnTeam ? '<div class="own-team-star">⭐</div>' : '';
            
            // Conta giocatori per ruolo
            const roleCounts = { P: 0, D: 0, C: 0, A: 0 };
            participant.players.forEach(player => {
                if (player.ruolo && roleCounts.hasOwnProperty(player.ruolo)) {
                    roleCounts[player.ruolo]++;
                }
            });
            
            const backgroundStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            return `
                <div class="participant-card" style="background: ${backgroundStyle}; cursor: pointer;" onclick="window.app.uiManager.showParticipantDetail('${participant.name}')">
                    ${starIcon}
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-budget">${participant.budget} FM</div>
                    <div class="participant-roles">
                        <span class="role-count">P: ${roleCounts.P}</span>
                        <span class="role-count">D: ${roleCounts.D}</span>
                        <span class="role-count">C: ${roleCounts.C}</span>
                        <span class="role-count">A: ${roleCounts.A}</span>
                    </div>
                </div>
            `;
        }).join('');
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

    showParticipantDetail(participantName) {
        const participants = window.app.dataManager.getParticipants();
        const participant = participants.find(p => p.name === participantName);
        if (!participant) return;

        // Conta giocatori per ruolo
        const roleCounts = { P: 0, D: 0, C: 0, A: 0 };
        const playersByRole = { P: [], D: [], C: [], A: [] };
        
        participant.players.forEach(player => {
            if (player.ruolo && roleCounts.hasOwnProperty(player.ruolo)) {
                roleCounts[player.ruolo]++;
                playersByRole[player.ruolo].push(player);
            }
        });

        // Crea modale
        const modal = document.createElement('div');
        modal.className = 'participant-detail-modal';
        modal.innerHTML = `
            <div class="participant-detail-content" style="background: linear-gradient(135deg, #fce7f3, #fbcfe8); border-radius: 1rem; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: #be185d; margin: 0; font-size: 1.5rem;">${participant.name}</h2>
                    <button onclick="this.closest('.participant-detail-modal').remove()" style="background: #f3f4f6; border: none; border-radius: 50%; width: 2rem; height: 2rem; cursor: pointer; font-size: 1.2rem;">×</button>
                </div>
                
                <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: #374151;">Fantamilioni Rimasti</span>
                        <span style="font-size: 1.25rem; font-weight: 700; color: #be185d;">€${participant.budget.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span style="font-weight: 600; color: #374151;">Giocatori Totali</span>
                        <span style="font-size: 1.25rem; font-weight: 700; color: #be185d;">${participant.players.length}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    ${Object.entries(playersByRole).map(([role, players]) => `
                        <div style="background: white; border-radius: 0.5rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #be185d; margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; justify-content: space-between;">
                                ${role === 'P' ? 'Portieri' : role === 'D' ? 'Difensori' : role === 'C' ? 'Centrocampisti' : 'Attaccanti'}
                                <span style="background: #fce7f3; color: #be185d; padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.875rem;">${players.length}</span>
                            </h3>
                            ${players.length > 0 ? `
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${players.map(player => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem;">
                                            <div style="flex: 1;">
                                                <span style="color: #374151; font-weight: 500;">${player.nome}</span>
                                                <span style="color: #6b7280; margin-left: 0.5rem;">${player.squadra}</span>
                                            </div>
                                            <div style="text-align: right;">
                                                <span style="color: #be185d; font-weight: 600;">${player.boughtPrice || player.quotazioneA} FM</span>
                                                ${player.boughtPrice ? `<span style="color: #6b7280; font-size: 0.75rem; display: block;">(quot. ${player.quotazioneA} FM)</span>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div style="color: #9ca3af; font-style: italic; text-align: center; padding: 1rem;">
                                    Nessun giocatore in questo ruolo
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Stile per il modale
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;

        // Chiudi modale cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
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