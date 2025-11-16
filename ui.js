(function() {
    'use strict';

    // --- 1. DOM Element Variables ---
    const dom = {};
    let gridClass = 'grid grid-cols-5'; // Default

    // --- 2. Modal Management ---
    // ... (All modal functions are the same) ...
    function _toggleModal(modalElement, forceShow) {
        if (!modalElement) return;
        const container = modalElement.querySelector('div');
        if (forceShow) {
            modalElement.classList.remove('opacity-0', 'pointer-events-none');
            if(container) container.classList.remove('scale-90');
        } else {
            if(container) container.classList.add('scale-90');
            modalElement.classList.add('opacity-0');
            setTimeout(() => modalElement.classList.add('pointer-events-none'), 300);
        }
    }

    function showModal(title, message, onConfirm, confirmText = 'OK', cancelText = 'Cancel') {
        if (!dom.customModal) return;
        
        dom.modalTitle.textContent = title;
        dom.modalMessage.textContent = message;
        
        const newConfirmBtn = dom.modalConfirm.cloneNode(true); 
        newConfirmBtn.textContent = confirmText;
        dom.modalConfirm.parentNode.replaceChild(newConfirmBtn, dom.modalConfirm); 
        dom.modalConfirm = newConfirmBtn; 
        
        const newCancelBtn = dom.modalCancel.cloneNode(true);
        newCancelBtn.textContent = cancelText;
        dom.modalCancel.parentNode.replaceChild(newCancelBtn, dom.modalCancel);
        dom.modalCancel = newCancelBtn; 

        newConfirmBtn.addEventListener('click', () => { onConfirm(); closeModal(); }); 
        newCancelBtn.addEventListener('click', closeModal); 
        
        newCancelBtn.style.display = cancelText ? 'inline-block' : 'none';
        
        newConfirmBtn.className = 'px-4 py-2 text-white rounded-lg transition-colors font-semibold bg-primary-app hover:bg-secondary-app';
        if (confirmText === 'Restore' || confirmText === 'Reset') {
             newConfirmBtn.className = 'px-4 py-2 text-white rounded-lg transition-colors font-semibold bg-btn-control-red hover:bg-btn-control-red-active';
        }
        
        _toggleModal(dom.customModal, true);
    }
    function closeModal() { _toggleModal(dom.customModal, false); }

    // --- 3. UI Update Helpers ---
    // ... (All UI update helpers are the same) ...
    function updateTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
        renderSequences();
    }

    function applyGlobalUiScale(scalePercent) {
        if (scalePercent < 50) scalePercent = 50;
        if (scalePercent > 150) scalePercent = 150;
        document.documentElement.style.fontSize = `${scalePercent}%`;
    }

    function updateScaleDisplay(multiplier, displayElement) {
        const percent = Math.round(multiplier * 100);
        if (displayElement) displayElement.textContent = `${percent}%`;
    }

    function updateMachinesDisplay(count, el) {
        if(el) el.textContent = count + (count > 1 ? ' Machines' : ' Machine');
    }
    function updateSequenceLengthDisplay(val, el) {
        if(el) el.textContent = val;
    }
    function updatePlaybackSpeedDisplay(val, el) {
        if(el) el.textContent = val + '%';
    }
    function updateChunkDisplay(val, el) {
        if(el) el.textContent = val;
    }
    function updateDelayDisplay(val, el) {
        if(el) el.textContent = (val / 1000).toFixed(1) + 's';
    }

    function updateInput(newInput) {
        const settings = StateManager.getSettings();
        settings.currentInput = newInput;
        
        dom.padKey9.style.display = (newInput === AppConfig.INPUTS.KEY9) ? 'block' : 'none';
        dom.padKey12.style.display = (newInput === AppConfig.INPUTS.KEY12) ? 'block' : 'none';
        dom.padPiano.style.display = (newInput === AppConfig.INPUTS.PIANO) ? 'block' : 'none';
        
        if (dom.gameSetupModal && !dom.gameSetupModal.classList.contains('pointer-events-none')) {
            dom.machinesSlider.value = StateManager.getCurrentState().machineCount;
            updateMachinesDisplay(StateManager.getCurrentState().machineCount, dom.machinesDisplay);
            updateGameSetupVisibility();
        }

        renderSequences();
        StateManager.saveState(); 
    }

    function updateVoiceInputVisibility() {
        const isEnabled = StateManager.getSettings().isVoiceInputEnabled;
        if (dom.allVoiceInputs) {
            dom.allVoiceInputs.forEach(input => input.classList.toggle('hidden', !isEnabled));
        }
    }

    function updateMainUIControlsVisibility() {
        const settings = StateManager.getSettings();
        dom.allResetButtons.forEach(btn => {
            btn.style.display = (settings.currentMode === AppConfig.MODES.UNIQUE_ROUNDS) ? 'block' : 'none';
        });
    }

    // --- 4. Sequence Rendering ---
    // ... (All sequence rendering functions are the same) ...
    function renderSequences() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        if (!state || !dom.sequenceContainer) return; 

        const { machineCount } = state;
        const activeMachines = (settings.currentMode === AppConfig.MODES.UNIQUE_ROUNDS) ? 1 : machineCount;
        
        dom.sequenceContainer.innerHTML = ''; // Clear container

        let layoutClasses = 'gap-4 flex-grow mb-6 transition-all duration-300 pt-1 ';
        let numColumns = 5;

        if (settings.currentMode === AppConfig.MODES.SIMON) {
            if (activeMachines === 1) {
                layoutClasses += ' flex flex-col max-w-xl mx-auto';
                numColumns = 5;
            } else if (activeMachines === 2) {
                layoutClasses += ' grid grid-cols-2 max-w-3xl mx-auto';
                numColumns = 4;
            } else if (activeMachines === 3) {
                layoutClasses += ' grid grid-cols-3 max-w-4xl mx-auto';
                numColumns = 4;
            } else if (activeMachines === 4) {
                layoutClasses += ' grid grid-cols-4 max-w-5xl mx-auto';
                numColumns = 3;
            }
        } else {
             layoutClasses += ' flex flex-col max-w-2xl mx-auto';
             numColumns = 5;
        }
        dom.sequenceContainer.className = layoutClasses;
        gridClass = numColumns > 0 ? `grid grid-cols-${numColumns}` : 'flex flex-wrap';

        if (settings.currentMode === AppConfig.MODES.UNIQUE_ROUNDS) {
            const roundDisplay = document.createElement('div');
            roundDisplay.className = 'text-center text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100';
            roundDisplay.id = 'unique-rounds-round-display';
            dom.sequenceContainer.appendChild(roundDisplay);
        }
        
        for(let i=0; i < activeMachines; i++) {
            const sequenceDiv = document.createElement('div');
            const originalClasses = 'p-4 rounded-xl shadow-md transition-all duration-200 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100';
            sequenceDiv.className = originalClasses;
            sequenceDiv.dataset.originalClasses = originalClasses;
            sequenceDiv.id = `machine-${i}`;
            sequenceDiv.innerHTML = `<div class="${gridClass} gap-2 min-h-[50px]"></div>`;
            dom.sequenceContainer.appendChild(sequenceDiv);
        }

        for(let i=0; i < activeMachines; i++) {
            updateMachineDisplay(i);
        }
        updateUniqueRoundsDisplay();
    }

    function updateMachineDisplay(index) {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        if (!state) return;

        const machineDiv = document.getElementById(`machine-${index}`);
        if (!machineDiv) return; 

        const sequence = state.sequences[index];
        const innerGrid = machineDiv.querySelector('div'); 
        if (!innerGrid) return;
        
        const baseSize = 40;
        const baseFont = 1.1;
        const newSize = baseSize * settings.uiScaleMultiplier;
        const newFont = baseFont * settings.uiScaleMultiplier;
        const sizeStyle = `height: ${newSize}px; line-height: ${newSize}px; font-size: ${newFont}rem;`;

        innerGrid.innerHTML = sequence.map(val => `
            <span class="number-box bg-secondary-app text-white rounded-xl text-center shadow-sm"
                  style="${sizeStyle}">
                ${val}
            </span>
        `).join('');

        const currentTurnIndex = state.nextSequenceIndex % state.machineCount;
        const isCurrent = (index === currentTurnIndex && state.machineCount > 1 && settings.currentMode === AppConfig.MODES.SIMON);
        const originalClasses = machineDiv.dataset.originalClasses;
        
        if (isCurrent) {
            machineDiv.className = 'p-4 rounded-xl shadow-md transition-all duration-200 bg-accent-app scale-[1.02] shadow-lg text-gray-900';
        } else {
            machineDiv.className = originalClasses;
        }
    }

    function updateUniqueRoundsDisplay() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        if (settings.currentMode !== AppConfig.MODES.UNIQUE_ROUNDS) return;

        const roundDisplay = document.getElementById('unique-rounds-round-display');
        if (roundDisplay) {
            roundDisplay.textContent = `Round: ${state.currentRound} / ${settings.sequenceLength}`;
        }
    }

    // --- 5. Game Setup Modal Logic ---
    // ... (This function is the same, but note the call to dom.dontShowWelcomeToggle) ...
    function openGameSetupModal() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        
        dom.inputSelect.value = settings.currentInput;
        dom.modeToggle.checked = (settings.currentMode === AppConfig.MODES.UNIQUE_ROUNDS);
        
        dom.machinesSlider.value = state.machineCount;
        updateMachinesDisplay(state.machineCount, dom.machinesDisplay);
        
        dom.sequenceLengthSlider.value = settings.sequenceLength;
        updateSequenceLengthDisplay(settings.sequenceLength, dom.sequenceLengthDisplay);
        
        dom.chunkSlider.value = settings.simonChunkSize;
        updateChunkDisplay(settings.simonChunkSize, dom.chunkDisplay);
        
        dom.delaySlider.value = settings.simonInterSequenceDelay;
        updateDelayDisplay(settings.simonInterSequenceDelay, dom.delayDisplay);

        dom.autoclearToggle.checked = settings.isUniqueRoundsAutoClearEnabled;
        
        dom.dontShowWelcomeToggle.checked = !settings.showWelcomeScreen;

        updateGameSetupVisibility();
        _toggleModal(dom.gameSetupModal, true);
    }
    
    // --- THIS FUNCTION IS MODIFIED ---
    function closeGameSetupModal() {
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();

        const newMachineCount = parseInt(dom.machinesSlider.value);
        const newMode = dom.modeToggle.checked ? AppConfig.MODES.UNIQUE_ROUNDS : AppConfig.MODES.SIMON;

        const didModeChange = settings.currentMode !== newMode;
        const didMachineChange = state.machineCount !== newMachineCount;
        const didInputChange = settings.currentInput !== dom.inputSelect.value;
        
        settings.currentInput = dom.inputSelect.value;
        settings.currentMode = newMode;
        settings.sequenceLength = parseInt(dom.sequenceLengthSlider.value);
        settings.simonChunkSize = parseInt(dom.chunkSlider.value);
        settings.simonInterSequenceDelay = parseInt(dom.delaySlider.value);
        settings.isUniqueRoundsAutoClearEnabled = dom.autoclearToggle.checked;
        settings.showWelcomeScreen = !dom.dontShowWelcomeToggle.checked;
        
        // *** REMOVED dom.showWelcomeToggle update ***
        
        const newState = StateManager.getCurrentState(); 
        newState.machineCount = (newMode === AppConfig.MODES.UNIQUE_ROUNDS) ? 1 : newMachineCount;
        newState.maxRound = settings.sequenceLength;

        Object.values(StateManager.getAppState()).forEach(s => {
            s.maxRound = settings.sequenceLength;
        });

        if(didModeChange || didMachineChange || didInputChange) {
            newState.sequences = Array.from({ length: AppConfig.MAX_MACHINES }, () => []);
            newState.nextSequenceIndex = 0;
            newState.currentRound = 1;
        }
        
        updateInput(settings.currentInput);
        updateMainUIControlsVisibility(); 

        StateManager.saveState(); 
        _toggleModal(dom.gameSetupModal, false);
    }
    
    // ... (updateGameSetupVisibility is the same) ...
    function updateGameSetupVisibility() {
        if (!dom.gameSetupModal) return;

        const mode = dom.modeToggle.checked ? AppConfig.MODES.UNIQUE_ROUNDS : AppConfig.MODES.SIMON;
        const machineCount = parseInt(dom.machinesSlider.value);

        if (mode === AppConfig.MODES.SIMON) {
            dom.sequenceLengthLabel.textContent = '4. Sequence Length';
            dom.modeToggleLabel.textContent = 'Off: Simon Says';
        } else {
            dom.sequenceLengthLabel.textContent = '4. Unique Rounds';
            dom.modeToggleLabel.textContent = 'On: Unique Rounds';
        }
        
        dom.machinesSlider.disabled = (mode === AppConfig.MODES.UNIQUE_ROUNDS);
        if (mode === AppConfig.MODES.UNIQUE_ROUNDS) {
             dom.machinesSlider.value = 1;
             updateMachinesDisplay(1, dom.machinesDisplay);
        }

        dom.settingAutoclear.style.display = (mode === AppConfig.MODES.UNIQUE_ROUNDS) ? 'flex' : 'none';

        const showSimonSettings = (mode === AppConfig.MODES.SIMON && machineCount > 1);
        dom.settingMultiSequenceGroup.style.display = showSimonSettings ? 'block' : 'none';
    }


    // --- 6. Settings Modal Logic ---
    
    // --- NEW PRESET FUNCTION ---
    function renderPresetsDropdown() {
        const presets = StateManager.getPresets();
        const settings = StateManager.getSettings();
        
        dom.presetSelect.innerHTML = ''; // Clear existing options
        
        // Find which preset matches the current settings
        let currentPresetName = null;
        const currentSettingsString = JSON.stringify(settings);
        
        for (const name in presets) {
            if (JSON.stringify(presets[name]) === currentSettingsString) {
                currentPresetName = name;
                break;
            }
        }
        
        if (currentPresetName === null) {
            // Current settings are custom / unsaved
            const customOption = document.createElement('option');
            customOption.value = "__custom__";
            customOption.textContent = "Custom Settings";
            customOption.selected = true;
            customOption.disabled = true;
            dom.presetSelect.appendChild(customOption);
        }

        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (name === currentPresetName) {
                option.selected = true;
            }
            dom.presetSelect.appendChild(option);
        }
    }
    
    // --- THIS FUNCTION IS MODIFIED ---
    function openSettingsModal() {
        const settings = StateManager.getSettings();
        
        renderPresetsDropdown(); // <-- NEW: Render presets
        
        dom.playbackSpeedSlider.value = settings.playbackSpeed * 100;
        updatePlaybackSpeedDisplay(settings.playbackSpeed * 100, dom.playbackSpeedDisplay);
        
        // *** REMOVED dom.showWelcomeToggle ***
        dom.darkModeToggle.checked = settings.isDarkMode;
        dom.speedDeleteToggle.checked = settings.isSpeedDeletingEnabled; 
        dom.autoplayToggle.checked = settings.isAutoplayEnabled;
        dom.audioPlaybackToggle.checked = settings.isAudioPlaybackEnabled; 
        dom.voiceInputToggle.checked = settings.isVoiceInputEnabled;
        dom.hapticsToggle.checked = settings.isHapticsEnabled;

        dom.uiScaleSlider.value = settings.uiScaleMultiplier * 100;
        updateScaleDisplay(settings.uiScaleMultiplier, dom.uiScaleDisplay);
        
        _toggleModal(dom.settingsModal, true);
    }
    function closeSettingsModal() { _toggleModal(dom.settingsModal, false); }

    // --- 7. Help Modal Logic ---
    // ... (All help functions are the same, but text is updated) ...
    function openHelpModal() {
        generateGeneralHelp();
        generateModesHelp();
        generateSettingsHelp();
        generatePromptsHelp();
        if (dom.helpTabNav) {
            dom.helpTabNav.addEventListener('click', handleHelpTabClick);
        }
        switchHelpTab('general');
        _toggleModal(dom.helpModal, true);
    }

    function closeHelpModal() {
        if (dom.helpTabNav) {
            dom.helpTabNav.removeEventListener('click', handleHelpTabClick);
        }
        _toggleModal(dom.helpModal, false);
    }

    function handleHelpTabClick(event) {
        const button = event.target.closest('button[data-tab]');
        if (button) {
            switchHelpTab(button.dataset.tab);
        }
    }

    function switchHelpTab(tabId) {
        if (dom.helpContentContainer) {
            dom.helpContentContainer.querySelectorAll('.help-tab-content').forEach(tab => tab.classList.add('hidden'));
        }
        if (dom.helpTabNav) {
            dom.helpTabNav.querySelectorAll('.help-tab-button').forEach(btn => btn.classList.remove('active-tab'));
        }
        const content = document.getElementById(`help-tab-${tabId}`);
        if (content) content.classList.remove('hidden');
        if (dom.helpTabNav) {
            const button = dom.helpTabNav.querySelector(`button[data-tab="${tabId}"]`);
            if (button) button.classList.add('active-tab');
        }
    }

    function generateGeneralHelp() {
        const container = document.getElementById('help-tab-general');
        if (!container) return;
        container.innerHTML = `
            <h4 class="text-primary-app">App Overview</h4>
            <p>This is a multi-mode sequence tracker. Use the Setup screen (on launch or in Settings) to configure your game.</p>
            <h4 class="text-primary-app">Basic Controls</h4>
            <ul>
                <li><span class="font-bold">Keypad:</span> Tap the numbers or keys to add to the sequence.</li>
                <li><span class="font-bold">Play (▶):</span> Plays back the current sequence(s).</li>
                <li><span class="font-bold">Backspace (←):</span> Removes the last value.</li>
                <li><span class="font-bold">Settings (⚙️):</span> Opens app settings (dark mode, speed, etc.).</li>
                <li><span class="font-bold">RESET:</span> (Unique Rounds Mode Only) Resets the game to Round 1.</li>
            </ul>`;
    }

    function generateModesHelp() {
        const container = document.getElementById('help-tab-modes');
        if (!container) return;
        container.innerHTML = `
            <h4 class="text-primary-app">Inputs (The Keypads)</h4>
            <ul>
                <li><span class="font-bold">9-Key:</span> A 3x3 grid (1-9).</li>
                <li><span class="font-bold">12-Key:</span> A 4x3 grid (1-12).</li>
                <li><span class="font-bold">Piano:</span> A 7-key piano with 5 sharps.</li>
            </ul>
            <h4 class="text-primary-app">Modes (The Logic)</h4>
            <ul>
                <li><span class="font-bold">Simon Says (Default):</span> Standard mode. Enter values up to the Sequence Length. Supports 1-4 machines.</li>
                <li><span class="font-bold">Unique Rounds:</span> A round-based game. The sequence length increases by one each round, up to the Sequence Length (15, 20, or 25). This mode is always single-machine.</li>
            </ul>`;
    }

    function generateSettingsHelp() {
        const container = document.getElementById('help-tab-settings');
        if (!container) return;
        container.innerHTML = `
            <h4 class="text-primary-app">Game Setup</h4>
            <p>Accessed on launch or via the "Change Game Setup" button in Settings.</p>
            <ul>
                <li><span class="font-bold">Input:</span> Choose your keypad (9-Key, 12-Key, Piano).</li>
                <li><span class="font-bold">Game Mode:</span> Toggle between 'Simon Says' (off) and 'Unique Rounds' (on).</li>
                <li><span class="font-bold">Machines:</span> (Simon Says only) Choose 1-4 machines.</li>
                <li><span class="font-bold">Sequence Length:</span> Sets the limit (15, 20, 25) for the current mode.</li>
                <li><span class="font-bold">Multi-Sequence Options:</span> (Simon Says, 2+ machines) Sets chunk size and delay.</li>
                <li><span class="font-bold">Global Resize:</span> (Top-left of Setup) Changes the entire app's size.</li>
            </ul>
            <h4 class="text-primary-app">Settings (⚙️)</h4>
            <ul>
                <li><span class="font-bold">Preset Management:</span> Save and load your configurations.</li>
                <li><span class="font-bold">Playback Speed:</span> A global speed control (50% - 150%).</li>
                <li><span class="font-bold">Autoplay:</span> Plays the demo automatically after an input.</li>
                <li><span class="font-bold">Auto Clear/Advance:</span> (Unique Rounds mode only) Automatically clears and advances.</li>
                <li><span class="font-bold">Sequence Size:</span> Adjusts the visual size of the number boxes.</li>
                <li><span class="font-bold">Toggles:</span> Dark Mode, Speed Deleting, Audio, Voice Input, Haptics.</li>
            </ul>`;
    }
    // ... (generatePromptsHelp is the same) ...
    function generatePromptsHelp() {
        const container = document.getElementById('help-tab-prompts');
        if (!container) return;
        
        const state = StateManager.getCurrentState();
        const settings = StateManager.getSettings();
        const mode = settings.currentMode;
        const machineCount = (mode === AppConfig.MODES.SIMON) ? state.machineCount : 1;
        const sequenceLength = settings.sequenceLength;
        const autoClear = settings.isUniqueRoundsAutoClearEnabled;
        const isAutoplay = settings.isAutoplayEnabled;

        let simonPrompt = "";
        let roundsPrompt = "";

        if (machineCount === 1) {
            simonPrompt = `Let's play 'Simon Says' (1 Machine).
1. I will give you values one at a time.
2. ${isAutoplay ? "The game is **automatic**. After I give you a value, you will **immediately** read the **entire** sequence back to me." : "After I give you values, I will say 'read back'. You will then read the entire sequence back to me."}
3. 'Clear': Delete the last value I gave you.
4. 'Clear all': Delete the entire sequence.
Let's start.`;
        } else {
            simonPrompt = `Let's play 'Simon Says' (${machineCount} Machines).
1. I will give you one value at a time. Assign each value to a machine in a cycle (Machine 1, Machine 2,${machineCount > 2 ? ' Machine 3,' : ''}${machineCount > 3 ? ' Machine 4,' : ''} then back to Machine 1).
2. ${isAutoplay ? `The game is **automatic**. After I give you the value for the *last* machine (Machine ${machineCount}), you will **immediately** read all sequences back to me, in order.` : "After I give you the value for the *last* machine, I will say 'read back'. You will then read all sequences back to me, in order."}
3. After you finish reading, I will give you the next value for Machine 1.
4. 'Clear': Delete the last value I gave you.
5. 'Clear all': Delete all sequences.
Let's start with Machine 1.`;
        }

        roundsPrompt = `Let's play 'Unique Rounds Mode'.
1. We will play from Round 1 up to Round ${sequenceLength}.
2. The sequence length matches the round number (e.g., Round 3 has 3 values).
3. I will give you the values for the current round, one at a time.
4. ${isAutoplay ? `The game is **automatic**. As soon as I give you the **last value for the current round**, you will **immediately** read the full sequence for that round back to me.` : "After I give you the last value for the current round, I will say 'read back'. You will then read the full sequence for that round back to me."}
5. ${isAutoplay && autoClear ? "After you finish reading, you will **automatically** clear the sequence, advance to the next round, and say 'Next Round'." : (isAutoplay && !autoClear ? "After you finish reading, wait for me to say 'next' to clear and advance." : "After you finish reading, wait for me to say 'next' to clear and advance.")}
6. 'Repeat': Read the current round's sequence again.
7. 'Reset': Go back to Round 1.
Let's start with Round 1.`;

        const simonTextarea = document.getElementById('prompt-simon');
        const roundsTextarea = document.getElementById('prompt-unique-rounds');
        
        if (simonTextarea) simonTextarea.value = simonPrompt.trim();
        if (roundsTextarea) roundsTextarea.value = roundsPrompt.trim();
        
        const simonGroup = document.getElementById('prompt-simon-group');
        const roundsGroup = document.getElementById('prompt-unique-rounds-group');

        if (simonGroup) simonGroup.style.display = (mode === AppConfig.MODES.SIMON) ? 'block' : 'none';
        if (roundsGroup) roundsGroup.style.display = (mode === AppConfig.MODES.UNIQUE_ROUNDS) ? 'block' : 'none';
        
        const promptSection = document.getElementById('virtual-assistant-prompts');
        if (promptSection) {
            promptSection.classList.remove('hidden');
            container.appendChild(promptSection);
        }
    }

    // --- 8. Share/Chat/Support Modal Logic ---
    // ... (All functions are the same) ...
    function openShareModal() {
        closeSettingsModal();
        if (navigator.share) {
            if (dom.nativeShareButton) dom.nativeShareButton.classList.remove('hidden');
        } else {
            if (dom.nativeShareButton) dom.nativeShareButton.classList.add('hidden');
        }
        if (dom.copyLinkButton) {
            dom.copyLinkButton.disabled = false;
            dom.copyLinkButton.classList.remove('!bg-btn-control-green');
            dom.copyLinkButton.innerHTML = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 011-1z"></path><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path></svg> Copy Link`;
        }
        _toggleModal(dom.shareModal, true);
    }
    function closeShareModal() { _toggleModal(dom.shareModal, false); }
    function openChatModal() { closeSettingsModal(); _toggleModal(dom.chatModal, true); }
    function closeChatModal() { _toggleModal(dom.chatModal, false); }
    function openSupportModal() { closeSettingsModal(); _toggleModal(dom.supportModal, true); }
    function closeSupportModal() { _toggleModal(dom.supportModal, false); }

    // --- 9. Initialization ---
    // --- THIS FUNCTION IS MODIFIED ---
    function assignDomElements() {
        // Main UI
        dom.sequenceContainer = document.getElementById('sequence-container');
        
        // Modals
        dom.customModal = document.getElementById('custom-modal');
        dom.modalTitle = document.getElementById('modal-title');
        dom.modalMessage = document.getElementById('modal-message');
        dom.modalConfirm = document.getElementById('modal-confirm');
        dom.modalCancel = document.getElementById('modal-cancel');
        
        dom.shareModal = document.getElementById('share-modal');
        dom.closeShare = document.getElementById('close-share');
        dom.copyLinkButton = document.getElementById('copy-link-button'); 
        dom.nativeShareButton = document.getElementById('native-share-button'); 

        dom.chatModal = document.getElementById('chat-modal');
        dom.closeChatModal = document.getElementById('close-chat-modal');
        dom.supportModal = document.getElementById('support-modal');
        dom.closeSupportModal = document.getElementById('close-support-modal');
        
        dom.gameSetupModal = document.getElementById('game-setup-modal');
        dom.closeGameSetupModalBtn = document.getElementById('close-game-setup-modal');
        dom.dontShowWelcomeToggle = document.getElementById('dont-show-welcome-toggle');
        dom.globalResizeUpBtn = document.getElementById('global-resize-up');
        dom.globalResizeDownBtn = document.getElementById('global-resize-down');

        dom.settingsModal = document.getElementById('settings-modal');
        dom.openGameSetupFromSettings = document.getElementById('open-game-setup-from-settings');
        dom.openShareButton = document.getElementById('open-share-button');
        dom.openChatButton = document.getElementById('open-chat-button');
        dom.openSupportButton = document.getElementById('open-support-button');
        dom.openHelpButton = document.getElementById('open-help-button');
        dom.closeSettings = document.getElementById('close-settings');
        
        dom.helpModal = document.getElementById('help-modal');
        dom.helpContentContainer = document.getElementById('help-content-container');
        dom.helpTabNav = document.getElementById('help-tab-nav');
        dom.closeHelp = document.getElementById('close-help');

        // --- CONTROLS: Game Setup ---
        dom.inputSelect = document.getElementById('input-select');
        dom.modeToggle = document.getElementById('mode-toggle');
        dom.modeToggleLabel = document.getElementById('mode-toggle-label');
        dom.machinesSlider = document.getElementById('machines-slider');
        dom.machinesDisplay = document.getElementById('machines-display');
        dom.sequenceLengthSlider = document.getElementById('sequence-length-slider');
        dom.sequenceLengthDisplay = document.getElementById('sequence-length-display');
        dom.sequenceLengthLabel = document.getElementById('sequence-length-label');
        dom.chunkSlider = document.getElementById('chunk-slider');
        dom.chunkDisplay = document.getElementById('chunk-display');
        dom.delaySlider = document.getElementById('delay-slider');
        dom.delayDisplay = document.getElementById('delay-display');
        dom.settingMultiSequenceGroup = document.getElementById('setting-multi-sequence-group');
        dom.autoclearToggle = document.getElementById('autoclear-toggle');
        dom.settingAutoclear = document.getElementById('setting-autoclear');

        // --- CONTROLS: App Preferences ---
        
        // --- NEW PRESET ELEMENTS ---
        dom.presetSelect = document.getElementById('preset-select');
        dom.savePresetButton = document.getElementById('save-preset-button');
        
        dom.playbackSpeedSlider = document.getElementById('playback-speed-slider');
        dom.playbackSpeedDisplay = document.getElementById('playback-speed-display');
        dom.autoplayToggle = document.getElementById('autoplay-toggle');
        // *** REMOVED dom.showWelcomeToggle ***
        dom.darkModeToggle = document.getElementById('dark-mode-toggle');
        dom.speedDeleteToggle = document.getElementById('speed-delete-toggle');
        dom.audioPlaybackToggle = document.getElementById('audio-playback-toggle');
        dom.voiceInputToggle = document.getElementById('voice-input-toggle');
        dom.hapticsToggle = document.getElementById('haptics-toggle');
        dom.uiScaleSlider = document.getElementById('ui-scale-slider');
        dom.uiScaleDisplay = document.getElementById('ui-scale-display');

        // Pads
        dom.padKey9 = document.getElementById('pad-key9');
        dom.padKey12 = document.getElementById('pad-key12');
        dom.padPiano = document.getElementById('pad-piano');
        dom.allResetButtons = document.querySelectorAll('.reset-button');
        dom.allVoiceInputs = document.querySelectorAll('.voice-text-input');
    }

    // Expose to global scope
    window.UI = {
        assignDomElements,
        showModal,
        closeModal,
        updateTheme,
        applyGlobalUiScale,
        updateScaleDisplay,
        updateMachinesDisplay,
        updateSequenceLengthDisplay,
        updatePlaybackSpeedDisplay,
        updateChunkDisplay,
        updateDelayDisplay,
        updateInput,
        updateVoiceInputVisibility,
        updateMainUIControlsVisibility,
        renderSequences,
        updateMachineDisplay,
        updateUniqueRoundsDisplay,
        openGameSetupModal,
        closeGameSetupModal,
        updateGameSetupVisibility,
        openSettingsModal,
        closeSettingsModal,
        openHelpModal,
        closeHelpModal,
        openShareModal,
        closeShareModal,
        openChatModal,
        closeChatModal,
        openSupportModal,
        closeSupportModal,
        getDomElements: () => dom,
        renderPresetsDropdown // <-- NEW EXPOSED FUNCTION
    };

})();
