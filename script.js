// script.js

// Assuming wordList is globally available from wordlist.js
// For demonstration, a simplified wordList structure:
// const wordList = {
//     4: ["casa", "bola", "pato", "fogo", "agua"],
//     5: ["prato", "verde", "cinco", "mundo", "pedra"],
//     6: ["janela", "escola", "banana", "floresta", "cidade"],
//     7: ["abacaxi", "elefante", "computador", "cachorro", "passaro"]
// };

class Game {
    constructor() {
        this.settingsScreen = document.getElementById('settings-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');

        this.wordLengthInput = document.getElementById('word-length-input');
        this.chancesInput = document.getElementById('chances-input');
        this.wordCountInput = document.getElementById('word-count-input');
        this.messageDiv = this.createMessageDiv();

        this.selectedWordLength = 5;
        this.selectedChances = 6;
        this.selectedWordCount = 1;

        this.gameWords = [];
        this.currentGuesses = [];
        this.currentRows = [];
        this.gameWon = [];
        this.gameLost = [];
        this.submittedWords = [];

        this.addEventListeners();
        this.loadDarkModePreference();
        this.initializeWordList();
    }

    createMessageDiv() {
        const div = document.createElement('div');
        div.classList.add('game-message');
        div.style.opacity = '0'; // Start hidden
        div.style.pointerEvents = 'none'; // Make it non-interactive when hidden
        document.body.appendChild(div);
        return div;
    }

    showMessage(message, color = 'black') {
        this.messageDiv.textContent = message;
        this.messageDiv.style.backgroundColor = color;
        this.messageDiv.classList.remove('fade-out');
        this.messageDiv.style.opacity = '1';
        this.messageDiv.style.pointerEvents = 'auto'; // Make it interactive when visible

        setTimeout(() => {
            this.messageDiv.classList.add('fade-out');
            this.messageDiv.addEventListener('transitionend', () => {
                this.messageDiv.style.opacity = '0';
                this.messageDiv.style.pointerEvents = 'none'; // Make it non-interactive again
            }, { once: true });
        }, 2000); // Message visible for 2 seconds
    }

    addEventListeners() {
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        this.wordCountInput.addEventListener('input', () => this.updateChancesBasedOnWordCount());
        this.startGameBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e.key));
        document.getElementById('keyboard').addEventListener('click', (e) => {
            if (e.target.classList.contains('keyboard-button')) {
                this.handleKeyPress(e.target.dataset.key);
            }
        });
    }

    loadDarkModePreference() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    }

    updateChancesBasedOnWordCount() {
        const currentWordCount = parseInt(this.wordCountInput.value);
        const currentChances = parseInt(this.chancesInput.value);
        if (currentChances < currentWordCount) {
            this.chancesInput.value = currentWordCount;
        }
    }

    initializeWordList() {
        // This part assumes rawWordListContent is available globally
        // and processes it into the wordList object.
        // If wordlist.js is pre-processed, this block can be removed.
        if (typeof rawWordListContent !== 'undefined') {
            window.wordList = {}; // Ensure wordList is global
            rawWordListContent.split(/\r?\n/).forEach(word => {
                const trimmedWord = word.trim().toLowerCase();
                if (trimmedWord.length > 0) {
                    if (!wordList[trimmedWord.length]) {
                        wordList[trimmedWord.length] = [];
                    }
                    wordList[trimmedWord.length].push(trimmedWord);
                }
            });

            for (let i = 4; i <= 9; i++) {
                if (!wordList[i]) {
                    wordList[i] = [];
                }
            }
        }
    }

    startGame() {
        this.selectedWordLength = parseInt(this.wordLengthInput.value);
        this.selectedChances = parseInt(this.chancesInput.value);
        this.selectedWordCount = parseInt(this.wordCountInput.value);

        if (!this.validateGameSettings()) {
            return;
        }

        this.settingsScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.initializeGame();
    }

    validateGameSettings() {
        if (this.selectedWordLength < 4 || this.selectedWordLength > 9) {
            this.showMessage('O número de letras por palavra deve ser entre 4 e 9.', 'red');
            return false;
        }
        if (this.selectedChances < 5) {
            this.showMessage('O número de chances deve ser no mínimo 5.', 'red');
            return false;
        }
        if (this.selectedWordCount < 1) {
            this.showMessage('O número de palavras simultâneas deve ser no mínimo 1.', 'red');
            return false;
        }
        if (this.selectedChances < this.selectedWordCount) {
            this.showMessage('O número de chances deve ser no mínimo igual ao número de palavras simultâneas.', 'red');
            return false;
        }
        return true;
    }

    initializeGame() {
        this.gameWords = [];
        this.currentGuesses = Array(this.selectedWordCount).fill('');
        this.currentRows = Array(this.selectedWordCount).fill(0);
        this.gameWon = Array(this.selectedWordCount).fill(false);
        this.gameLost = Array(this.selectedWordCount).fill(false);
        this.submittedWords = Array(this.selectedWordCount).fill(new Set());

        const availableWords = wordList[this.selectedWordLength];
        if (!availableWords || availableWords.length < this.selectedWordCount) {
            alert('Não há palavras suficientes para a configuração selecionada. Tente outra combinação.');
            this.settingsScreen.classList.remove('hidden');
            this.gameScreen.classList.add('hidden');
            return;
        }

        const shuffledWords = availableWords.sort(() => 0.5 - Math.random());
        for (let i = 0; i < this.selectedWordCount; i++) {
            this.gameWords.push(shuffledWords[i].toUpperCase());
        }

        this.renderGameBoards();
        this.renderKeyboard();
        console.log('Game initialized with words:', this.gameWords);
    }

    renderGameBoards() {
        const boardsContainer = document.getElementById('boards-container');
        boardsContainer.innerHTML = '';

        this.gameWords.forEach((word, index) => {
            const board = document.createElement('div');
            board.classList.add('word-board');
            board.id = `board-${index}`;

            for (let i = 0; i < this.selectedChances; i++) {
                const row = document.createElement('div');
                row.classList.add('row');
                for (let j = 0; j < this.selectedWordLength; j++) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    row.appendChild(tile);
                }
                board.appendChild(row);
            }
            boardsContainer.appendChild(board);
        });
    }

    renderKeyboard() {
        const keyboardDiv = document.getElementById('keyboard');
        keyboardDiv.innerHTML = '';

        const rows = [
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm'
        ];

        rows.forEach((rowLetters, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('keyboard-row');

            if (rowIndex === 2) {
                const enterBtn = document.createElement('button');
                enterBtn.classList.add('keyboard-button', 'large');
                enterBtn.textContent = 'Enter';
                enterBtn.dataset.key = 'Enter';
                rowDiv.appendChild(enterBtn);
            }

            rowLetters.split('').forEach(letter => {
                const button = document.createElement('button');
                button.classList.add('keyboard-button');
                button.textContent = letter;
                button.dataset.key = letter;
                rowDiv.appendChild(button);
            });

            if (rowIndex === 2) {
                const backspaceBtn = document.createElement('button');
                backspaceBtn.classList.add('keyboard-button', 'large');
                backspaceBtn.textContent = 'Backspace';
                backspaceBtn.dataset.key = 'Backspace';
                rowDiv.appendChild(backspaceBtn);
            }

            keyboardDiv.appendChild(rowDiv);
        });
    }

    isValidWord(word) {
        return wordList[this.selectedWordLength].includes(word.toLowerCase());
    }

    handleKeyPress(key) {
        for (let i = 0; i < this.selectedWordCount; i++) {
            if (this.gameWon[i] || this.gameLost[i]) continue;

            let currentGuess = this.currentGuesses[i];

            if (key.length === 1 && key.match(/[a-z]/i)) {
                if (currentGuess.length < this.selectedWordLength) {
                    currentGuess += key.toUpperCase();
                    this.currentGuesses[i] = currentGuess;
                    this.updateBoard(i);
                }
            } else if (key === 'Backspace') {
                currentGuess = currentGuess.slice(0, -1);
                this.currentGuesses[i] = currentGuess;
                this.updateBoard(i);
            } else if (key === 'Enter') {
                if (currentGuess.length === this.selectedWordLength) {
                    if (this.submittedWords[i].has(currentGuess)) {
                        this.showMessage('Palavra já tentada!', 'red');
                    } else if (this.isValidWord(currentGuess)) {
						for (let i = 0; i < this.selectedWordCount; i++) {
							if (this.gameWon[i] || this.gameLost[i]) continue;
							this.submittedWords[i].add(currentGuess);
							this.checkGuess(i);
						}
                    } else {
                        this.showMessage('Palavra inválida!', 'red');
                        const boardElement = document.getElementById(`board-${i}`);
                        const currentRowElement = boardElement.children[this.currentRows[i]];
                        currentRowElement.classList.add('shake');
                        currentRowElement.addEventListener('animationend', () => {
                            currentRowElement.classList.remove('shake');
                        }, { once: true });
                    }
                }
            }
        }
    }

    updateBoard(boardIndex) {
        const boardElement = document.getElementById(`board-${boardIndex}`);
        const currentRowElement = boardElement.children[this.currentRows[boardIndex]];
        const currentGuess = this.currentGuesses[boardIndex];

        for (let i = 0; i < this.selectedWordLength; i++) {
            const tile = currentRowElement.children[i];
            tile.textContent = currentGuess[i] || '';
            tile.classList.remove('correct', 'present', 'absent', 'flip');
        }
    }

    checkGuess(boardIndex) {
        const guess = this.currentGuesses[boardIndex];
        const secretWord = this.gameWords[boardIndex];
        const boardElement = document.getElementById(`board-${boardIndex}`);
        const currentRowElement = boardElement.children[this.currentRows[boardIndex]];

        const secretWordLetters = secretWord.split('');
        const guessLetters = guess.split('');

        const secretLetterCounts = {};
        for (const char of secretWordLetters) {
            secretLetterCounts[char] = (secretLetterCounts[char] || 0) + 1;
        }

        const letterStatus = {};
        const tileResults = Array(this.selectedWordLength).fill('');

        for (let i = 0; i < this.selectedWordLength; i++) {
            if (guessLetters[i] === secretWordLetters[i]) {
                tileResults[i] = 'correct';
                secretLetterCounts[guessLetters[i]]--;
            }
        }

        for (let i = 0; i < this.selectedWordLength; i++) {
            if (tileResults[i] === '') {
                const letter = guessLetters[i];
                if (secretLetterCounts[letter] > 0) {
                    tileResults[i] = 'present';
                    secretLetterCounts[letter]--;
                } else {
                    tileResults[i] = 'absent';
                }
            }
        }

        for (let i = 0; i < this.selectedWordLength; i++) {
            const tile = currentRowElement.children[i];
            const letter = guessLetters[i];
            const result = tileResults[i];

            // Apply classes with a delay for sequential flip animation
            setTimeout(() => {
                tile.classList.add('flip');
                tile.classList.add(result);

                // Update keyboard status based on the best match for each letter
                if (result === 'correct') {
                    letterStatus[letter] = 'correct';
                } else if (result === 'present' && letterStatus[letter] !== 'correct') {
                    letterStatus[letter] = 'present';
                } else if (letterStatus[letter] !== 'correct' && letterStatus[letter] !== 'present') {
                    letterStatus[letter] = 'absent';
                }

                // Update keyboard colors after each tile flips
                if (i === this.selectedWordLength - 1) { // Only update keyboard after the last tile flips
                    for (const key in letterStatus) {
                        const button = document.querySelector(`.keyboard-button[data-key="${key.toLowerCase()}"]`);
                        if (button) {
                            if (letterStatus[key] === 'correct') {
                                button.classList.remove('present', 'absent');
                                button.classList.add('correct');
                            } else if (letterStatus[key] === 'present' && !button.classList.contains('correct')) {
                                button.classList.remove('absent');
                                button.classList.add('present');
                            } else if (letterStatus[key] === 'absent' && !button.classList.contains('correct') && !button.classList.contains('present')) {
                                button.classList.add('absent');
                            }
                        }
                    }
                }
            }, i * 150); // 150ms delay between each tile flip
        }

        for (const letter in letterStatus) {
            const button = document.querySelector(`.keyboard-button[data-key="${letter.toLowerCase()}"]`);
            if (button) {
                if (letterStatus[letter] === 'correct') {
                    button.classList.remove('present', 'absent');
                    button.classList.add('correct');
                } else if (letterStatus[letter] === 'present' && !button.classList.contains('correct')) {
                    button.classList.remove('absent');
                    button.classList.add('present');
                } else if (letterStatus[letter] === 'absent' && !button.classList.contains('correct') && !button.classList.contains('present')) {
                    button.classList.add('absent');
                }
            }
        }

        if (guess === secretWord) {
            this.gameWon[boardIndex] = true;
            // Add shine effect to the current row
            currentRowElement.classList.add('shine');
        } else {
            this.currentRows[boardIndex]++;
            if (this.currentRows[boardIndex] >= this.selectedChances) {
                this.gameLost[boardIndex] = true;
            }
        }

        this.currentGuesses[boardIndex] = '';
        this.checkOverallGameStatus();
    }

    checkOverallGameStatus() {
        const allBoardsWon = this.gameWon.every(status => status === true);
        const allBoardsFinished = this.gameWon.map((won, i) => won || this.gameLost[i]).every(status => status === true);

        if (allBoardsWon) {
            this.showMessage('Parabéns! Você acertou todas as palavras!', 'green');
        } else if (allBoardsFinished) {
            let lostWords = [];
            this.gameLost.forEach((lost, index) => {
                if (lost) {
                    lostWords.push(this.gameWords[index]);
                }
            });
            this.showMessage(`Fim de jogo! As palavras eram: ${lostWords.join(', ')}`, 'red');
        }
    }
}

new Game();