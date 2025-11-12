// --- Application State and Constants ---
const MAX_SEQUENCES = 4;
const DEMO_DELAY_BASE_MS = 798;
const SPEED_DELETE_INITIAL_DELAY = 250;
const SPEED_DELETE_INTERVAL_MS = 10;    

// --- localStorage Keys ---
const SETTINGS_KEY = 'followMeAppSettings';
const STATE_KEY = 'followMeAppState';

// Mode Definitions
const MODES = ['bananas', 'follows', 'piano', 'rounds15']; 
const MODE_LABELS = {
    'bananas': 'Bananas',
    'follows': 'follows',
    'piano': 'piano',
    'rounds15': '15 rounds',
};

// Piano mapping for speech
const PIANO_SPEAK_MAP = {
    'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B',
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5'
};

// --- Voice Command Mapping (VALUES ONLY) ---
const VOICE_VALUE_MAP = {
    'one': '1', 'two': '2', 'to': '2', 'three': '3', 'four': '4', 'for': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12',
    'see': 'C', 'dee': 'D', 'e': 'E', 'eff': 'F', 'gee': 'G', 'eh': 'A', 'be': 'B',
    'c': 'C', 'd': 'D', 'f': 'F', 'g': 'G', 'a': 'A', 'b': 'B'
};

// --- Default settings constant ---
const DEFAULT_SETTINGS = {
    isDarkMode: true,
    bananasSpeedMultiplier: 1.0,
    pianoSpeedMultiplier: 1.0, 
    rounds15SpeedMultiplier: 1.0,
    uiScaleMultiplier: 1.0, 
    isSpeedDeletingEnabled: true, 
    isPianoAutoplayEnabled: true, 
    isBananasAutoplayEnabled: true, 
    isFollowsAutoplayEnabled: true, 
    isRounds15ClearAfterPlaybackEnabled: true, 
    isAudioPlaybackEnabled: true,
    isVoiceInputEnabled: true,
    areSlidersLocked: true,
    followsChunkSize: 3, 
    followsInterSequenceDelay: 500,
    currentMode: 'bananas',
    isHapticsEnabled: true, // NEW
    showWelcomeScreen: true, // NEW
};
