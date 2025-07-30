import { DataManager } from './dataManager.js';
import { ExcelParser } from './excelParser.js';
import { UIManager } from './uiManager.js';
import { AuctionManager } from './auctionManager.js';

class FantasyAuctionApp {
    constructor() {
        this.dataManager = new DataManager();
        this.excelParser = new ExcelParser();
        this.uiManager = new UIManager();
        this.auctionManager = new AuctionManager();
        
        // Make app globally available
        window.app = this;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredData();
    }

    setupEventListeners() {
        // Setup form
        document.getElementById('setupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetApp();
        });

        // Filters
        document.getElementById('searchInput').addEventListener('input', () => {
            this.uiManager.filterPlayers();
        });

        document.getElementById('roleFilter').addEventListener('change', () => {
            this.uiManager.filterPlayers();
        });

        document.getElementById('teamFilter').addEventListener('change', () => {
            this.uiManager.filterPlayers();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.uiManager.handleSortChange();
        });

        // Auction modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.uiManager.closeAuctionModal();
        });

        document.getElementById('confirmBid').addEventListener('click', () => {
            this.auctionManager.confirmBid();
        });

        // Number of participants change
        document.getElementById('numParticipants').addEventListener('change', (e) => {
            this.uiManager.generateParticipantInputs(e.target.value);
        });
    }

    async handleSetup() {
        const numParticipants = parseInt(document.getElementById('numParticipants').value);
        const initialBudget = parseInt(document.getElementById('initialBudget').value);
        const participants = [];

        for (let i = 1; i <= numParticipants; i++) {
            const nameInput = document.getElementById(`participant${i}`);
            if (nameInput && nameInput.value.trim()) {
                participants.push({
                    name: nameInput.value.trim(),
                    budget: initialBudget,
                    players: []
                });
            }
        }

        if (participants.length !== numParticipants) {
            alert('Per favore compila tutti i nomi dei partecipanti');
            return;
        }

        this.dataManager.setParticipants(participants);
        this.dataManager.setInitialBudget(initialBudget);
        
        this.uiManager.showMainApp();
        this.saveData();
        
        // Automatically load the Excel file
        await this.loadLocalExcelFile();
    }

    async loadLocalExcelFile() {
        try {
            console.log('Loading local Excel file...');
            
            // Try multiple paths for the Excel file
            const possiblePaths = [
                './Quotazioni_Fantacalcio_Stagione_2025_26.xlsx',
                '/Quotazioni_Fantacalcio_Stagione_2025_26.xlsx',
                '../Quotazioni_Fantacalcio_Stagione_2025_26.xlsx'
            ];
            
            let response = null;
            let usedPath = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log('Trying path:', path);
                    response = await fetch(path);
                    if (response.ok) {
                        usedPath = path;
                        break;
                    }
                } catch (e) {
                    console.log('Failed path:', path, e.message);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Impossibile trovare il file Excel in nessuna posizione`);
            }
            
            console.log('File found at:', usedPath);
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('File size:', arrayBuffer.byteLength, 'bytes');
            
            const players = await this.excelParser.parseFile(arrayBuffer);
            
            console.log('Parsed players:', players.length);
            
            if (players.length === 0) {
                throw new Error('Nessun giocatore trovato nel file');
            }
            
            this.dataManager.setPlayers(players);
            
            console.log('Excel file loaded successfully!');
            
            // Initialize the UI
            this.uiManager.renderPlayers();
            this.uiManager.renderParticipantsStatus();
            this.uiManager.populateTeamFilter(players);
            
            this.saveData();
            
            this.uiManager.showNotification(`Caricati ${players.length} giocatori`, 'success');
            
        } catch (error) {
            console.error('Error loading Excel file:', error);
            this.uiManager.showError('Errore caricamento file: ' + error.message);
            
            // Provide helpful debug info
            console.log('Current URL:', window.location.href);
            console.log('Base path:', window.location.pathname);
        }
    }

    loadStoredData() {
        const savedData = this.dataManager.loadFromStorage();
        if (savedData) {
            if (savedData.participants && savedData.participants.length > 0) {
                this.uiManager.showMainApp();
                this.uiManager.renderParticipantsStatus();
                
                if (savedData.players && savedData.players.length > 0) {
                    this.uiManager.renderPlayers();
                    this.uiManager.renderParticipantsStatus();
                    this.uiManager.populateTeamFilter(savedData.players);
                }
            }
        }
    }

    resetApp() {
        if (confirm('Sei sicuro di voler resettare tutto?')) {
            this.dataManager.clearAll();
            location.reload();
        }
    }

    saveData() {
        this.dataManager.saveToStorage();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FantasyAuctionApp();
});