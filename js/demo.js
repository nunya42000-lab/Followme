// --- Audio Playback ---
    
function speak(text) {
    if (!settings.isAudioPlaybackEnabled || !('speechSynthesis'in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; 
        utterance.rate = 1.2; 
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error("Speech synthesis failed:", error);
    }
}

function getSpeedMultiplier(mode) {
    if (mode === 'bananas' || mode === 'follows') return settings.bananasSpeedMultiplier;
    else if (mode === 'piano') return settings.pianoSpeedMultiplier;
    else if (mode === 'rounds15') return settings.rounds15SpeedMultiplier;
    return 1.0; 
}


// --- Demo Logic ---

function handleBananasDemo() {
    const state = appState['bananas'];
    const sequenceToPlay = state.sequences[0]; 
    const demoButton = document.querySelector('#bananas-pad button[data-action="play-demo"]');
    const inputKeys = document.querySelectorAll('#bananas-pad button[data-value]');
    const speedMultiplier = getSpeedMultiplier('bananas');
    const currentDelayMs = DEMO_DELAY_BASE_MS / speedMultiplier;
    
    if (sequenceToPlay.length === 0 || (demoButton && demoButton.disabled)) {
        if (demoButton && demoButton.disabled) return;
        if (!settings.isBananasAutoplayEnabled) {
            showModal('No Sequence', 'The sequence is empty. Enter some numbers first!', () => closeModal(), 'OK', '');
        }
        return;
    }

    if (demoButton) demoButton.disabled = true;
    if (inputKeys) inputKeys.forEach(key => key.disabled = true);
    
    let i = 0;
    const flashDuration = 250 * (speedMultiplier > 1 ? (1/speedMultiplier) : 1); 
    const pauseDuration = currentDelayMs; 

    function playNextNumber() {
        if (i < sequenceToPlay.length) {
            const value = sequenceToPlay[i]; 
            const key = document.querySelector(`#bananas-pad button[data-value="${value}"]`);
            if (demoButton) demoButton.innerHTML = String(i + 1);
            speak(value);
            if (key) {
                key.classList.add('bananas-flash');
                setTimeout(() => {
                    key.classList.remove('bananas-flash');
                    setTimeout(playNextNumber, pauseDuration - flashDuration);
                }, flashDuration); 
            } else {
                setTimeout(playNextNumber, pauseDuration);
            }
            i++;
        } else {
            if (demoButton) {
                demoButton.disabled = false;
                demoButton.innerHTML = '▶'; 
            }
            if (inputKeys) inputKeys.forEach(key => key.disabled = false);
        }
    }
    playNextNumber();
}

function handleFollowsDemo() {
    const state = appState['follows'];
    const demoButton = document.querySelector('#follows-pad button[data-action="play-demo"]');
    const inputKeys = document.querySelectorAll('#follows-pad button[data-value]');
    const speedMultiplier = getSpeedMultiplier('follows');
    const currentDelayMs = DEMO_DELAY_BASE_MS / speedMultiplier;
    const chunkSize = settings.followsChunkSize;
    const numSequences = state.sequenceCount;
    const activeSequences = state.sequences.slice(0, numSequences);
    const maxLength = Math.max(...activeSequences.map(s => s.length));
    
    if (maxLength === 0 || (demoButton && demoButton.disabled)) {
         if (demoButton && demoButton.disabled) return;
        if (!settings.isFollowsAutoplayEnabled) {
            showModal('No Sequence', 'The sequences are empty. Enter some numbers first!', () => closeModal(), 'OK', '');
        }
        return;
    }
    
    const playlist = [];
    const numChunks = Math.ceil(maxLength / chunkSize);

    for (let chunkNum = 0; chunkNum < numChunks; chunkNum++) {
        for (let seqIndex = 0; seqIndex < numSequences; seqIndex++) {
            for (let k = 0; k < chunkSize; k++) {
                const valueIndex = (chunkNum * chunkSize) + k;
                if (valueIndex < activeSequences[seqIndex].length) {
                    const value = activeSequences[seqIndex][valueIndex];
                    playlist.push({ seqIndex: seqIndex, value: value });
                }
            }
        }
    }
    
    if (playlist.length === 0) return;

    if (demoButton) demoButton.disabled = true;
    if (inputKeys) inputKeys.forEach(key => key.disabled = true);
    
    let i = 0;
    const flashDuration = 250 * (speedMultiplier > 1 ? (1/speedMultiplier) : 1); 
    const pauseDuration = currentDelayMs;

    function playNextItem() {
        if (i < playlist.length) {
            const item = playlist[i];
            const { seqIndex, value } = item;
            const key = document.querySelector(`#follows-pad button[data-value="${value}"]`);
            const seqBox = sequenceContainer.children[seqIndex];
            const originalClasses = seqBox ? seqBox.dataset.originalClasses : '';
            
            if (demoButton) demoButton.innerHTML = String(i + 1);
            speak(value);

            if (key) key.classList.add('bananas-flash');
            if (seqBox) seqBox.className = 'p-4 rounded-xl shadow-md transition-all duration-200 bg-accent-app scale-[1.02] shadow-lg text-gray-900';
            
            const nextSeqIndex = (i + 1 < playlist.length) ? playlist[i + 1].seqIndex : -1;
            
            let timeBetweenItems = pauseDuration - flashDuration; // Base pause
            
            if (nextSeqIndex !== -1 && seqIndex !== nextSeqIndex) {
                timeBetweenItems += settings.followsInterSequenceDelay;
            }

            setTimeout(() => {
                if (key) key.classList.remove('bananas-flash');
                if (seqBox) seqBox.className = originalClasses;
                
                setTimeout(playNextItem, timeBetweenItems); 
            }, flashDuration);
                    
            i++;
        } else {
            if (demoButton) {
                demoButton.disabled = false;
                demoButton.innerHTML = '▶'; 
            }
            if (inputKeys) inputKeys.forEach(key => key.disabled = false);
            renderSequences();
        }
    }
    playNextItem();
}

function flashKey(value, duration) {
    const key = document.querySelector(`#piano-pad button[data-value="${value}"]`);
    if (key) {
        key.classList.add('flash');
        setTimeout(() => key.classList.remove('flash'), duration);
    }
}

function handlePianoDemo() {
    const state = appState['piano'];
    const sequenceToPlay = state.sequences[0]; 
    const demoButton = document.querySelector('#piano-pad button[data-action="demo"]');
    const speedMultiplier = getSpeedMultiplier('piano');
    const currentDelayMs = DEMO_DELAY_BASE_MS / speedMultiplier;

    if (sequenceToPlay.length === 0 || (demoButton && demoButton.disabled)) {
        if (!settings.isPianoAutoplayEnabled || (demoButton && demoButton.disabled)) {
             if (demoButton && demoButton.disabled) return; 
            showModal('No Sequence', 'The sequence is empty. Enter some notes first!', () => closeModal(), 'OK', '');
        }
        return;
    }

    if (demoButton) demoButton.disabled = true;
    const keys = document.querySelectorAll('#piano-pad button[data-value]');
    if (keys) keys.forEach(key => key.disabled = true);
    
    const backspaceBtn = document.querySelector('#piano-pad button[data-action="backspace"]');
    const settingsBtn = document.querySelector('#piano-pad button[data-action="open-settings"]');
    if (backspaceBtn) backspaceBtn.disabled = false;
    if (settingsBtn) settingsBtn.disabled = false;

    let i = 0;
    const flashDuration = currentDelayMs * 0.8; 

    function playNextKey() {
        if (i < sequenceToPlay.length) {
            const value = sequenceToPlay[i];
            if (demoButton) demoButton.innerHTML = String(i + 1); 
            speak(PIANO_SPEAK_MAP[value] || value); 
            flashKey(value, flashDuration);
            i++;
            setTimeout(playNextKey, currentDelayMs);
        } else {
            if (demoButton) {
                demoButton.disabled = false;
                demoButton.innerHTML = '▶'; 
            }
            if (keys) keys.forEach(key => key.disabled = false);
        }
    }
    playNextKey();
}

function advanceToNextRound() {
    const state = appState['rounds15'];
    state.currentRound++;
    if (state.currentRound > state.maxRound) {
        state.currentRound = 1;
        showModal('Complete!', `You finished all ${state.maxRound} rounds. Resetting to Round 1.`, () => closeModal(), 'OK', '');
    }
    renderSequences();
    saveState(); // <<< SAVE STATE (round changed)
    const allKeys = document.querySelectorAll('#rounds15-pad button[data-value]');
    if (allKeys) allKeys.forEach(key => key.disabled = false);
}

function resetRounds15() {
    const state = appState['rounds15'];
    state.currentRound = 1;
    state.sequences[0] = [];
    state.nextSequenceIndex = 0;
    const allKeys = document.querySelectorAll('#rounds15-pad button[data-value]');
    if (allKeys) allKeys.forEach(key => key.disabled = false);
    renderSequences();
    saveState(); // <<< SAVE STATE
}

function clearRounds15Sequence() {
    const state = appState['rounds15'];
    const sequence = state.sequences[0];
    
    if (sequence.length === 0) {
        advanceToNextRound();
        return;
    }
    
    if (speedDeleteInterval) clearInterval(speedDeleteInterval);
    speedDeleteInterval = null;

    function rapidDelete() {
        if (sequence.length > 0) {
            sequence.pop();
            state.nextSequenceIndex--;
            renderSequences();
        } else {
            clearInterval(speedDeleteInterval);
            speedDeleteInterval = null;
            saveState(); // <<< SAVE STATE (sequence cleared)
            advanceToNextRound(); 
        }
    }
    setTimeout(() => {
        speedDeleteInterval = setInterval(rapidDelete, SPEED_DELETE_INTERVAL_MS);
    }, 10);
}

function handleRounds15Demo() {
    const state = appState['rounds15'];
    const sequenceToPlay = state.sequences[0]; 
    const demoButton = document.querySelector('#rounds15-pad button[data-action="demo"]');
    const allKeys = document.querySelectorAll('#rounds15-pad button[data-value]');
    const speedMultiplier = settings.rounds15SpeedMultiplier;
    const currentDelayMs = DEMO_DELAY_BASE_MS / speedMultiplier;

    if (!demoButton) return; // Guard

    if (sequenceToPlay.length === 0 || (demoButton.disabled && !settings.isRounds15ClearAfterPlaybackEnabled) ) {
        if (demoButton.disabled && !settings.isRounds15ClearAfterPlaybackEnabled) return;
        showModal('No Sequence', 'The sequence is empty. Enter some numbers first!', () => closeModal(), 'OK', '');
        if (allKeys) allKeys.forEach(key => key.disabled = false);
        return;
    }

    demoButton.disabled = true;
    if (allKeys) allKeys.forEach(key => key.disabled = true);
    
    const backspaceBtn = document.querySelector('#rounds15-pad button[data-action="backspace"]');
    const settingsBtn = document.querySelector('#rounds15-pad button[data-action="open-settings"]');
    const resetBtn = document.querySelector('#rounds15-pad button[data-action="reset-rounds"]');
    if (backspaceBtn) backspaceBtn.disabled = false;
    if (settingsBtn) settingsBtn.disabled = false;
    if (resetBtn) resetBtn.disabled = false;


    let i = 0;
    const flashDuration = 250 * (speedMultiplier > 1 ? (1/speedMultiplier) : 1);
    const pauseDuration = currentDelayMs; 

    function playNextNumber() {
        if (i < sequenceToPlay.length) {
            const value = sequenceToPlay[i]; 
            const key = document.querySelector(`#rounds15-pad button[data-value="${value}"]`);
            demoButton.innerHTML = String(i + 1); 
            speak(value); 
            if (key) {
                key.classList.add('demo-flash-rounds15');
                setTimeout(() => {
                    key.classList.remove('demo-flash-rounds15');
                    setTimeout(playNextNumber, pauseDuration - flashDuration);
                }, flashDuration); 
            } else {
                setTimeout(playNextNumber, pauseDuration);
            }
            i++;
        } else {
            demoButton.disabled = false;
            demoButton.innerHTML = '▶'; 
            
            if (settings.isRounds15ClearAfterPlaybackEnabled) {
                setTimeout(clearRounds15Sequence, 300); 
            } else {
                if (allKeys) allKeys.forEach(key => key.disabled = false);
            }
        }
    }
    playNextNumber();
}

function handleCurrentDemo() {
    switch(currentMode) {
        case 'bananas': handleBananasDemo(); break;
        case 'follows': handleFollowsDemo(); break;
        case 'piano': handlePianoDemo(); break;
        case 'rounds15': handleRounds15Demo(); break;
    }
                               }
               
