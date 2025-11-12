/**
 * Triggers a short vibration, if enabled and supported.
 * UPDATED: Re-added try...catch to prevent OS-level errors
 * from halting script execution.
 */
function vibrate(duration = 10) {
    if (settings.isHapticsEnabled && 'vibrate' in navigator) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Haptics failed, but we don't want it to break the app
            console.warn("Haptic feedback failed.", e);
        }
    }
}

function addValue(value) {
    vibrate(); // <<< ADDED HAPTICS
    
    const state = getCurrentState();
    const { sequences, sequenceCount } = state;
    
    if (sequenceCount === 0) return;

    if (currentMode === 'rounds15' && sequences[0].length >= state.currentRound) return; 
    if (currentMode === 'bananas' && sequences[0].length >= 25) return;
    if (currentMode === 'follows' && sequences[state.nextSequenceIndex % sequenceCount].length >= 25) return;
    if (currentMode === 'piano' && sequences[0].length >= 20) return; 

    const targetIndex = state.nextSequenceIndex % sequenceCount;
    sequences[targetIndex].push(value);
    state.nextSequenceIndex++;
    
    const justFilledIndex = (state.nextSequenceIndex - 1) % sequenceCount;

    renderSequences();
    
    if (currentMode === 'piano' && settings.isPianoAutoplayEnabled) { 
        setTimeout(() => { handlePianoDemo(); }, 100); 
    }
    else if (currentMode === 'bananas' && settings.isBananasAutoplayEnabled) {
        setTimeout(() => { handleBananasDemo(); }, 100); 
    }
    else if (currentMode === 'follows' && settings.isFollowsAutoplayEnabled) {
        if (justFilledIndex === state.sequenceCount - 1) {
             setTimeout(() => { handleFollowsDemo(); }, 100);
        }
    }
    else if (currentMode === 'rounds15') {
        const sequence = state.sequences[0];
        if (sequence.length === state.currentRound) {
            const allKeys = document.querySelectorAll('#rounds15-pad button[data-value]');
            allKeys.forEach(key => key.disabled = true);
            
            setTimeout(() => { handleRounds15Demo(); }, 100); 
        }
    }
    
    saveState(); // <<< SAVE STATE
}

function handleBackspace() {
    vibrate(20); // <<< ADDED HAPTICS
    
    const state = getCurrentState();
    const { sequences, sequenceCount } = state;
    
    if (currentMode === 'rounds15') {
        const demoButton = document.querySelector('#rounds15-pad button[data-action="demo"]');
        if (demoButton && demoButton.disabled) return;
    }
    if (currentMode === 'follows') {
        const demoButton = document.querySelector('#follows-pad button[data-action="play-demo"]');
        if (demoButton && demoButton.disabled) return;
    }

    if (state.nextSequenceIndex === 0) return; 
    
    const lastClickTargetIndex = (state.nextSequenceIndex - 1) % sequenceCount;
    const targetSet = sequences[lastClickTargetIndex];
    
    if (targetSet.length > 0) {
        targetSet.pop();
        state.nextSequenceIndex--; 

        if (currentMode === 'rounds15') {
             const allKeys = document.querySelectorAll('#rounds15-pad button[data-value]');
             allKeys.forEach(key => key.disabled = false);
        }

        renderSequences();
        saveState(); // <<< SAVE STATE
    }
}


// --- Backspace Speed Deleting Logic ---

function stopSpeedDeleting() {
    if (initialDelayTimer) clearTimeout(initialDelayTimer);
    if (speedDeleteInterval) clearInterval(speedDeleteInterval);
    initialDelayTimer = null;
    speedDeleteInterval = null;
}

function handleBackspaceStart(event) {
    event.preventDefault(); 
    stopSpeedDeleting(); 

    if (!settings.isSpeedDeletingEnabled) return;
    
    if (currentMode === 'rounds15') {
        const demoButton = document.querySelector('#rounds15-pad button[data-action="demo"]');
        if (demoButton && demoButton.disabled) return;
    }
    if (currentMode === 'follows') {
        const demoButton = document.querySelector('#follows-pad button[data-action="play-demo"]');
        if (demoButton && demoButton.disabled) return;
    }

    initialDelayTimer = setTimeout(() => {
        handleBackspace();
        speedDeleteInterval = setInterval(handleBackspace, SPEED_DELETE_INTERVAL_MS);
        initialDelayTimer = null; 
    }, SPEED_DELETE_INITIAL_DELAY);
}

function handleBackspaceEnd() {
    if (initialDelayTimer !== null) {
        stopSpeedDeleting();
        handleBackspace(); 
    } 
    else if (!settings.isSpeedDeletingEnabled) {
        handleBackspace();
    } 
    else {
        stopSpeedDeleting();
    }
}

// --- Voice Input Functions (TEXT-BASED) ---

/**
 * Processes the transcript from the text input field.
 * This function only processes VALUES, not commands.
 */
function processVoiceTranscript(transcript) {
    if (!transcript) return;
    
    const cleanTranscript = transcript.toLowerCase().replace(/[\.,]/g, '').trim();
    const words = cleanTranscript.split(' ');
    let valuesAdded = 0;

    // --- Check for Sequence Values ---
    for (const word of words) {
        let value = VOICE_VALUE_MAP[word];
        
        if (!value) {
             const upperWord = word.toUpperCase();
             if (/^[1-9]$/.test(word) || /^(1[0-2])$/.test(word)) { // 1-12
                value = word;
             } else if (/^[A-G]$/.test(upperWord) || /^[1-5]$/.test(word)) { // A-G, 1-5
                value = upperWord;
             }
        }

        if (value) {
            if (currentMode === 'bananas' || currentMode === 'follows') {
                if (/^[1-9]$/.test(value)) {
                    addValue(value);
                    valuesAdded++;
                }
            } else if (currentMode === 'piano') {
                if ((/^[1-5]$/.test(value) || /^[A-G]$/.test(value))) {
                    addValue(value);
                    valuesAdded++;
                }
            } else if (currentMode === 'rounds15') {
                if (/^(?:[1-9]|1[0-2])$/.test(value)) {
                    addValue(value);
                    valuesAdded++;
                }
            }
        }
    }
}

// --- Restore Defaults Function ---
function handleRestoreDefaults() {
    // 1. Reset settings and state
    settings = { ...DEFAULT_SETTINGS }; // This will set showWelcomeScreen to true
    appState = {
        'bananas': getInitialState('bananas'),
        'follows': getInitialState('follows'),
        'piano': getInitialState('piano'), 
        'rounds15': getInitialState('rounds15'),
    };
    currentMode = settings.currentMode; // 'bananas'
    
    // 2. Save the new defaults
    saveState();
    
    // 3. Update all UI elements in the settings panel
    updateTheme(settings.isDarkMode);
    updateVoiceInputVisibility();
    updateSliderLockState();

    // Toggles
    if (showWelcomeToggle) showWelcomeToggle.checked = settings.showWelcomeScreen;
    if (darkModeToggle) darkModeToggle.checked = settings.isDarkMode;
    if (speedDeleteToggle) speedDeleteToggle.checked = settings.isSpeedDeletingEnabled;
    if (pianoAutoplayToggle) pianoAutoplayToggle.checked = settings.isPianoAutoplayEnabled;
    if (bananasAutoplayToggle) bananasAutoplayToggle.checked = settings.isBananasAutoplayEnabled;
    if (followsAutoplayToggle) followsAutoplayToggle.checked = settings.isFollowsAutoplayEnabled;
    if (rounds15ClearAfterPlaybackToggle) rounds15ClearAfterPlaybackToggle.checked = settings.isRounds15ClearAfterPlaybackEnabled;
    if (audioPlaybackToggle) audioPlaybackToggle.checked = settings.isAudioPlaybackEnabled;
    if (voiceInputToggle) voiceInputToggle.checked = settings.isVoiceInputEnabled;
    if (sliderLockToggle) sliderLockToggle.checked = settings.areSlidersLocked;
    if (hapticsToggle) hapticsToggle.checked = settings.isHapticsEnabled;

    // Sliders
    if (bananasSpeedSlider) bananasSpeedSlider.value = settings.bananasSpeedMultiplier * 100;
    updateSpeedDisplay(settings.bananasSpeedMultiplier, bananasSpeedDisplay);
    if (pianoSpeedSlider) pianoSpeedSlider.value = settings.pianoSpeedMultiplier * 100;
    updateSpeedDisplay(settings.pianoSpeedMultiplier, pianoSpeedDisplay);
    if (rounds15SpeedSlider) rounds15SpeedSlider.value = settings.rounds15SpeedMultiplier * 100;
    updateSpeedDisplay(settings.rounds15SpeedMultiplier, rounds15SpeedDisplay);
    if (uiScaleSlider) uiScaleSlider.value = settings.uiScaleMultiplier * 100;
    updateScaleDisplay(settings.uiScaleMultiplier, uiScaleDisplay);

    // Follows Selects
    if (followsCountSelect) followsCountSelect.value = appState['follows'].sequenceCount;
    if (followsChunkSizeSelect) followsChunkSizeSelect.value = settings.followsChunkSize;
    if (followsDelaySelect) followsDelaySelect.value = settings.followsInterSequenceDelay;
    
    // 4. Update the main UI
    updateMode(settings.currentMode); // This also calls renderSequences
    
    // 5. Close the modal
    closeSettingsModal();
}
