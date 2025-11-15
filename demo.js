(function() {
    'use strict';

    function speak(text) {
        const settings = StateManager.getSettings();
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

    const getSpeedMultiplier = () => StateManager.getSettings().playbackSpeed;

    function handleSimonDemo() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        const input = settings.currentInput;
        const padSelector = `#pad-${input}`;
        const flashClass = input === 'piano' ? 'flash' : (input === 'key9' ? 'key9-flash' : 'key12-flash');

        const demoButton = document.querySelector(`${padSelector} button[data-action="play-demo"]`);
        const inputKeys = document.querySelectorAll(`${padSelector} button[data-value]`);
        const speedMultiplier = getSpeedMultiplier();
        const currentDelayMs = AppConfig.DEMO_DELAY_BASE_MS / speedMultiplier;
        const numMachines = state.machineCount;
        const activeSequences = state.sequences.slice(0, numMachines);
        const maxLength = Math.max(...activeSequences.map(s => s.length));
        
        if (maxLength === 0 || (demoButton && demoButton.disabled)) {
             if (demoButton && demoButton.disabled) return;
            if (!settings.isAutoplayEnabled) {
                UI.showModal('No Sequence', 'The sequences are empty. Enter some values first!', () => UI.closeModal(), 'OK', '');
            }
            return;
        }
        
        const playlist = [];
        const chunkSize = (numMachines > 1) ? settings.simonChunkSize : maxLength;
        const numChunks = Math.ceil(maxLength / chunkSize);

        for (let chunkNum = 0; chunkNum < numChunks; chunkNum++) {
            for (let seqIndex = 0; seqIndex < numMachines; seqIndex++) {
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
                
                let key = document.querySelector(`${padSelector} button[data-value="${value}"]`);
                const seqBox = document.getElementById(`machine-${seqIndex}`);
                const originalClasses = seqBox ? seqBox.dataset.originalClasses : '';
                
                if (demoButton) demoButton.innerHTML = String(i + 1);
                speak(input === 'piano' ? AppConfig.PIANO_SPEAK_MAP[value] || value : value);

                if (key) {
                    if(input === 'piano') key.classList.add('flash');
                    else key.classList.add(flashClass);
                }
                if (seqBox && numMachines > 1) seqBox.className = 'p-4 rounded-xl shadow-md transition-all duration-200 bg-accent-app scale-[1.02] shadow-lg text-gray-900';
                
                const nextSeqIndex = (i + 1 < playlist.length) ? playlist[i + 1].seqIndex : -1;
                let timeBetweenItems = pauseDuration - flashDuration;
                
                if (numMachines > 1 && nextSeqIndex !== -1 && seqIndex !== nextSeqIndex) {
                    timeBetweenItems += settings.simonInterSequenceDelay;
                }
                
                setTimeout(() => {
                    if (key) {
                        if(input === 'piano') key.classList.remove('flash');
                        else key.classList.remove(flashClass);
                    }
                    if (seqBox && numMachines > 1) seqBox.className = originalClasses;
                    setTimeout(playNextItem, timeBetweenItems); 
                }, flashDuration);
                        
                i++;
            } else {
                if (demoButton) {
                    demoButton.disabled = false;
                    demoButton.innerHTML = '▶'; 
                }
                if (inputKeys) inputKeys.forEach(key => key.disabled = false);
                UI.renderSequences(); // Full refresh to fix highlighting
            }
        }
        playNextItem();
    }

    function handleUniqueRoundsDemo() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        const input = settings.currentInput;
        const padSelector = `#pad-${input}`;
        const flashClass = input === 'piano' ? 'flash' : (input === 'key9' ? 'key9-flash' : 'key12-flash');

        const sequenceToPlay = state.sequences[0]; 
        const demoButton = document.querySelector(`${padSelector} button[data-action="play-demo"]`);
        const allKeys = document.querySelectorAll(`${padSelector} button[data-value]`);
        const speedMultiplier = getSpeedMultiplier();
        const currentDelayMs = AppConfig.DEMO_DELAY_BASE_MS / speedMultiplier;

        if (!demoButton) return;

        if (sequenceToPlay.length === 0 || (demoButton.disabled && !settings.isUniqueRoundsAutoClearEnabled) ) {
            if (demoButton.disabled && !settings.isUniqueRoundsAutoClearEnabled) return;
            UI.showModal('No Sequence', 'The sequence is empty. Enter some values first!', () => UI.closeModal(), 'OK', '');
            if (allKeys) allKeys.forEach(key => key.disabled = false);
            return;
        }

        demoButton.disabled = true;
        if (allKeys) allKeys.forEach(key => key.disabled = true);
        
        let i = 0;
        const flashDuration = 250 * (speedMultiplier > 1 ? (1/speedMultiplier) : 1);
        const pauseDuration = currentDelayMs; 

        function playNextNumber() {
            if (i < sequenceToPlay.length) {
                const value = sequenceToPlay[i]; 
                
                let key = document.querySelector(`${padSelector} button[data-value="${value}"]`);

                demoButton.innerHTML = String(i + 1); 
                speak(input === 'piano' ? AppConfig.PIANO_SPEAK_MAP[value] || value : value); 
                
                if (key) {
                    if(input === 'piano') key.classList.add('flash');
                    else key.classList.add(flashClass);

                    setTimeout(() => {
                        if(input === 'piano') key.classList.remove('flash');
                        else key.classList.remove(flashClass);
                        
                        setTimeout(playNextNumber, pauseDuration - flashDuration);
                    }, flashDuration); 
                } else {
                    setTimeout(playNextNumber, pauseDuration);
                }
                i++;
            } else {
                demoButton.disabled = false;
                demoButton.innerHTML = '▶'; 
                
                if (settings.currentMode === AppConfig.MODES.UNIQUE_ROUNDS && settings.isUniqueRoundsAutoClearEnabled) {
                    setTimeout(AppCore.clearUniqueRoundsSequence, 300); 
                } else {
                    if (allKeys) allKeys.forEach(key => key.disabled = false);
                }
            }
        }
        playNextNumber();
    }

    function handleCurrentDemo() {
        const settings = StateManager.getSettings();
        if (settings.currentMode === AppConfig.MODES.SIMON) {
            handleSimonDemo();
        } else {
            handleUniqueRoundsDemo();
        }
    }

    // Expose to global scope
    window.DemoPlayer = {
        handleCurrentDemo,
        handleUniqueRoundsDemo,
        handleSimonDemo,
        speak
    };

})();
            
