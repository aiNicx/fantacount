export class AuctionManager {
    constructor() {
        this.currentAuction = null;
    }

    confirmBid() {
        const player = window.currentAuctionPlayer;
        if (!player) return;

        const bidAmount = parseInt(document.getElementById('bidAmount').value);
        const bidder = document.getElementById('bidder').value;

        if (!bidAmount || bidAmount <= 0) {
            alert('Inserisci un importo valido');
            return;
        }

        const participant = window.app.dataManager.getParticipantByName(bidder);
        if (!participant) {
            alert('Partecipante non valido');
            return;
        }

        if (participant.budget < bidAmount) {
            alert(`${bidder} non ha abbastanza fantamilioni (disponibili: ${participant.budget})`);
            return;
        }

        if (bidAmount < 1) {
            alert('L\'offerta deve essere almeno 1 fantamilione');
            return;
        }

        const success = window.app.dataManager.buyPlayer(player.id, bidder, bidAmount);
        
        if (success) {
            this.handleSuccessfulBid(player, bidder, bidAmount);
        } else {
            alert('Errore nell\'acquisto del giocatore');
        }
    }

    handleSuccessfulBid(player, bidder, bidAmount) {
        // Update UI
        window.app.uiManager.closeAuctionModal();
        window.app.uiManager.renderPlayers();
        window.app.uiManager.renderParticipantsStatus();
        
        // Show success message
        this.showSuccessMessage(player.nome, bidder, bidAmount);
        
        // Save data
        window.app.dataManager.saveToStorage();
        
        // Optional: Add sound/vibration feedback
        this.playSuccessFeedback();
    }

    showSuccessMessage(playerName, bidder, bidAmount) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span>✅</span>
                <div>
                    <strong>${playerName}</strong> acquistato da <strong>${bidder}</strong>
                    <br>
                    Prezzo: ${bidAmount} FM
                </div>
            </div>
        `;
        
        // Add styles for toast
        const style = document.createElement('style');
        style.textContent = `
            .success-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    playSuccessFeedback() {
        // Vibration on mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Simple beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio is not supported
        }
    }

    getAuctionHistory() {
        const players = window.app.dataManager.getPlayers();
        const boughtPlayers = players.filter(p => p.status === 'comprato');
        
        return boughtPlayers.sort((a, b) => {
            // Sort by most recent purchases first
            return (b.boughtPrice || 0) - (a.boughtPrice || 0);
        });
    }

    getParticipantSummary(participantName) {
        const participant = window.app.dataManager.getParticipantByName(participantName);
        if (!participant) return null;

        const roster = window.app.dataManager.getParticipantRoster(participantName);
        
        return {
            name: participant.name,
            budget: participant.budget,
            totalPlayers: roster.length,
            totalSpent: participant.players.reduce((sum, p) => sum + (p.boughtPrice || 0), 0),
            playersByRole: this.groupPlayersByRole(roster),
            averagePrice: roster.length > 0 ? 
                (participant.players.reduce((sum, p) => sum + (p.boughtPrice || 0), 0) / roster.length).toFixed(1) : 0
        };
    }

    groupPlayersByRole(players) {
        const roles = { P: 0, D: 0, C: 0, A: 0 };
        
        players.forEach(player => {
            if (roles.hasOwnProperty(player.ruolo)) {
                roles[player.ruolo]++;
            }
        });
        
        return roles;
    }

    exportAuctionResults() {
        const participants = window.app.dataManager.getParticipants();
        const players = window.app.dataManager.getPlayers();
        
        const results = {
            timestamp: new Date().toISOString(),
            participants: participants.map(p => this.getParticipantSummary(p.name)),
            totalPlayers: players.length,
            totalBought: players.filter(p => p.status === 'comprato').length,
            averagePrice: players.filter(p => p.status === 'comprato').reduce((sum, p) => sum + (p.boughtPrice || 0), 0) / players.filter(p => p.status === 'comprato').length || 0
        };
        
        return results;
    }

    undoLastBid() {
        // This would require storing bid history
        // For now, we'll implement a simple undo using localStorage backup
        try {
            const savedData = localStorage.getItem('fantasyAuctionDataBackup');
            if (savedData) {
                const data = JSON.parse(savedData);
                window.app.dataManager.participants = data.participants;
                window.app.dataManager.players = data.players;
                window.app.dataManager.saveToStorage();
                
                window.app.uiManager.renderPlayers();
                window.app.uiManager.renderParticipantsStatus();
                
                return true;
            }
        } catch (error) {
            console.error('Error undoing last bid:', error);
        }
        return false;
    }

    createBackup() {
        // Create backup before each bid for undo functionality
        const data = {
            participants: [...window.app.dataManager.participants],
            players: [...window.app.dataManager.players]
        };
        
        try {
            localStorage.setItem('fantasyAuctionDataBackup', JSON.stringify(data));
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }
}