/**
 * Main application entry point.
 * Initializes all event listeners and loads the application state.
 */

/**
 * Assigns all global DOM element variables.
 * Must be called after DOM is loaded.
 */
function assignDomElements() {
    // Main UI
    sequenceContainer = document.getElementById('sequence-container');
    
    // Custom Modal
    customModal = document.getElementById('custom-modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    modalConfirm = document.getElementById('modal-confirm');
    modalCancel = document.getElementById('modal-cancel');
    
    // Share Modal
    shareModal = document.getElementById('share-modal');
    closeShare = document.getElementById('close-share');
    copyLinkButton = document.getElementById('copy-link-button'); 
    nativeShareButton = document.getElementById('native-share-button'); 
    
    // Welcome Modal
    welcomeModal = document.getElementById('welcome-modal');
    closeWelcomeModalBtn = document.getElementById('close-welcome-modal');
    dontShowWelcomeToggle = document.getElementById('dont-show-welcome-toggle');

    // Settings Modal
    settingsModal = document.getElementById('settings-modal');
    settingsModeToggleButton = document.getElementById('settings-mode-toggle-button');
    settingsModeDropdown = document.getElementById('settings-mode-dropdown');
    openShareButton = document.getElementById('open-share-button');
    openHelpButton = document.getElementById('open-help-button');
    closeSettings = document.getElementById('close-settings');
    
    // Settings Controls
    followsCountSelect = document.getElementById('follows-count-select');
    followsChunkSizeSelect = document.getElementById('follows-chunk-size-select');
    followsDelaySelect = document.getElementById('follows-delay-select'); 
    
    // Help Modal
    helpModal = document.getElementById('help-modal');
    helpContentContainer = document.getElementById('help-content-container');
    helpTabNav = document.getElementById('help-tab-nav');
    closeHelp = document.getElementById('close-help');

    // Toggles
    darkModeToggle = document.getElementById('dark-mode-toggle');
    speedDeleteToggle = document.getElementById('speed-delete-toggle');
    pianoAutoplayToggle = document.getElementById('piano-autoplay-toggle');
    bananasAutoplayToggle = document.getElementById('bananas-autoplay-toggle');
    followsAutoplayToggle = document.getElementById('follows-autoplay-toggle');
    rounds15ClearAfterPlaybackToggle = document.getElementById('rounds15-clear-after-playback-toggle');
    audioPlaybackToggle = document.getElementById('audio-playback-toggle');
    voiceInputToggle = document.getElementById('voice-input-toggle');
    sliderLockToggle = document.getElementById('slider-lock-toggle');
    hapticsToggle = document.getElementById('haptics-toggle');
    showWelcomeToggle = document.getElementById('show-welcome-toggle');

    // Sliders
    bananasSpeedSlider = document.getElementById('bananas-speed-slider');
    bananasSpeedDisplay = document.getElementById('bananas-speed-display');
    pianoSpeedSlider = document.getElementById('piano-speed-slider');
    pianoSpeedDisplay = document.getElementById('piano-speed-display');
    rounds15SpeedSlider = document.getElementById('rounds15-speed-slider');
    rounds15SpeedDisplay = document.getElementById('rounds15-speed-display');
    uiScaleSlider = document.getElementById('ui-scale-slider');
    uiScaleDisplay = document.getElementById('ui-scale-display');

    // Pads
    bananasPad = document.getElementById('bananas-pad');
    followsPad = document.getElementById('follows-pad');
    pianoPad = document.getElementById('piano-pad');
    rounds15Pad = document.getElementById('rounds15-pad');
    
    // Other
    allVoiceInputs = document.querySelectorAll('.voice-text-input');
}

// --- Event Listeners Setup ---

function initializeListeners() {
    
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const { value, action, mode, modeSelect, copyTarget } = button.dataset;

        if (copyTarget) {
            // ... (Clipboard logic for help prompts - no state changes) ...
            const targetElement = document.getElementById(copyTarget);
            if (targetElement) {
                targetElement.select();
                try {
                    document.execCommand('copy');
                    const originalText = button.innerHTML;
                    button.innerHTML = "Copied!";
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    navigator.clipboard.writeText(targetElement.value).catch(err => {
                        console.error('Clipboard API failed: ', err);
                    });
                }
            }
            return;
        }
        
        if (action === 'open-settings') {
            openSettingsModal();
            return;
        }
        if (action === 'open-help') {
            closeSettingsModal();
            openHelpModal();
            return;
        }
        if (action === 'open-share') {
            openShareModal();
            return;
        }

        // --- NEW: Share Modal Actions ---
        if (action === 'copy-link') {
            navigator.clipboard.writeText(window.location.href).then(() => {
                button.disabled = true;
                button.classList.add('!bg-btn-control-green'); // Uses Tailwind's "!important" override
                button.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    Copied!
                `;
            }).catch(err => {
                console.error('Failed to copy link: ', err);
                button.innerHTML = 'Error Copying';
            });
            return;
        }
        
        if (action === 'native-share') {
            if (navigator.share) {
                navigator.share({
                    title: 'Follow Me App',
                    text: 'Check out this sequence memorization app!',
                    url: window.location.href,
                })
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing:', error));
            }
            return;
        }
        // --- End Share Modal Actions ---

        if (modeSelect) {
            handleModeSelection(modeSelect);
            return;
        }
        
        if (action === 'restore-defaults') {
            handleRestoreDefaults(); // Call the function directly
            return;
        }

        if (action === 'reset-rounds' && mode === 'rounds15') {
            resetRounds15(); // Already saves state
            return;
        }
        if (action === 'play-demo' && mode === 'bananas') {
            handleBananasDemo();
            return;
        }
        if (action === 'play-demo' && mode === 'follows') {
            handleFollowsDemo();
            return;
        }
        if (action === 'demo' && mode === 'piano') {
            handlePianoDemo();
            return;
        }
        if (action === 'demo' && mode === 'rounds15') {
            handleRounds15Demo();
            return;
        }
        
        if (value && mode === currentMode) {
            if ((currentMode === 'bananas' || currentMode === 'follows') && /^[1-9]$/.test(value)) {
                addValue(value); // Already saves state
            }
            else if (currentMode === 'piano' && (/^[1-5]$/.test(value) || /^[A-G]$/.test(value))) {
                if (!settings.isPianoAutoplayEnabled) flashKey(value, 200);
                addValue(value); // Already saves state
            }
            else if (currentMode === 'rounds15' && /^(?:[1-9]|1[0-2])$/.test(value)) {
                addValue(value); // Already saves state
            }
        }
    });
    
    // Voice (Text) Input Listeners
    if (allVoiceInputs) {
        allVoiceInputs.forEach(input => {
            input.addEventListener('input', (event) => {
                const transcript = event.target.value;
                if (transcript && transcript.length > 0) {
                    if (event.target.dataset.mode === currentMode) {
                        processVoiceTranscript(transcript);
                        event.target.value = ''; // Clear after processing
                    } else {
                        event.target.value = ''; // Clear if not in the right mode
                    }
                }
            });
        });
    }
    
    // Backspace Listeners
    document.querySelectorAll('button[data-action="backspace"]').forEach(btn => {
        btn.addEventListener('mousedown', handleBackspaceStart);
        btn.addEventListener('mouseup', handleBackspaceEnd);
        btn.addEventListener('mouseleave', stopSpeedDeleting);
        btn.addEventListener('touchstart', handleBackspaceStart, { passive: false });
        btn.addEventListener('touchend', handleBackspaceEnd);
    });
    
    // --- Modal & Settings Listeners ---
    
    // Welcome Modal
    if (closeWelcomeModalBtn) closeWelcomeModalBtn.addEventListener('click', closeWelcomeModal);
    if (dontShowWelcomeToggle) dontShowWelcomeToggle.addEventListener('change', (e) => {
        settings.showWelcomeScreen = !e.target.checked;
        if (showWelcomeToggle) showWelcomeToggle.checked = settings.showWelcomeScreen; // Sync settings toggle
        saveState();
    });
    
    // Settings Modal
    if (settingsModeToggleButton) settingsModeToggleButton.addEventListener('click', toggleModeDropdown);
    if (closeSettings) closeSettings.addEventListener('click', closeSettingsModal);
    
    if (followsCountSelect) followsCountSelect.addEventListener('change', (event) => {
        const newCount = parseInt(event.target.value);
        const state = appState['follows'];
        state.sequenceCount = newCount;
        state.nextSequenceIndex = 0;
        renderSequences();
        saveState(); // <<< SAVE STATE
    });
    if (followsChunkSizeSelect) followsChunkSizeSelect.addEventListener('change', (event) => {
        settings.followsChunkSize = parseInt(event.target.value);
        saveState(); // <<< SAVE STATE
    });
    if (followsDelaySelect) followsDelaySelect.addEventListener('change', (event) => { 
        settings.followsInterSequenceDelay = parseInt(event.target.value);
        saveState(); // <<< SAVE STATE
    });
    
    // Toggles
    if (showWelcomeToggle) showWelcomeToggle.addEventListener('change', (e) => {
        settings.showWelcomeScreen = e.target.checked;
        if (dontShowWelcomeToggle) dontShowWelcomeToggle.checked = !settings.showWelcomeScreen; // Sync welcome modal toggle
        saveState();
    });
    if (darkModeToggle) darkModeToggle.addEventListener('change', (e) => updateTheme(e.target.checked));
    if (speedDeleteToggle) speedDeleteToggle.addEventListener('change', (e) => {
        settings.isSpeedDeletingEnabled = e.target.checked;
        saveState();
    });
    if (pianoAutoplayToggle) pianoAutoplayToggle.addEventListener('change', (e) => {
        settings.isPianoAutoplayEnabled = e.target.checked;
        saveState();
    });
    if (bananasAutoplayToggle) bananasAutoplayToggle.addEventListener('change', (e) => {
        settings.isBananasAutoplayEnabled = e.target.checked;
        saveState();
    });
    if (followsAutoplayToggle) followsAutoplayToggle.addEventListener('change', (e) => {
        settings.isFollowsAutoplayEnabled = e.target.checked;
        saveState();
    });
    if (rounds15ClearAfterPlaybackToggle) rounds15ClearAfterPlaybackToggle.addEventListener('change', (e) => {
        settings.isRounds15ClearAfterPlaybackEnabled = e.target.checked;
        saveState();
    });
    if (audioPlaybackToggle) audioPlaybackToggle.addEventListener('change', (e) => {
        settings.isAudioPlaybackEnabled = e.target.checked;
        if (settings.isAudioPlaybackEnabled) speak("Audio");
        saveState();
    });
    if (voiceInputToggle) voiceInputToggle.addEventListener('change', (e) => {
        settings.isVoiceInputEnabled = e.target.checked;
        updateVoiceInputVisibility();
        saveState();
    });
    if (hapticsToggle) hapticsToggle.addEventListener('change', (e) => {
        settings.isHapticsEnabled = e.target.checked;
        if (settings.isHapticsEnabled) vibrate(50);
        saveState();
    });
    if (sliderLockToggle) sliderLockToggle.addEventListener('change', (e) => {
        settings.areSlidersLocked = e.target.checked;
        updateSliderLockState();
        saveState();
    });

    // Sliders
    function setupSpeedSlider(slider, displayElement, modeKey) {
        if (!slider) return;
        slider.addEventListener('input', (event) => {
            const multiplier = parseInt(event.target.value) / 100;
            updateModeSpeed(modeKey, multiplier);
            updateSpeedDisplay(multiplier, displayElement);
        });
    }
    setupSpeedSlider(bananasSpeedSlider, bananasSpeedDisplay, 'bananas');
    setupSpeedSlider(pianoSpeedSlider, pianoSpeedDisplay, 'piano');
    setupSpeedSlider(rounds15SpeedSlider, rounds15SpeedDisplay, 'rounds15');
    
    if (uiScaleSlider) {
        uiScaleSlider.addEventListener('input', (event) => {
            const multiplier = parseInt(event.target.value) / 100;
            settings.uiScaleMultiplier = multiplier;
            updateScaleDisplay(multiplier, uiScaleDisplay);
            renderSequences();
            saveState();
        });
    }
    
    // Other Modals
    if (closeHelp) closeHelp.addEventListener('click', closeHelpModal);
    if (closeShare) closeShare.addEventListener('click', closeShareModal); 
}

// --- Initialization ---
window.onload = function() {
    
    loadState(); // <<< LOAD STATE FIRST
    
    assignDomElements(); // <<< ASSIGN ALL DOM VARIABLES
 
    if ('serviceWorker' in navigator) {
        // UPDATED: Register with absolute path and explicit scope
        navigator.serviceWorker.register('/Follow/sw.js', { scope: '/Follow/' })
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // --- Update UI based on loaded state ---
    updateTheme(settings.isDarkMode);
    updateSpeedDisplay(settings.bananasSpeedMultiplier, bananasSpeedDisplay);
    updateSpeedDisplay(settings.pianoSpeedMultiplier, pianoSpeedDisplay);
    updateSpeedDisplay(settings.rounds15SpeedMultiplier, rounds15SpeedDisplay);
    updateScaleDisplay(settings.uiScaleMultiplier, uiScaleDisplay);
    updateSliderLockState();
    updateVoiceInputVisibility();
    
    initializeListeners();
    
    // Load the last used mode
    updateMode(settings.currentMode || 'bananas');
    
    // --- NEW: Show Welcome Modal ---
    if (settings.showWelcomeScreen) {
        setTimeout(openWelcomeModal, 500); // Give a slight delay
    }
    
    // Pre-load audio
    if (settings.isAudioPlaybackEnabled) speak(" "); 
};
