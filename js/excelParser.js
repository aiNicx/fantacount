export class ExcelParser {
    constructor() {
        this.requiredColumns = [
            'Id', 'Nome', 'Ruolo', 'Squadra', 'Qt. A', 'Qt. I', 'Diff.', 
            'Qt. A M', 'Qt. I M', 'Diff. M', 'FVM', 'FVM M'
        ];
    }

    async parseFile(fileData) {
        return new Promise((resolve, reject) => {
            try {
                const processData = (arrayBuffer) => {
                    try {
                        const data = new Uint8Array(arrayBuffer);
                        const workbook = XLSX.read(data, { 
                            type: 'array',
                            cellText: true,
                            cellDates: true,
                            raw: false
                        });
                        
                        console.log('Workbook sheets:', workbook.SheetNames);
                        
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        if (!worksheet) {
                            reject(new Error('Nessun foglio trovato nel file'));
                            return;
                        }
                        
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                            header: 1,
                            defval: ''
                        });
                        
                        console.log('Raw data rows:', jsonData.length);
                        
                        if (jsonData.length < 3) {
                            reject(new Error('File Excel vuoto o con dati insufficienti'));
                            return;
                        }

                        // Skip title row (row 0) and use headers from row 1
                        const headers = jsonData[1];
                        const rows = jsonData.slice(2);

                        const players = this.processRows(headers, rows);
                        resolve(players);
                        
                    } catch (error) {
                        console.error('Error processing workbook:', error);
                        reject(new Error(`Errore parsing Excel: ${error.message}`));
                    }
                };

                if (fileData instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => processData(e.target.result);
                    reader.onerror = () => reject(new Error('Errore lettura file'));
                    reader.readAsArrayBuffer(fileData);
                } else if (fileData instanceof ArrayBuffer) {
                    processData(fileData);
                } else {
                    reject(new Error('Formato file non valido'));
                }
            } catch (error) {
                console.error('Error in parseFile:', error);
                reject(error);
            }
        });
    }

    processRows(headers, rows) {
        const players = [];
        
        console.log('Headers trovati:', headers);
        console.log('Numero righe:', rows.length);
        
        // Map column indices based on headers
        const columnMap = this.createColumnMap(headers);
        console.log('Mappa colonne:', columnMap);
        
        // Skip empty rows and rows that look like headers
        const dataRows = rows.filter(row => row && row.length > 0 && String(row[0] || '').trim() !== '');
        console.log('Righe dati valide:', dataRows.length);
        
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            try {
                const player = this.createPlayerObject(row, columnMap);
                if (player && player.nome && player.nome.trim()) {
                    players.push(player);
                } else {
                    console.warn(`Riga ${i + 1} saltata:`, row);
                }
            } catch (error) {
                console.warn(`Errore riga ${i + 2}:`, error);
            }
        }

        console.log('Giocatori trovati:', players.length);
        return players;
    }

    createColumnMap(headers) {
        const map = {};
        
        // Map exact column positions based on actual Excel structure
        headers.forEach((header, index) => {
            if (!header) return;
            
            const normalizedHeader = String(header).toLowerCase().trim();
            
            switch(normalizedHeader) {
                 case 'id':
                     map['id'] = index;
                     break;
                 case 'r':
                     map['ruolo'] = index;
                     break;
                 case 'nome':
                     map['nome'] = index;
                     break;
                 case 'squadra':
                     map['squadra'] = index;
                     break;
                 case 'qt.a':
                     map['quotazioneA'] = index;
                     break;
                 case 'qt.i':
                     map['quotazioneI'] = index;
                     break;
                 case 'diff.':
                     map['diff'] = index;
                     break;
                 case 'qt.a m':
                     map['quotazioneAM'] = index;
                     break;
                 case 'qt.i m':
                     map['quotazioneIM'] = index;
                     break;
                 case 'diff.m':
                 case 'diff.':
                     map['diffM'] = index;
                     break;
                 case 'fvm':
                     map['fvm'] = index;
                     break;
                 case 'fvm m':
                    map['fvmM'] = index;
                    break;
                case 'fascia':
                    map['fascia'] = index;
                    break;
            }
        });

        // Check if we found the essential columns
        const essentialColumns = ['nome', 'ruolo', 'squadra', 'quotazioneA'];
        const missing = essentialColumns.filter(col => !(col in map));
        if (missing.length > 0) {
            console.warn('Colonne essenziali mancanti:', missing);
            console.log('Headers disponibili:', headers);
        }

        return map;
    }

    createPlayerObject(row, columnMap) {
        const getValue = (key, defaultValue = '') => {
            const index = columnMap[key];
            return index !== undefined && row[index] !== undefined ? row[index] : defaultValue;
        };

        const player = {
            id: this.parseNumber(getValue('id')) || Math.floor(Math.random() * 100000),
            nome: String(getValue('nome')).trim(),
            ruolo: this.normalizeRole(String(getValue('ruolo')).trim()),
            ruoloSpecifico: String(getValue('ruolo')).trim(),
            squadra: String(getValue('squadra')).trim(),
            quotazioneA: this.parseNumber(getValue('quotazioneA')) || 0,
            quotazioneI: this.parseNumber(getValue('quotazioneI')) || 0,
            diff: this.parseNumber(getValue('diff')) || 0,
            quotazioneAM: this.parseNumber(getValue('quotazioneAM')) || 0,
            quotazioneIM: this.parseNumber(getValue('quotazioneIM')) || 0,
            diffM: this.parseNumber(getValue('diffM')) || 0,
            fvm: this.parseNumber(getValue('fvm')) || 0,
            fvmM: this.parseNumber(getValue('fvmM')) || 0,
            fascia: this.parseNumber(getValue('fascia')) || null,
            status: 'libero',
            boughtBy: null,
            boughtPrice: null
        };

        // If quotazioneI is missing, use quotazioneA
        if (player.quotazioneI === 0) {
            player.quotazioneI = player.quotazioneA;
        }

        return player;
    }

    normalizeRole(role) {
        const roleMap = {
            'P': 'P', 'PORTIERE': 'P', 'Portiere': 'P',
            'D': 'D', 'DIFENSORE': 'D', 'Difensore': 'D',
            'C': 'C', 'CENTROCAMPISTA': 'C', 'Centrocampista': 'C',
            'A': 'A', 'ATTACCANTE': 'A', 'Attaccante': 'A'
        };
        
        return roleMap[role.toUpperCase()] || role.toUpperCase().charAt(0) || '?';
    }

    parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        
        const num = parseFloat(String(value).toString().replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }

    validateHeaders(headers) {
        const missing = [];
        
        this.requiredColumns.forEach(col => {
            if (!headers.some(h => String(h).toLowerCase().includes(col.toLowerCase()))) {
                missing.push(col);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`Colonne mancanti: ${missing.join(', ')}`);
        }
    }
}