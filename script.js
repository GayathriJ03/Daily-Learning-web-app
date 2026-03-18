document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const vocabularySection = document.getElementById('vocabulary-section');
    const quizSection = document.getElementById('quiz-section');
    const cardsContainer = document.getElementById('cards-container');
    const quizContainer = document.getElementById('quiz-container');
    const nextWordsBtn = document.getElementById('next-words-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResults = document.getElementById('quiz-results');
    const scoreDisplay = document.getElementById('score-display');
    const reviewWordsBtn = document.getElementById('review-words-btn');
    const restartAppBtn = document.getElementById('restart-app-btn');

    let allWords = [];
    let currentWords = [];
    let currentQuizData = [];
    let wordIndex = 0;

    // Load vocabulary data
    if (typeof vocabData !== 'undefined') {
        allWords = shuffle(vocabData);
        loadNextWords();
    } else {
        console.error('Error: vocabData is not defined');
        cardsContainer.innerHTML = '<div class="error" style="color: var(--secondary-color); text-align: center; font-weight: 500; font-size: 1.1rem; padding: 20px;">Failed to load vocabulary data. Make sure vocab.js is included properly.</div>';
    }

    // Event Listeners
    nextWordsBtn.addEventListener('click', () => {
        vocabularySection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        quizResults.classList.add('hidden');
        submitQuizBtn.classList.remove('hidden');
        generateQuiz();
    });

    submitQuizBtn.addEventListener('click', evaluateQuiz);

    reviewWordsBtn.addEventListener('click', () => {
        quizSection.classList.add('hidden');
        vocabularySection.classList.remove('hidden');
    });

    restartAppBtn.addEventListener('click', () => {
        quizSection.classList.add('hidden');
        vocabularySection.classList.remove('hidden');
        loadNextWords();
    });

    // Functions
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function loadNextWords() {
        if (allWords.length === 0) return;
        
        // Pick 5 distinct words sequentially
        currentWords = [];
        for (let i = 0; i < 5; i++) {
            currentWords.push(allWords[wordIndex]);
            wordIndex++;
            
            // Wrap around and reshuffle if we reach the end of the array
            if (wordIndex >= allWords.length) {
                wordIndex = 0;
                shuffle(allWords);
            }
        }
        
        displayWords();
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    function displayWords() {
        cardsContainer.innerHTML = '';
        currentWords.forEach(wordObj => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.innerHTML = `
                <div class="word-title">
                    <span>${wordObj.word}</span>
                    <span class="word-hindi">${wordObj.hindi}</span>
                </div>
                <div class="word-detail">
                    <strong>Meaning:</strong> ${wordObj.meaning}
                </div>
                <div class="word-detail">
                    <strong>Example:</strong> <em>"${wordObj.example}"</em>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    function generateQuiz() {
        quizContainer.innerHTML = '';
        currentQuizData = [];

        currentWords.forEach((wordObj, index) => {
            const isMeaningQuestion = Math.random() > 0.5;
            let questionText = '';
            let correctAnswer = '';
            let options = [];

            if (isMeaningQuestion) {
                questionText = `What is the meaning of the word "<strong>${wordObj.word}</strong>"?`;
                correctAnswer = wordObj.meaning;
                options = generateOptions(allWords, 'meaning', wordObj.meaning);
            } else {
                questionText = `Which word means: "<em>${wordObj.meaning}</em>"?`;
                correctAnswer = wordObj.word;
                options = generateOptions(allWords, 'word', wordObj.word);
            }

            currentQuizData.push({
                index,
                correctAnswer,
                questionType: isMeaningQuestion ? 'meaning' : 'word'
            });

            const questionDiv = document.createElement('div');
            questionDiv.className = 'quiz-question';
            questionDiv.setAttribute('data-index', index);
            
            let optionsHtml = '';
            options.forEach((opt, optIndex) => {
                const optId = `q${index}-opt${optIndex}`;
                optionsHtml += `
                    <label class="quiz-option" for="${optId}">
                        <input type="radio" name="question${index}" id="${optId}" value="${opt.replace(/"/g, '&quot;')}">
                        <span>${opt}</span>
                    </label>
                `;
            });

            questionDiv.innerHTML = `
                <div class="quiz-question-text">${index + 1}. ${questionText}</div>
                <div class="quiz-options">
                    ${optionsHtml}
                </div>
            `;
            
            quizContainer.appendChild(questionDiv);
        });
    }

    function generateOptions(sourceArray, key, currentCorrectValue) {
        let options = [currentCorrectValue];
        let attempts = 0;
        
        while (options.length < 4 && attempts < 50) {
            attempts++;
            const randomItem = sourceArray[Math.floor(Math.random() * sourceArray.length)];
            const randomVal = randomItem[key];
            
            if (!options.includes(randomVal)) {
                options.push(randomVal);
            }
        }
        
        return shuffle(options);
    }

    function evaluateQuiz() {
        let score = 0;
        
        currentQuizData.forEach(data => {
            const questionDiv = document.querySelector(`.quiz-question[data-index="${data.index}"]`);
            const selectedOption = questionDiv.querySelector(`input[name="question${data.index}"]:checked`);
            const allOptionLabels = questionDiv.querySelectorAll('.quiz-option');
            
            // Reset styles
            allOptionLabels.forEach(label => {
                label.classList.remove('correct-answer', 'wrong-answer');
            });
            
            if (selectedOption) {
                const selectedValue = selectedOption.value;
                const label = selectedOption.closest('.quiz-option');
                
                if (selectedValue === data.correctAnswer) {
                    score++;
                    label.classList.add('correct-answer');
                } else {
                    label.classList.add('wrong-answer');
                    // Highlight correct answer
                    allOptionLabels.forEach(lbl => {
                        const input = lbl.querySelector('input');
                        if (input.value === data.correctAnswer) {
                            lbl.classList.add('correct-answer');
                        }
                    });
                }
            } else {
                // Highlight correct answer if none selected
                allOptionLabels.forEach(lbl => {
                    const input = lbl.querySelector('input');
                    if (input.value === data.correctAnswer) {
                        lbl.classList.add('correct-answer');
                    }
                });
            }
            
            // disable inputs
            questionDiv.querySelectorAll('input').forEach(input => input.disabled = true);
        });
        
        scoreDisplay.textContent = score;
        submitQuizBtn.classList.add('hidden');
        quizResults.classList.remove('hidden');
        
        // Scroll to results
        quizResults.scrollIntoView({ behavior: 'smooth' });
    }
});
