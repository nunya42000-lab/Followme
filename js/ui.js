// --- UI Rendering ---

function renderSequences() {
    const state = getCurrentState();
    if (!state) return; // Guard against missing state
    
    const { sequences, sequenceCount } = state;
    const activeSequences = sequences.slice(0, sequenceCount);
    if (sequenceContainer) sequenceContainer.innerHTML = '';
    
    const currentTurnIndex = state.nextSequenceIndex % sequenceCount;

    let layoutClasses = 'gap-4 flex-grow mb-6 transition-all duration-300 pt-1 ';

    if (currentMode === 'bananas') {
        layoutClasses += ' flex flex-col max-w-xl mx-auto';
    } else if (currentMode === 'follows') {
        if (sequenceCount === 2) {
            layoutClasses += ' grid grid-cols-2 max-w-3xl mx-auto';
        } else if (sequenceCount === 3) {
            layoutClasses += ' grid grid-cols-3 max-w-4xl mx-auto';
        } else if (sequenceCount === 4) {
            layoutClasses += ' grid grid-cols-4 max-w-5xl mx-auto';
        }
    } else if (currentMode === 'piano' || currentMode === 'rounds15') {
        layoutClasses += ' flex flex-col max-w-2xl mx-auto';
    }
    if (sequenceContainer) sequenceContainer.className = layoutClasses;

    if (currentMode === 'rounds15') {
        const roundDisplay = document.createElement('div');
        roundDisplay.className = 'text-center text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100';
        roundDisplay.id = 'rounds15-round-display';
        roundDisplay.textContent = `Round: ${state.currentRound} / ${state.maxRound}`;
        if (sequenceContainer) sequenceContainer.appendChild(roundDisplay);
    }

    let numColumns = 0;
    if (currentMode === 'bananas') numColumns = 5;
    else if (currentMode === 'follows') {
        if (sequenceCount === 2) numColumns = 4;
        else if (sequenceCount === 3) numColumns = 4;
        else if (sequenceCount === 4) numColumns = 3; 
    } else if (currentMode === 'piano' || currentMode === 'rounds15') numColumns = 5; 
    
    let gridClass = numColumns > 0 ? `grid grid-cols-${numColumns}` : 'flex flex-wrap';
    
    const baseSize = 40;
    const baseFont = 1.1;
    const newSize = baseSize * settings.uiScaleMultiplier;
    const newFont = baseFont * settings.uiScaleMultiplier;
    const sizeStyle = `height: ${newSize}px; line-height: ${newSize}px; font-size: ${newFont}rem;`;

    activeSequences.forEach((set, index) => {
        const isCurrent = currentTurnIndex === index;
        const sequenceDiv = document.createElement('div');
        
        const originalClasses = `p-4 rounded-xl shadow-md transition-all duration-200 ${isCurrent ? 'bg-accent-app scale-[1.02] shadow-lg text-gray-900' : 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'}`;
        sequenceDiv.className = originalClasses;
        sequenceDiv.dataset.originalClasses = originalClasses;
        
        sequenceDiv.innerHTML = `
            <div class="${gridClass} gap-2 min-h-[50px]"> 
                ${set.map(val => `
                    <span class="number-box bg-secondary-app text-white rounded-xl text-center shadow-sm"
                          style="${sizeStyle}">
                        ${val}
                    </span>
                `).join('')}
            </div>
        `;
        if (sequenceContainer) sequenceContainer.appendChild(sequenceDiv);
    });
}

// --- NEW: Welcome Modal Functions ---
function openWelcomeModal() {
    if (!welcomeModal) return;
    if (dontShowWelcomeToggle) dontShowWelcomeToggle.checked = !settings.showWelcomeScreen;
    welcomeModal.classList.remove('opacity-0', 'pointer-events-none');
    welcomeModal.querySelector('div').classList.remove('scale-90');
}

function closeWelcomeModal() {
    if (!welcomeModal) return;
    if (dontShowWelcomeToggle) {
        settings.showWelcomeScreen = !dontShowWelcomeToggle.checked;
        if (showWelcomeToggle) showWelcomeToggle.checked = settings.showWelcomeScreen; // Sync settings toggle
        saveState(); // Save the setting
    }
    welcomeModal.querySelector('div').classList.add('scale-90');
    welcomeModal.classList.add('opacity-0');
    setTimeout(() => welcomeModal.classList.add('pointer-events-none'), 300);
}

// --- Settings Panel Logic ---

function renderModeDropdown() {
    if (!settingsModeDropdown) return;
    settingsModeDropdown.innerHTML = MODES.map(modeKey => `
        <button data-mode-select="${modeKey}" 
                class="w-full text-left px-4 py-3 text-lg font-semibold 
                    ${currentMode === modeKey ? 'bg-primary-app text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'} 
                    transition-colors duration-150">
            ${MODE_LABELS[modeKey]}
        </button>
    `).join('');
}

function toggleModeDropdown(event) {
    event.stopPropagation();
    if (!settingsModeDropdown || !settingsModeToggleButton || !settingsModal) return;
    
    if (settingsModeDropdown.classList.contains('hidden')) {
        renderModeDropdown();
        const rect = settingsModeToggleButton.getBoundingClientRect();
        const modalRect = settingsModal.querySelector('div').getBoundingClientRect();
        settingsModeDropdown.style.position = 'absolute';
        settingsModeDropdown.style.left = `${rect.left - modalRect.left}px`;
        settingsModeDropdown.style.width = `${rect.width}px`;
        settingsModeDropdown.style.top = `${rect.bottom - modalRect.top}px`;
        
        settingsModeDropdown.classList.remove('hidden');
        setTimeout(() => settingsModeDropdown.classList.remove('opacity-0'), 10);
        document.addEventListener('click', closeModeDropdownOnOutsideClick, true);
    } else {
        closeModeDropdown();
    }
}

function closeModeDropdown() {
    if (!settingsModeDropdown) return;
    settingsModeDropdown.classList.add('opacity-0');
    setTimeout(() => settingsModeDropdown.classList.add('hidden'), 200);
    document.removeEventListener('click', closeModeDropdownOnOutsideClick, true);
}

function closeModeDropdownOnOutsideClick(event) {
    if (!event.target.closest('#settings-mode-toggle-button') && !event.target.closest('#settings-mode-dropdown')) {
        closeModeDropdown();
    }
}

function handleModeSelection(newMode) {
    closeModeDropdown();
    updateMode(newMode);
}

function openSettingsModal() {
    if (!settingsModeToggleButton) return;
    settingsModeToggleButton.innerHTML = `
        ${MODE_LABELS[currentMode]}
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    `;
    
    // --- Load current state into settings controls ---
    if (followsCountSelect) followsCountSelect.value = appState['follows'].sequenceCount;
    if (followsChunkSizeSelect) followsChunkSizeSelect.value = settings.followsChunkSize;
    if (followsDelaySelect) followsDelaySelect.value = settings.followsInterSequenceDelay; 
    
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

    if (bananasSpeedSlider) bananasSpeedSlider.value = settings.bananasSpeedMultiplier * 100;
    updateSpeedDisplay(settings.bananasSpeedMultiplier, bananasSpeedDisplay);
    if (pianoSpeedSlider) pianoSpeedSlider.value = settings.pianoSpeedMultiplier * 100;
    updateSpeedDisplay(settings.pianoSpeedMultiplier, pianoSpeedDisplay);
    if (rounds15SpeedSlider) rounds15SpeedSlider.value = settings.rounds15SpeedMultiplier * 100;
    updateSpeedDisplay(settings.rounds15SpeedMultiplier, rounds15SpeedDisplay);
    
    if (uiScaleSlider) uiScaleSlider.value = settings.uiScaleMultiplier * 100;
    updateScaleDisplay(settings.uiScaleMultiplier, uiScaleDisplay);
    
    updateSliderLockState();
    
    if (settingsModal) {
        settingsModal.classList.remove('opacity-0', 'pointer-events-none');
        settingsModal.querySelector('div').classList.remove('scale-90');
    }
}

function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.querySelector('div').classList.add('scale-90');
        settingsModal.classList.add('opacity-0');
        setTimeout(() => settingsModal.classList.add('pointer-events-none'), 300);
    }
}

// --- UPDATED: Help Modal Logic (with Tabs) ---

function openHelpModal() {
    // Generate content for all tabs
    generateGeneralHelp();
    generateModesHelp();
    generateSettingsHelp();
    generatePromptsHelp();
    
    // Set up tab listeners
    if (helpTabNav) {
        helpTabNav.addEventListener('click', handleHelpTabClick);
    }
    
    // Show the 'general' tab by default
    switchHelpTab('general');

    if (helpModal) {
        helpModal.classList.remove('opacity-0', 'pointer-events-none');
        helpModal.querySelector('div').classList.remove('scale-90');
    }
}

function closeHelpModal() {
    if (helpTabNav) {
        helpTabNav.removeEventListener('click', handleHelpTabClick);
    }
    
    // Move prompts section back to body
    const promptSection = document.getElementById('virtual-assistant-prompts');
    if (promptSection) {
        promptSection.classList.add('hidden');
        document.body.appendChild(promptSection);
    }

    if (helpModal) {
        helpModal.querySelector('div').classList.add('scale-90');
        helpModal.classList.add('opacity-0');
        setTimeout(() => {
            helpModal.classList.add('pointer-events-none');
        }, 300);
    }
}

function handleHelpTabClick(event) {
    const button = event.target.closest('button[data-tab]');
    if (button) {
        switchHelpTab(button.dataset.tab);
    }
}

function switchHelpTab(tabId) {
    // Hide all content
    if (helpContentContainer) {
        helpContentContainer.querySelectorAll('.help-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
    }
    // Deactivate all buttons
    if (helpTabNav) {
        helpTabNav.querySelectorAll('.help-tab-button').forEach(btn => {
            btn.classList.remove('active-tab');
        });
    }
    
    // Show selected content
    const content = document.getElementById(`help-tab-${tabId}`);
    if (content) {
        content.classList.remove('hidden');
    }
    // Activate selected button
    if (helpTabNav) {
        const button = helpTabNav.querySelector(`button[data-tab="${tabId}"]`);
        if (button) {
            button.classList.add('active-tab');
        }
    }
}

function generateGeneralHelp() {
    const container = document.getElementById('help-tab-general');
    if (!container) return;
    container.innerHTML = `
        <h4 class="text-primary-app">App Overview</h4>
        <p>This is a multi-mode number/sequence tracker designed to help you practice memorization and pattern recognition. Use the Settings menu (⚙️) to switch between four distinct modes.</p>

        <h4 class="text-primary-app">Basic Controls</h4>
        <ul>
            <li><span class="font-bold">Keypad:</span> Tap the numbers (or piano keys) to add them to the current sequence.</li>
            <li><span class="font-bold">Play (▶):</span> Plays back the current sequence(s). The demo will flash the keys and (if enabled) speak the values.</li>
            <li><span class="font-bold">Backspace (←):</span> Removes the last entered value.</li>
            <li><span class="font-bold">Settings (⚙️):</span> Opens the main settings panel, where you can change modes, adjust speeds, and toggle features.</li>
            <li><span class="font-bold">Share (📤):</span> Inside Settings, this button shows a QR code and share options to open the app on another device.</li>
        </ul>
        
        <h4 class="text-primary-app">Global Features</h4>
        <ul>
            <li><span class="font-bold">Voice Input (🎤):</span> When enabled in Settings, a text field appears. Tap it to use your <strong>keyboard's</strong> microphone (dictation) to enter numbers. The sequence updates instantly.</li>
            <li><span class="font-bold">Speed Deleting:</span> Hold the backspace key to quickly delete many entries (On by default).</li>
            <li><span class="font-bold">Audio Playback:</span> Speaks the sequence during demo playback (On by default).</li>
            <li><span class="font-bold">Vibration (Haptics):</span> Provides a short vibration on key presses for tactile feedback (On by default).</li>
        </ul>
    `;
}

function generateModesHelp() {
    const container = document.getElementById('help-tab-modes');
    if (!container) return;
    container.innerHTML = `
        <h4 class="text-primary-app">1. Bananas</h4>
        <p>A simple, single-sequence tracker.</p>
        <ul>
            <li><span class="font-bold">Input:</span> Numbers 1 through 9.</li>
            <li><span class="font-bold">Max Length:</span> 25 numbers.</li>
            <li><span class="font-bold">Demo:</span> Plays back the full sequence.</li>
            <li><span class="font-bold">Autoplay Option:</span> Plays the demo automatically every time you enter a new number.</li>
        </ul>

        <h4 class="text-primary-app">2. follows</h4>
        <p>Tracks multiple sequences at once. Your inputs cycle through the active sequences (e.g., S1, S2, S1, S2...).</p>
        <ul>
            <li><span class="font-bold">Input:</span> Numbers 1 through 9.</li>
            <li><span class="font-bold">Max Length:</span> 25 numbers per sequence.</li>
            <li><span class="font-bold">Sequences:</span> Choose 2, 3, or 4 sequences in Settings.</li>
            <li><span class="font-bold">Demo (▶):</span> Plays back all sequences in "chunks".</li>
            <li><span class="font-bold">Chunk Size:</span> In Settings, set how many numbers to play from one sequence before moving to the next (e.g., 3 from S1, 3 from S2...).</li>
            <li><span class="font-bold">Inter-Sequence Delay:</span> In Settings, add a pause (0.0s - 1.0s) when playback switches from one sequence to the next.</li>
            <li><span class="font-bold">Autoplay Option:</span> Plays the demo automatically after you add a number to the *last* sequence.</li>
        </ul>
        
        <h4 class="text-primary-app">3. piano</h4>
        <p>Record musical notes and sharps.</p>
        <ul>
            <li><span class="font-bold">Input:</span> White keys (C-B) and black keys (1-5).</li>
            <li><span class="font-bold">Max Length:</span> 20 notes.</li>
            <li><span class="font-bold">Demo:</span> Plays back the recorded sequence, flashing the keys as it goes.</li>
            <li><span class="font-bold">Autoplay Option:</span> Plays the demo automatically every time you enter a new note.</li>
        </ul>

        <h4 class="text-primary-app">4. 15 rounds</h4>
        <p>A guided mode where each round's length increases by one, up to 15.</p>
        <ul>
            <li><span class="font-bold">Workflow:</span> Enter the sequence for the current round (e.g., 3 numbers for Round 3).</li>
            <li><span class="font-bold">Automatic Playback:</span> As soon as you enter the last number for the round, the app automatically plays it back.</li>
            <li><span class="font-bold">Auto-Clear/Advance:</span> After playback, the sequence automatically clears, and the app advances to the next round (On by default).</li>
            <li><span class="font-bold" style="color: #dc2626;">RESET</span>: Hit the RESET button to go back to Round 1.</li>
        </ul>
    `;
}

function generateSettingsHelp() {
    const container = document.getElementById('help-tab-settings');
    if (!container) return;
    container.innerHTML = `
        <p>The Settings panel (⚙️) is your control center. Here's what everything does.</p>
        
        <h4 class="text-primary-app">Mode & Follows</h4>
        <ul>
            <li><span class="font-bold">Current Mode:</span> Tap this button to open a dropdown and switch between Bananas, Follows, Piano, and 15 rounds.</li>
            <li><span class="font-bold">Follows Sequences:</span> (Follows mode only) Choose 2, 3, or 4 active sequences.</li>
            <li><span class="font-bold">Numbers per sequence:</span> (Follows mode only) Sets the "chunk size" for playback (e.g., play 3 from S1, then 3 from S2...).</li>
            <li><span class="font-bold">Delay between sequences:</span> (Follows mode only) Adds a pause (0.0s - 1.0s) when the demo switches between sequences.</li>
        </ul>
        
        <h4 class="text-primary-app">Toggles</h4>
        <ul>
            <li><span class="font-bold">Show Welcome Screen:</span> Toggles the introductory pop-up screen when you first open the app.</li>
            <li><span class="font-bold">Dark Mode:</span> Toggles the entire app between Dark and Light themes.</li>
            <li><span class="font-bold">Speed Deleting:</span> Lets you hold Backspace (←) to delete rapidly.</li>
            <li><span class="font-bold">Audio Playback (Speak):</span> Speaks the numbers/notes during demo playback.</li>
            <li><span class="font-bold">Voice Input (Keyboard):</span> Shows/hides the 🎤 text input field for keyboard dictation.</li>
            <li><span class="font-bold">Vibration (Haptics):</span> Enables/disables tactile feedback on key presses.</li>
            <li><span class="font-bold">Lock Sliders:</span> Prevents accidental changes to the speed and size sliders.</li>
            <li><span class="font-bold">Mode-Specific Autoplay:</span> Each mode (Bananas, Follows, Piano) has its own toggle to control if it plays back automatically after an input.</li>
            <li><span class="font-bold">15 rounds Auto-Clear/Advance:</span> Toggles if the app automatically clears the sequence and moves to the next round after playback.</li>
        </ul>
        
        <h4 class="text-primary-app">Playback & Size Controls</h4>
        <ul>
            <li><span class="font-bold">Speed Sliders:</span> Each mode group has its own speed control (50% to 150%) for demo playback.</li>
            <li><span class="font-bold">Sequence Size:</span> Adjusts the visual size of the number boxes in the sequence display (50% to 200%).</li>
        </ul>
        
        <h4 class="text-primary-app">Other</h4>
        <ul>
            <li><span class="font-bold">Restore Defaults:</span> Resets *all* settings (including 'Show Welcome Screen') and clears *all* saved sequences back to their original state.</li>
        </ul>
    `;
}

function generatePromptsHelp() {
    const container = document.getElementById('help-tab-prompts');
    if (!container) return;
    // We need to move the existing prompt section into this tab
    const promptSection = document.getElementById('virtual-assistant-prompts');
    if (promptSection) {
        promptSection.classList.remove('hidden');
        container.appendChild(promptSection);
    } else {
        // Fallback if it's somehow missing (shouldn't happen)
        container.innerHTML = "<p>Virtual assistant prompts could not be loaded.</p>";
    }
}
    
// --- Share Modal Functions ---
function openShareModal() {
    closeSettingsModal();
    if (shareModal) {
        // NEW: Check for Web Share API
        if (navigator.share) {
            if (nativeShareButton) nativeShareButton.classList.remove('hidden');
        } else {
            if (nativeShareButton) nativeShareButton.classList.add('hidden');
        }
        
        // Reset copy button text
        if (copyLinkButton) {
            copyLinkButton.disabled = false;
            copyLinkButton.classList.remove('!bg-btn-control-green');
            copyLinkButton.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg>
                Copy Link
            `;
        }

        shareModal.classList.remove('opacity-0', 'pointer-events-none');
        shareModal.querySelector('div').classList.remove('scale-90');
    }
}

function closeShareModal() {
    if (shareModal) {
        shareModal.querySelector('div').classList.add('scale-90');
        shareModal.classList.add('opacity-0');
        setTimeout(() => shareModal.classList.add('pointer-events-none'), 300);
    }
}
    
// --- Theme, Speed, and Scale Control ---

function updateTheme(isDark) {
    settings.isDarkMode = isDark;
    if (document.body) {
        document.body.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
    }
    renderSequences();
    saveState(); // <<< SAVE STATE
}

function updateModeSpeed(modeKey, multiplier) {
    settings[`${modeKey}SpeedMultiplier`] = multiplier;
    saveState(); // <<< SAVE STATE
}

function updateSpeedDisplay(multiplier, displayElement) {
    const percent = Math.round(multiplier * 100);
    let label = `${percent}%`;
    if (percent === 100) label += ' (Base)';
    else if (percent > 100) label += ' (Fast)';
    else label += ' (Slow)';
    if (displayElement) displayElement.textContent = label;
}

function updateScaleDisplay(multiplier, displayElement) {
    const percent = Math.round(multiplier * 100);
    let label = `${percent}%`;
    if (percent === 100) label += ' (Base)';
    else if (percent > 100) label += ' (Large)';
    else label += ' (Small)';
    if (displayElement) displayElement.textContent = label;
}

function updateSliderLockState() {
    const locked = settings.areSlidersLocked;
    if (bananasSpeedSlider) bananasSpeedSlider.disabled = locked;
    if (pianoSpeedSlider) pianoSpeedSlider.disabled = locked;
    if (rounds15SpeedSlider) rounds15SpeedSlider.disabled = locked;
    if (uiScaleSlider) uiScaleSlider.disabled = locked;
}

function updateMode(newMode) {
    currentMode = newMode;
    settings.currentMode = newMode; // <<< SAVE CURRENT MODE
    
    if (bananasPad) bananasPad.style.display = currentMode === 'bananas' ? 'block' : 'none';
    if (followsPad) followsPad.style.display = currentMode === 'follows' ? 'block' : 'none';
    if (pianoPad) pianoPad.style.display = currentMode === 'piano' ? 'block' : 'none';
    if (rounds15Pad) rounds15Pad.style.display = currentMode === 'rounds15' ? 'block' : 'none';
    
    if (settingsModal && !settingsModal.classList.contains('pointer-events-none') && settingsModeToggleButton) {
        settingsModeToggleButton.innerHTML = `
            ${MODE_LABELS[newMode]}
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        `;
    }
    renderSequences();
    saveState(); // <<< SAVE STATE
}

function updateVoiceInputVisibility() {
    const isEnabled = settings.isVoiceInputEnabled;
    if (allVoiceInputs) {
        allVoiceInputs.forEach(input => {
            input.classList.toggle('hidden', !isEnabled);
        });
    }
}

// --- Generic Modal/Message Box Implementation ---

function showModal(title, message, onConfirm, confirmText = 'OK', cancelText = 'Cancel') {
    if (!customModal) return;
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    
    // --- FIX: Re-assign global vars ---
    const newConfirmBtn = modalConfirm.cloneNode(true); 
    newConfirmBtn.textContent = confirmText;
    modalConfirm.parentNode.replaceChild(newConfirmBtn, modalConfirm); 
    modalConfirm = newConfirmBtn; // Re-assign global
    
    const newCancelBtn = modalCancel.cloneNode(true);
    newCancelBtn.textContent = cancelText;
    modalCancel.parentNode.replaceChild(newCancelBtn, modalCancel);
    modalCancel = newCancelBtn; // Re-assign global

    modalConfirm.addEventListener('click', () => { onConfirm(); closeModal(); }); 
    modalCancel.addEventListener('click', closeModal); 
    
    modalCancel.style.display = cancelText ? 'inline-block' : 'none';
    
    modalConfirm.className = 'px-4 py-2 text-white rounded-lg transition-colors font-semibold bg-primary-app hover:bg-secondary-app';
    if (confirmText === 'Restore') {
         modalConfirm.className = 'px-4 py-2 text-white rounded-lg transition-colors font-semibold bg-btn-control-red hover:bg-btn-control-red-active';
    }
    
    setTimeout(() => {
        customModal.classList.remove('opacity-0', 'pointer-events-none');
        customModal.querySelector('div').classList.remove('scale-90');
    }, 10);
}

function closeModal() {
    if (customModal) {
        customModal.querySelector('div').classList.add('scale-90');
        customModal.classList.add('opacity-0');
        setTimeout(() => customModal.classList.add('pointer-events-none'), 300);
    }
        }
