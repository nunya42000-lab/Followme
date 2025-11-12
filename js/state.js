// --- Application State Variables ---
let settings = { ...DEFAULT_SETTINGS };
let appState = {
    'bananas': getInitialState('bananas'),
    'follows': getInitialState('follows'),
    'piano': getInitialState('piano'), 
    'rounds15': getInitialState('rounds15'),
};
let currentMode = 'bananas'; // This will be updated by loadState()

// --- Timers ---
let initialDelayTimer = null; 
let speedDeleteInterval = null; 

// --- Global DOM Element Variables ---
// (Declared here, assigned in main.js on window.onload)
var sequenceContainer = null;
var customModal = null, modalTitle = null, modalMessage = null, modalConfirm = null, modalCancel = null;
var shareModal = null, closeShare = null;
var copyLinkButton = null, nativeShareButton = null; // NEW Share Modal Buttons
var welcomeModal = null, closeWelcomeModalBtn = null, dontShowWelcomeToggle = null;
var settingsModal = null, settingsModeToggleButton = null, settingsModeDropdown = null;
var openHelpButton = null, openShareButton = null, closeSettings = null;
var followsCountSelect = null, followsChunkSizeSelect = null, followsDelaySelect = null; 
var helpModal = null, helpContentContainer = null, helpTabNav = null, closeHelp = null;
var darkModeToggle = null, speedDeleteToggle = null, pianoAutoplayToggle = null;
var bananasAutoplayToggle = null, followsAutoplayToggle = null, rounds15ClearAfterPlaybackToggle = null;
var audioPlaybackToggle = null, voiceInputToggle = null, sliderLockToggle = null, hapticsToggle = null;
var showWelcomeToggle = null;
var bananasSpeedSlider = null, bananasSpeedDisplay = null;
var pianoSpeedSlider = null, pianoSpeedDisplay = null;
var rounds15SpeedSlider = null, rounds15SpeedDisplay = null;
var uiScaleSlider = null, uiScaleDisplay = null;
var bananasPad = null, followsPad = null, pianoPad = null, rounds15Pad = null;
var allVoiceInputs = null;


// --- State Accessors ---
const getCurrentState = () => appState[currentMode];

// --- State Persistence Functions ---

/**
 * Saves the current app state and settings to localStorage.
 */
function saveState() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        localStorage.setItem(STATE_KEY, JSON.stringify(appState));
    } catch (error) {
        console.error("Failed to save state to localStorage:", error);
    }
}

/**
 * Loads state and settings from localStorage.
 */
function loadState() {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        const storedState = localStorage.getItem(STATE_KEY);

        if (storedSettings) {
            const loadedSettings = JSON.parse(storedSettings);
            // Merge to preserve defaults if new settings are added
            settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
        } else {
            settings = { ...DEFAULT_SETTINGS };
        }

        if (storedState) {
            const loadedState = JSON.parse(storedState);
            // Merge loaded state into the default structure
            appState.bananas = { ...getInitialState('bananas'), ...(loadedState.bananas || {}) };
            appState.follows = { ...getInitialState('follows'), ...(loadedState.follows || {}) };
            appState.piano = { ...getInitialState('piano'), ...(loadedState.piano || {}) };
            appState.rounds15 = { ...getInitialState('rounds15'), ...(loadedState.rounds15 || {}) };
        } else {
             appState = {
                'bananas': getInitialState('bananas'),
                'follows': getInitialState('follows'),
                'piano': getInitialState('piano'), 
                'rounds15': getInitialState('rounds15'),
            };
        }
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        // Clear bad data
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(STATE_KEY);
        settings = { ...DEFAULT_SETTINGS };
         appState = {
            'bananas': getInitialState('bananas'),
            'follows': getInitialState('follows'),
            'piano': getInitialState('piano'), 
            'rounds15': getInitialState('rounds15'),
        };
    }
    
    currentMode = settings.currentMode || 'bananas';
}

// --- Core Functions for State Management ---

function getInitialState(mode) {
    switch (mode) {
        case 'follows':
            return { 
                sequences: Array.from({ length: MAX_SEQUENCES }, () => []),
                sequenceCount: 2,
                nextSequenceIndex: 0
            };
        case 'rounds15': 
            return {
                sequences: [[]], 
                sequenceCount: 1, 
                nextSequenceIndex: 0,
                currentRound: 1,
                maxRound: 15
            };
        case 'bananas':
        case 'piano':
        default:
            return { 
                sequences: [[]], 
                sequenceCount: 1, 
                nextSequenceIndex: 0 
            };
    }
    }
