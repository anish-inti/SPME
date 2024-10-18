// Initialize global variables
console.log('SPMEV.js loaded');
const state = {
    detectedEmotion: null,
    probabilities: null,
    isLoading: false,
    error: null,
    audioData: null,
    fileName: '',
    isPlaying: false,
    volume: 1,
    isMuted: false,
    emotionHistory: [],
    isRealTimeMode: false,
    highScores: JSON.parse(localStorage.getItem('highScores')) || []
};

let wavesurfer = null;
let mediaRecorder = null;

// DOM elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    waveformContainer: document.getElementById('waveform'),
    canvas: document.getElementById('probabilityChart'),
    playPauseButton: document.getElementById('playPauseButton'),
    volumeSlider: document.getElementById('volumeSlider'),
    muteButton: document.getElementById('muteButton'),
    realTimeButton: document.getElementById('realTimeButton'),
    shareButton: document.getElementById('shareButton'),
    resultsContainer: document.getElementById('results'),
    loadingIndicator: document.getElementById('loading'),
    errorDisplay: document.getElementById('error'),
    dropZone: document.getElementById('dropZone'),
    uploadForm: document.getElementById('uploadForm'),
    uploadButton: document.getElementById('uploadButton'),
    emotionDisplay: document.getElementById('emotionDisplay')
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    console.log('File input element:', fileInput);
    console.log('Upload button element:', uploadButton);
    
    if (fileInput && uploadButton) {
        uploadButton.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    } else {
        console.error('File input or upload button not found');
    }
    
    initializeApp();
});

// Initialize Shepherd.js tour
const tour = new Shepherd.Tour({
    defaultStepOptions: {
        cancelIcon: {
            enabled: true
        },
        classes: 'shepherd-theme-default'
    }
});

// Initialize GSAP animations
gsap.registerPlugin(ScrollTrigger);

// Initialize Chart.js
let emotionChart = null;
let historyChart = null;

// Initialize Toastify
const toast = (message, type = 'info') => {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "center",
        backgroundColor: type === 'error' ? "linear-gradient(to right, #ff5f6d, #ffc371)" : "linear-gradient(to right, #00b09b, #96c93d)",
    }).showToast();
};

// Initialize mobile menu
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

// Initialize FAQ accordion
const faqQuestions = document.querySelectorAll('.faq-question');

// Initialize smooth scrolling
const navLinks = document.querySelectorAll('a[href^="#"]');

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
elements.uploadForm.addEventListener('submit', handleFormSubmit);
elements.fileInput.addEventListener('change', handleFileUpload);
elements.uploadButton.addEventListener('click', () => elements.fileInput.click());
elements.playPauseButton.addEventListener('click', togglePlayPause);
elements.volumeSlider.addEventListener('input', handleVolumeChange);
elements.muteButton.addEventListener('click', toggleMute);
elements.realTimeButton.addEventListener('click', toggleRealTimeMode);
elements.shareButton.addEventListener('click', shareResults);
elements.dropZone.addEventListener('dragover', handleDragOver);
elements.dropZone.addEventListener('drop', handleDrop);

// Initialize WaveSurfer
function initWaveSurfer() {
    if (wavesurfer) {
        wavesurfer.destroy();
    }

    wavesurfer = WaveSurfer.create({
        container: elements.waveformContainer,
        waveColor: '#4F4A85',
        progressColor: '#383351',
        cursorColor: '#383351',
        barWidth: 3,
        barRadius: 3,
        responsive: true,
        height: 150,
    });

    wavesurfer.on('play', () => {
        state.isPlaying = true;
        elements.playPauseButton.textContent = 'Pause';
    });
    wavesurfer.on('pause', () => {
        state.isPlaying = false;
        elements.playPauseButton.textContent = 'Play';
    });
}

// File upload handler
async function handleFileUpload(event) {
    try {
        let file;
        if (event.dataTransfer) {
            file = event.dataTransfer.files[0];
        } else {
            file = event.target.files[0];
        }

        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            throw new Error("Please upload an audio file");
        }

        state.fileName = file.name;
        state.isLoading = true;
        state.error = null;
        updateUI();

        const formData = new FormData();
        formData.append('audio', file);

        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        state.detectedEmotion = data.detected_emotion;
        state.probabilities = data.probabilities;
        state.audioData = URL.createObjectURL(file);
        updateEmotionHistory(data.detected_emotion);
        
        toast("Audio analysis complete");
    } catch (err) {
        state.error = err.message;
        console.error('Error handling file upload:', err);
        toast(err.message, 'error');
    } finally {
        state.isLoading = false;
        updateUI();
    }
}

// UI update function
function updateUI() {
    elements.loadingIndicator.style.display = state.isLoading ? 'block' : 'none';
    elements.errorDisplay.textContent = state.error || '';
    
    if (state.audioData) {
        initWaveSurfer();
        wavesurfer.load(state.audioData);
        initVisualizer();
    }

    if (state.detectedEmotion) {
        displayResults();
    }
}

// Initialize audio visualizer
function initVisualizer() {
    // Implementation of initVisualizer function
    console.log('Initializing audio visualizer');
}

// Display analysis results
function displayResults() {
    elements.emotionDisplay.textContent = `Detected Emotion: ${state.detectedEmotion}`;
    
    // Update probability chart
    const ctx = elements.canvas.getContext('2d');
    if (emotionChart) {
        emotionChart.destroy();
    }
    emotionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(state.probabilities),
            datasets: [{
                label: 'Emotion Probabilities',
                data: Object.values(state.probabilities),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

// Playback control functions
function togglePlayPause() {
    if (wavesurfer) {
        wavesurfer.playPause();
    }
}

function handleVolumeChange(event) {
    state.volume = parseFloat(event.target.value);
    if (wavesurfer) {
        wavesurfer.setVolume(state.volume);
    }
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    if (wavesurfer) {
        wavesurfer.setMute(state.isMuted);
    }
    elements.muteButton.textContent = state.isMuted ? 'Unmute' : 'Mute';
}

// Real-time detection functions
function toggleRealTimeMode() {
    state.isRealTimeMode = !state.isRealTimeMode;
    if (state.isRealTimeMode) {
        startRealTimeDetection();
        elements.realTimeButton.textContent = 'Stop Real-Time Detection';
    } else {
        stopRealTimeDetection();
        elements.realTimeButton.textContent = 'Start Real-Time Detection';
    }
}

function startRealTimeDetection() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = handleRealTimeAudioData;
            mediaRecorder.start(1000); // Collect data every second
        })
        .catch(err => {
            console.error('Error accessing microphone:', err);
            toast('Error accessing microphone. Please check your permissions.', 'error');
        });
}

function stopRealTimeDetection() {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
}

async function handleRealTimeAudioData(event) {
    const audioBlob = event.data;
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
        const response = await fetch('/realtime', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        state.detectedEmotion = data.detected_emotion;
        state.probabilities = data.probabilities;
        updateEmotionHistory(data.detected_emotion);
        updateUI();
    } catch (err) {
        console.error('Error in real-time analysis:', err);
        toast('Error in real-time analysis. Please try again.', 'error');
    }
}

// Helper functions
function updateEmotionHistory(emotion) {
    state.emotionHistory.push({ time: new Date(), emotion });
    if (state.emotionHistory.length > 10) {
        state.emotionHistory.shift();
    }
    
    // Update history chart
    if (historyChart) {
        historyChart.destroy();
    }
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.emotionHistory.map(entry => entry.time.toLocaleTimeString()),
            datasets: [{
                label: 'Emotion History',
                data: state.emotionHistory.map(entry => entry.emotion),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function shareResults() {
    if (state.detectedEmotion) {
        const shareText = `I just analyzed my speech emotion! The detected emotion is: ${state.detectedEmotion}`;
        const shareUrl = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`, '_blank');
    } else {
        toast('No results to share yet. Please analyze an audio file first.', 'error');
    }
}

// Tour functionality
function startTour() {
    tour.addStep({
        id: 'welcome',
        text: 'Welcome to the Speech Emotion Recognition app! Let\'s take a quick tour.',
        buttons: [
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'upload',
        text: 'Click here to upload an audio file for analysis.',
        attachTo: {
            element: elements.uploadButton,
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'realtime',
        text: 'Click here to start real-time emotion detection using your microphone.',
        attachTo: {
            element: elements.realTimeButton,
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'results',
        text: 'Your analysis results will appear here.',
        attachTo: {
            element: elements.resultsContainer,
            on: 'top'
        },
        buttons: [
            {
                text: 'Finish',
                action: tour.complete
            }
        ]
    });

    tour.start();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e);
}

// Initialize the app
function initializeApp() {
    initWaveSurfer();
    // Add any other initialization code here
    console.log('App initialized');
}

// Call initializeApp when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Add this near the top of your file
const socket = io('http://localhost:5000');

// Update your real-time handling function
function handleRealTimeAudioData(audioData) {
    socket.emit('audio_data', audioData);
}

// Add a listener for the emotion results
socket.on('emotion_result', (result) => {
    state.detectedEmotion = result.detected_emotion;
    state.probabilities = result.probabilities;
    updateUI();
});

// Add error handling for socket communication
socket.on('error', (error) => {
    console.error('Socket error:', error);
    toast('An error occurred during real-time analysis', 'error');
});
