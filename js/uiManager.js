export class UIManager {
    constructor() {
        this.currentFilters = {
            search: '',
            role: '',
            team: '',
            sort: 'nome',
            status: 'all' // 'all', 'available', 'bought'
        };
    }

    showMainApp() {
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Mostra il bottone export quando l'app principale è attiva
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.style.display = 'block';
        }
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
            
            // Calcola colore HSL dinamico (rosso -> arancione -> verde) - INVERTITO
            const hue = 0 + (budgetRatio * 120); // 0 (rosso) a 120 (verde)
            const saturation = 70;
            const lightness = Math.max(30, Math.min(45, 35 + (budgetRatio * 10))); // Range più scuro per contrasto
            
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
                        <span class="role-count ${roleCounts.P > 3 ? 'over-limit' : roleCounts.P === 3 ? 'at-limit' : ''}">P: ${roleCounts.P}/3</span>
                        <span class="role-count ${roleCounts.D > 8 ? 'over-limit' : roleCounts.D === 8 ? 'at-limit' : ''}">D: ${roleCounts.D}/8</span>
                        <span class="role-count ${roleCounts.C > 8 ? 'over-limit' : roleCounts.C === 8 ? 'at-limit' : ''}">C: ${roleCounts.C}/8</span>
                        <span class="role-count ${roleCounts.A > 6 ? 'over-limit' : roleCounts.A === 6 ? 'at-limit' : ''}">A: ${roleCounts.A}/6</span>
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
        const filteredPlayers = this.getFilteredPlayers();
        const container = document.getElementById('playersList');
        
        // Calculate counts from players filtered by search, role, and team (but not status)
        const baseFilteredPlayers = this.getPlayersWithBaseFilters();
        const totalCount = baseFilteredPlayers.length;
        const availableCount = baseFilteredPlayers.filter(p => p.status !== 'comprato').length;
        const boughtCount = baseFilteredPlayers.filter(p => p.status === 'comprato').length;
        
        // Update counter displays
        document.querySelector('#totalCount .count').textContent = totalCount;
        document.querySelector('#availableCount .count').textContent = availableCount;
        document.querySelector('#boughtCount .count').textContent = boughtCount;
        
        // Update the active counter based on current filter
        this.updateActiveCounter(this.currentFilters.status);
        
        if (filteredPlayers.length === 0) {
            container.innerHTML = '<div class="loading">Nessun giocatore trovato</div>';
            return;
        }

        container.innerHTML = filteredPlayers.map(player => this.createPlayerCard(player)).join('');
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
                <div class="player-team-row">
                    <div class="player-team">${player.squadra}</div>
                    ${isBought ? `
                        <div class="player-bought-tag" 
                             onclick="event.stopPropagation(); window.app.uiManager.showParticipantDetail('${player.boughtBy}')"
                             title="Clicca per vedere la squadra di ${player.boughtBy}">
                            Comprato da ${player.boughtBy} (${player.boughtPrice} FM)
                        </div>
                    ` : ''}
                </div>
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

    getPlayersWithBaseFilters() {
        let players = window.app.dataManager.getPlayers();
        
        // Apply only search, role, and team filters (not status)
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

        return players;
    }

    getFilteredPlayers() {
        let players = this.getPlayersWithBaseFilters();

        // Apply status filter
        if (this.currentFilters.status === 'available') {
            players = players.filter(p => p.status !== 'comprato');
        } else if (this.currentFilters.status === 'bought') {
            players = players.filter(p => p.status === 'comprato');
        }
        // 'all' shows all players, so no additional filtering needed

        // Sort
        players = this.sortPlayers(players, this.currentFilters.sort);

        return players;
    }

    sortPlayers(players, sortBy) {
        const sorted = [...players];
        
        switch (sortBy) {
            case 'nome':
                return sorted.sort((a, b) => a.nome.localeCompare(b.nome));
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

    filterByStatus(status) {
        this.currentFilters.status = status;
        this.updateActiveCounter(status);
        this.renderPlayers();
    }

    updateActiveCounter(activeStatus) {
        // Remove active class from all counters
        document.querySelectorAll('.counter-item').forEach(counter => {
            counter.classList.remove('active');
        });
        
        // Add active class to selected counter
        const activeCounterId = activeStatus === 'all' ? 'totalCount' : 
                               activeStatus === 'available' ? 'availableCount' : 'boughtCount';
        document.getElementById(activeCounterId).classList.add('active');
    }

    canBuyPlayer(participantName, playerRole) {
        const participant = window.app.dataManager.getParticipantByName(participantName);
        if (!participant) return { canBuy: false, reason: "Partecipante non trovato" };

        // Count current players by role
        const roleCounts = { P: 0, D: 0, C: 0, A: 0 };
        participant.players.forEach(player => {
            if (player.ruolo && roleCounts.hasOwnProperty(player.ruolo)) {
                roleCounts[player.ruolo]++;
            }
        });

        // Define formation limits
        const formationLimits = { P: 3, D: 8, C: 8, A: 6 };
        
        // Check if adding this player would exceed the limit
        const currentCount = roleCounts[playerRole] || 0;
        const limit = formationLimits[playerRole];
        
        if (currentCount >= limit) {
            const roleNames = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
            return { 
                canBuy: false, 
                reason: `Limite raggiunto per ${roleNames[playerRole]} (${currentCount}/${limit})` 
            };
        }

        return { canBuy: true };
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
            <div class="participant-detail-content" style="background: white; border-radius: 1rem; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: #2563eb; margin: 0; font-size: 1.5rem;">${participant.name}</h2>
                    <button onclick="this.closest('.participant-detail-modal').remove()" style="background: #f3f4f6; border: none; border-radius: 50%; width: 2rem; height: 2rem; cursor: pointer; font-size: 1.2rem;">×</button>
                </div>
                
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: #374151;">Fantamilioni Rimasti</span>
                        <span style="font-size: 1.25rem; font-weight: 700; color: #2563eb;">€${participant.budget.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span style="font-weight: 600; color: #374151;">Giocatori Totali</span>
                        <span style="font-size: 1.25rem; font-weight: 700; color: #2563eb;">${participant.players.length}/25</span>
                    </div>
                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 0.875rem; color: #6b7280; text-align: center;">
                            💡 <strong>Clicca su un giocatore</strong> per modificare il prezzo o rimuoverlo
                        </p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    ${Object.entries(playersByRole).map(([role, players]) => {
                        const maxPlayers = { P: 3, D: 8, C: 8, A: 6 }[role];
                        const isOverLimit = players.length > maxPlayers;
                        const isAtLimit = players.length === maxPlayers;
                        const countColor = isOverLimit ? '#ef4444' : isAtLimit ? '#f59e0b' : '#10b981';
                        const roleNames = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
                        
                        return `
                        <div style="background: white; border-radius: 0.5rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: ${isOverLimit ? '2px solid #ef4444' : '1px solid #e2e8f0'};">
                            <h3 style="color: #2563eb; margin: 0 0 0.5rem 0; font-size: 1.1rem; display: flex; align-items: center; justify-content: space-between;">
                                ${roleNames[role]}
                                <span style="background: ${countColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 600;">${players.length}/${maxPlayers}</span>
                            </h3>
                            ${players.length > 0 ? `
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${players.map(player => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; cursor: pointer; border-radius: 0.25rem; transition: background 0.2s;" 
                                             onmouseover="this.style.background='#f8fafc'" 
                                             onmouseout="this.style.background='transparent'"
                                             onclick="window.app.uiManager.openPlayerEditModal(${player.id}, '${participantName}')"
                                             title="Clicca per modificare o rimuovere">
                                            <div style="flex: 1;">
                                                <span style="color: #374151; font-weight: 500;">${player.nome}</span>
                                                <span style="color: #6b7280; margin-left: 0.5rem;">${player.squadra}</span>
                                            </div>
                                            <div style="text-align: right; display: flex; align-items: center; gap: 0.5rem;">
                                                <span style="color: #2563eb; font-weight: 600;">${player.boughtPrice} FM</span>
                                                <span style="color: #9ca3af; font-size: 0.75rem;">✏️</span>
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
                        `;
                    }).join('')}
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

    openPlayerEditModal(playerId, participantName) {
        const player = window.app.dataManager.getPlayerById(playerId);
        const participant = window.app.dataManager.getParticipantByName(participantName);
        
        if (!player || !participant) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'player-edit-modal';
        modal.innerHTML = `
            <div style="background: white; border-radius: 1rem; padding: 2rem; max-width: 400px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #2563eb; margin: 0; font-size: 1.25rem;">${player.nome}</h3>
                    <button onclick="this.closest('.player-edit-modal').remove()" style="background: #f3f4f6; border: none; border-radius: 50%; width: 2rem; height: 2rem; cursor: pointer; font-size: 1.2rem;">×</button>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: #6b7280; margin: 0 0 0.5rem 0;"><strong>Ruolo:</strong> ${player.ruolo} - ${player.squadra}</p>
                    <p style="color: #6b7280; margin: 0;"><strong>Prezzo corrente:</strong> ${player.boughtPrice} FM</p>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">Nuovo Prezzo (FM):</label>
                    <input type="number" id="newPrice" value="${player.boughtPrice}" min="1" max="${participant.budget + player.boughtPrice}" 
                           style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem;">
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="window.app.uiManager.confirmPlayerEdit(${playerId}, '${participantName}')" 
                            style="flex: 1; background: #2563eb; color: white; border: none; padding: 0.75rem 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">
                        Modifica Prezzo
                    </button>
                    <button onclick="window.app.uiManager.confirmPlayerRemoval(${playerId}, '${participantName}')" 
                            style="flex: 1; background: #ef4444; color: white; border: none; padding: 0.75rem 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">
                        Rimuovi Giocatore
                    </button>
                </div>
            </div>
        `;

        // Style for modal
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
            z-index: 1001;
            padding: 1rem;
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    confirmPlayerEdit(playerId, participantName) {
        const newPrice = parseInt(document.getElementById('newPrice').value);
        const player = window.app.dataManager.getPlayerById(playerId);
        const participant = window.app.dataManager.getParticipantByName(participantName);
        
        if (!player || !participant || !newPrice || newPrice <= 0) {
            alert('Inserisci un prezzo valido');
            return;
        }

        const priceDifference = newPrice - player.boughtPrice;
        
        if (participant.budget < priceDifference) {
            alert(`Budget insufficiente. Disponibili: ${participant.budget} FM, richiesti: ${priceDifference} FM`);
            return;
        }

        // Update price
        const success = window.app.dataManager.updatePlayerPrice(playerId, participantName, newPrice);
        
        if (success) {
            // Close modal
            document.querySelector('.player-edit-modal').remove();
            
            // Update UI
            this.renderParticipantsStatus();
            this.renderPlayers();
            
            // Show success message
            this.showNotification(`Prezzo di ${player.nome} aggiornato a ${newPrice} FM`, 'success');
            
            // Save data
            window.app.dataManager.saveToStorage();
        } else {
            alert('Errore nell\'aggiornamento del prezzo');
        }
    }

    confirmPlayerRemoval(playerId, participantName) {
        const player = window.app.dataManager.getPlayerById(playerId);
        
        if (!player) return;
        
        if (!confirm(`Sei sicuro di voler rimuovere ${player.nome} dalla squadra?`)) {
            return;
        }

        const success = window.app.dataManager.removePlayerFromParticipant(playerId, participantName);
        
        if (success) {
            // Close modal
            document.querySelector('.player-edit-modal').remove();
            
            // Update UI
            this.renderParticipantsStatus();
            this.renderPlayers();
            
            // Show success message
            this.showNotification(`${player.nome} rimosso dalla squadra`, 'success');
            
            // Save data
            window.app.dataManager.saveToStorage();
        } else {
            alert('Errore nella rimozione del giocatore');
        }
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
        `;

        // Populate bidder select with formation limits info
        const participants = window.app.dataManager.getParticipants();
        bidderSelect.innerHTML = participants.map(p => {
            const formationCheck = this.canBuyPlayer(p.name, player.ruolo);
            const statusText = formationCheck.canBuy ? 
                `${p.budget} FM disponibili` : 
                `LIMITE RAGGIUNTO (${formationCheck.reason.split('(')[1].replace(')', '')})`;
            const isDisabled = !formationCheck.canBuy;
            
            return `<option value="${p.name}" ${isDisabled ? 'disabled style="color: #ef4444;"' : ''}>${p.name} - ${statusText}</option>`;
        }).join('');

        // Set bid amount
        bidInput.value = 1;
        bidInput.min = 1;
        bidInput.max = participants[0]?.budget || 500;

        // Update max bid on bidder change and check formation limits
        bidderSelect.onchange = () => {
            const selectedParticipant = window.app.dataManager.getParticipantByName(bidderSelect.value);
            if (selectedParticipant) {
                bidInput.max = selectedParticipant.budget;
                
                // Check if this participant can buy this player
                const formationCheck = this.canBuyPlayer(selectedParticipant.name, player.ruolo);
                const confirmBtn = document.querySelector('#auctionModal .btn-primary');
                
                if (formationCheck.canBuy) {
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.style.opacity = '1';
                        confirmBtn.title = '';
                    }
                } else {
                    if (confirmBtn) {
                        confirmBtn.disabled = true;
                        confirmBtn.style.opacity = '0.5';
                        confirmBtn.title = formationCheck.reason;
                    }
                }
            }
        };

        // Store current player for auction
        window.currentAuctionPlayer = player;

        // Initial check for the first selected participant
        setTimeout(() => {
            if (bidderSelect.value) {
                bidderSelect.onchange();
            }
        }, 100);

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