// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const retryBtn = document.getElementById('retry-btn');
const newQuizBtn = document.getElementById('new-quiz-btn');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options');
const questionNumberElement = document.getElementById('question-number');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const totalQuestionsElement = document.getElementById('total-questions');
const correctAnswersElement = document.getElementById('correct-answers');
const wrongAnswersElement = document.getElementById('wrong-answers');
const accuracyElement = document.getElementById('accuracy');

// Quiz Variables
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let timer;
let timeLeft;
let selectedOption = null;
let quizConfig = {
    difficulty: 'easy',
    type: 'multiple',
    amount: 10
};

// Event Listeners
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
retryBtn.addEventListener('click', retryQuiz);
newQuizBtn.addEventListener('click', newQuiz);

// Difficulty and type select elements
document.getElementById('difficulty').addEventListener('change', (e) => {
    quizConfig.difficulty = e.target.value;
});

document.getElementById('question-type').addEventListener('change', (e) => {
    quizConfig.type = e.target.value;
});

document.getElementById('question-count').addEventListener('change', (e) => {
    quizConfig.amount = parseInt(e.target.value);
});

// Functions
async function startQuiz() {
    try {
        // Show loading state
        startBtn.disabled = true;
        startBtn.textContent = 'Loading Questions...';
        
        // Fetch questions from API
        const apiUrl = `https://opentdb.com/api.php?amount=${quizConfig.amount}&category=18&difficulty=${quizConfig.difficulty}&type=${quizConfig.type}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.response_code === 0) {
            questions = data.results;
            resetQuiz();
            showScreen(quizScreen);
            showQuestion();
        } else {
            throw new Error('Could not fetch questions. Please try again.');
        }
    } catch (error) {
        alert(error.message);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Quiz';
    }
}

function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    updateScore();
    selectedOption = null;
}

function showScreen(screen) {
    document.querySelector('.screen.active').classList.remove('active');
    screen.classList.add('active');
}

function showQuestion() {
    resetQuestionState();
    const currentQuestion = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    
    // Update question number
    questionNumberElement.textContent = `Question ${questionNumber}/${questions.length}`;
    
    // Decode and display question
    questionElement.innerHTML = decodeHtmlEntities(currentQuestion.question);
    
    // Display options
    if (currentQuestion.type === 'boolean') {
        displayBooleanOptions(currentQuestion);
    } else {
        displayMultipleOptions(currentQuestion);
    }
    
    // Start timer
    startTimer();
}

function displayBooleanOptions(question) {
    optionsContainer.innerHTML = '';
    
    const trueOption = document.createElement('div');
    trueOption.classList.add('option');
    trueOption.textContent = 'True';
    trueOption.addEventListener('click', () => selectOption(trueOption, 'True'));
    
    const falseOption = document.createElement('div');
    falseOption.classList.add('option');
    falseOption.textContent = 'False';
    falseOption.addEventListener('click', () => selectOption(falseOption, 'False'));
    
    optionsContainer.appendChild(trueOption);
    optionsContainer.appendChild(falseOption);
}

function displayMultipleOptions(question) {
    optionsContainer.innerHTML = '';
    
    // Combine correct and incorrect answers
    const allOptions = [...question.incorrect_answers, question.correct_answer];
    
    // Shuffle options
    const shuffledOptions = shuffleArray(allOptions);
    
    // Create option elements
    shuffledOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.innerHTML = decodeHtmlEntities(option);
        optionElement.addEventListener('click', () => selectOption(optionElement, option));
        optionsContainer.appendChild(optionElement);
    });
}

function selectOption(optionElement, optionValue) {
    if (selectedOption !== null) return;
    
    selectedOption = optionValue;
    optionElement.classList.add('selected');
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = optionValue === currentQuestion.correct_answer;
    
    if (isCorrect) {
        optionElement.classList.add('correct');
        score++;
        updateScore();
    } else {
        optionElement.classList.add('wrong');
        // Highlight correct answer
        Array.from(optionsContainer.children).forEach(opt => {
            if (opt.textContent === decodeHtmlEntities(currentQuestion.correct_answer)) {
                opt.classList.add('correct');
            }
        });
    }
    
    // Enable next button
    nextBtn.disabled = false;
    
    // Stop timer
    clearInterval(timer);
}

function resetQuestionState() {
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Reset UI state
    nextBtn.disabled = true;
    selectedOption = null;
    
    // Reset timer
    clearInterval(timer);
    timeLeft = 30;
    updateTimerDisplay();
}

function startTimer() {
    timeLeft = 30;
    updateTimerDisplay();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    let timerColor = 'inherit';
    
    if (timeLeft <= 10) {
        timerColor = timeLeft <= 5 ? 'var(--timer-danger)' : 'var(--timer-warning)';
        timerElement.classList.add('pulse');
    } else {
        timerElement.classList.remove('pulse');
    }
    
    timerElement.textContent = `${timeLeft}s`;
    timerElement.style.color = timerColor;
}

function handleTimeOut() {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Mark all options as disabled
    Array.from(optionsContainer.children).forEach(opt => {
        opt.style.pointerEvents = 'none';
        
        // Highlight correct answer
        if (opt.textContent === decodeHtmlEntities(currentQuestion.correct_answer)) {
            opt.classList.add('correct');
        }
    });
    
    // Enable next button
    nextBtn.disabled = false;
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showScreen(resultScreen);
    
    finalScoreElement.textContent = score;
    totalQuestionsElement.textContent = questions.length;
    correctAnswersElement.textContent = score;
    wrongAnswersElement.textContent = questions.length - score;
    
    const accuracy = Math.round((score / questions.length) * 100);
    accuracyElement.textContent = accuracy;
}

function retryQuiz() {
    resetQuiz();
    showScreen(quizScreen);
    showQuestion();
}

function newQuiz() {
    showScreen(startScreen);
    startBtn.disabled = false;
    startBtn.textContent = 'Start Quiz';
}

function updateScore() {
    scoreElement.textContent = score;
}

// Helper Functions
function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}