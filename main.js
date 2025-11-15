(function() {
    'use strict';

    function initializeListeners() {
        const dom = UI.getDomElements(); // Get all the DOM elements from UI.js
        
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const { value, action, input, copyTarget } = button.dataset;
            const settings = StateManager.getSettings();

            if (copyTarget) {
                const targetElement = document.getElementById(copyTarget);
                if (targetElement) {
                    targetElement.select();
                    navigator.clipboard.writeText(targetElement.value).then(() => {
                        const originalText = button.innerHTML;
                        button.innerHTML = "Copied!";
                        button.classList.add('!bg-btn-control-green');
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.classList.remove('!bg-btn-control-green');
                        }, 2000);
                    }).catch(err => console.error('Clipboard API failed: ', err));
                }
                return;
            }
            
            // --- NEW: Button Actions ---
            if (action === 'open-settings') { UI.openSettingsModal(); return; }
            if (action === 'open-help') { UI.closeSettingsModal(); UI.openHelpModal(); return; }
            if (action === 'open-share') { UI.openShareModal(); return; }
            if (action === 'open-chat') { UI.openChatModal(); return; }
            if (action === 'open-support') { UI.openSupportModal(); return; }

            if (action === 'copy-link') {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    button.disabled = true;
                    button.classList.add('!bg-btn-control-green');
                    button.innerHTML = `Copied!`;
                }).catch(err => {
                    button.innerHTML = 'Error';
                });
                return;
            }
            
            if (action === 'native-share') {
                if (navigator.share) {
                    navigator.share({
                        title: 'Follow Me App',
                        text: 'Check out this sequence app!',
                        url: window.location.href,
                    }).catch((error) => console.log('Error sharing:', error));
                }
                return;
            }
            
            if (action === 'restore-defaults') {
                UI.showModal('Restore Defaults?', 
                          'This will reset all settings and clear all saved sequences. Are you sure?', 
                          AppCore.handleRestoreDefaults, 
                          'Restore', 
                          'Cancel');
                return;
            }

            if (action === 'reset-unique-rounds') {
                UI.showModal('Reset Rounds?', 'Are you sure you want to reset to Round 1?', AppCore.resetUniqueRoundsMode, 'Reset', 'Cancel');
                return;
            }
            if (action === 'play-demo' && input === settings.currentInput) {
                DemoPlayer.handleCurrentDemo();
                return;
            }
            
            // Handle Value Clicks
            if (value && input === settings.currentInput) {
                if (input === AppConfig.INPUTS.KEY9 && /^[1-9]$/.test(value)) {
                    AppCore.addValue(value);
                }
                else if (input === AppConfig.INPUTS.KEY12 && /^(?:[1-9]|1[0-2])$/.test(value)) {
                    AppCore.addValue(value);
                }
                else if (input === AppConfig.INPUTS.PIANO && (/^[1-5]$/.test(value) || /^[A-G]$/.test(value))) {
                    AppCore.addValue(value);
                }
            }
        });
        
        dom.allVoiceInputs.forEach(input => {
            input.addEventListener('input', (event) => {
                const transcript = event.target.value;
                if (transcript && transcript.length > 0) {
                    if (event.target.dataset.input === StateManager.getSettings().currentInput) {
                        AppCore.processVoiceTranscript(transcript);
                    }
                    event.target.value = '';
                }
            });
        });
        
        document.querySelectorAll('button[data-action="backspace"]').forEach(btn => {
            btn.addEventListener('mousedown', AppCore.handleBackspaceStart);
            btn.addEventListener('mouseup', AppCore.handleBackspaceEnd);
            btn.addEventListener('mouseleave', AppCore.stopSpeedDeleting);
            btn.addEventListener('touchstart', AppCore.handleBackspaceStart, { passive: false });
            btn.addEventListener('touchend', AppCore.handleBackspaceEnd);
        });
        
        // --- Modal: Game Setup Listeners ---
        if (dom.closeGameSetupModalBtn) dom.closeGameSetupModalBtn.addEventListener('click', UI.closeGameSetupModal);
        if (dom.dontShowWelcomeToggle) dom.dontShowWelcomeToggle.addEventListener('change', (e) => {
            const settings = StateManager.getSettings();
            settings.showWelcomeScreen = !e.target.checked;
            if(dom.showWelcomeToggle) dom.showWelcomeToggle.checked = settings.showWelcomeScreen;
            StateManager.saveState();
        });

        if (dom.globalResizeUpBtn) dom.globalResizeUpBtn.addEventListener('click', () => {
            const settings = StateManager.getSettings();
            settings.globalUiScale += 10;
            UI.applyGlobalUiScale(settings.globalUiScale);
            StateManager.saveState();
        });
        if (dom.globalResizeDownBtn) dom.globalResizeDownBtn.addEventListener('click', () => {
            const settings = StateManager.getSettings();
            settings.globalUiScale -= 10;
            UI.applyGlobalUiScale(settings.globalUiScale);
            StateManager.saveState();
        });

        if (dom.inputSelect) dom.inputSelect.addEventListener('change', UI.updateGameSetupVisibility);
        if (dom.modeToggle) dom.modeToggle.addEventListener('change', UI.updateGameSetupVisibility);
        if (dom.machinesSlider) {
            dom.machinesSlider.addEventListener('input', (e) => {
                UI.updateMachinesDisplay(parseInt(e.target.value), dom.machinesDisplay);
                UI.updateGameSetupVisibility();
            });
        }
        if (dom.sequenceLengthSlider) dom.sequenceLengthSlider.addEventListener('input', (e) => UI.updateSequenceLengthDisplay(parseInt(e.target.value), dom.sequenceLengthDisplay));
        if (dom.chunkSlider) dom.chunkSlider.addEventListener('input', (e) => UI.updateChunkDisplay(parseInt(e.target.value), dom.chunkDisplay));
        if (dom.delaySlider) dom.delaySlider.addEventListener('input', (e) => UI.updateDelayDisplay(parseInt(e.target.value), dom.delayDisplay));

        // --- Modal: App Preferences Listeners ---
        if (dom.closeSettings) dom.closeSettings.addEventListener('click', UI.closeSettingsModal);
        if (dom.openGameSetupFromSettings) dom.openGameSetupFromSettings.addEventListener('click', () => {
            UI.closeSettingsModal();
            UI.openGameSetupModal();
        });

        if (dom.playbackSpeedSlider) dom.playbackSpeedSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            StateManager.getSettings().playbackSpeed = val / 100.0;
            UI.updatePlaybackSpeedDisplay(val, dom.playbackSpeedDisplay);
            StateManager.saveState();
        });

        if (dom.autoplayToggle) dom.autoplayToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isAutoplayEnabled = e.target.checked;
            StateManager.saveState();
        });

        if (dom.showWelcomeToggle) dom.showWelcomeToggle.addEventListener('change', (e) => {
            StateManager.getSettings().showWelcomeScreen = e.target.checked;
            if(dom.dontShowWelcomeToggle) dom.dontShowWelcomeToggle.checked = !StateManager.getSettings().showWelcomeScreen;
            StateManager.saveState();
        });
        if (dom.darkModeToggle) dom.darkModeToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isDarkMode = e.target.checked;
            UI.updateTheme(e.target.checked);
            StateManager.saveState();
        });
        if (dom.speedDeleteToggle) dom.speedDeleteToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isSpeedDeletingEnabled = e.target.checked;
            StateManager.saveState();
        });
        if (dom.audioPlaybackToggle) dom.audioPlaybackToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isAudioPlaybackEnabled = e.target.checked;
            if (StateManager.getSettings().isAudioPlaybackEnabled) DemoPlayer.speak("Audio");
            StateManager.saveState();
        });
        if (dom.voiceInputToggle) dom.voiceInputToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isVoiceInputEnabled = e.target.checked;
            UI.updateVoiceInputVisibility();
            StateManager.saveState();
        });
        if (dom.hapticsToggle) dom.hapticsToggle.addEventListener('change', (e) => {
            StateManager.getSettings().isHapticsEnabled = e.target.checked;
            if (StateManager.getSettings().isHapticsEnabled) AppCore.vibrate(50);
            StateManager.saveState();
        });

        if (dom.uiScaleSlider) {
            dom.uiScaleSlider.addEventListener('input', (event) => {
                const multiplier = parseInt(event.target.value) / 100;
                StateManager.getSettings().uiScaleMultiplier = multiplier;
                UI.updateScaleDisplay(multiplier, dom.uiScaleDisplay);
                UI.renderSequences(); // Full re-render needed for size change
                StateManager.saveState();
            });
        }
        
        // --- Other Modals ---
        if (dom.closeHelp) dom.closeHelp.addEventListener('click', UI.closeHelpModal);
        if (dom.closeShare) dom.closeShare.addEventListener('click', UI.closeShareModal);
        if (dom.closeChatModal) dom.closeChatModal.addEventListener('click', UI.closeChatModal);
        if (dom.closeSupportModal) dom.closeSupportModal.addEventListener('click', UI.closeSupportModal);
    }

    // --- Initialization ---
    window.onload = function() {
        StateManager.loadState(); 
        const settings = StateManager.getSettings();
        
        UI.assignDomElements();
    
        UI.applyGlobalUiScale(settings.globalUiScale);
        UI.updateTheme(settings.isDarkMode);
        UI.updateScaleDisplay(settings.uiScaleMultiplier, UI.getDomElements().uiScaleDisplay);
        UI.updateVoiceInputVisibility();
        
        initializeListeners();
        
        UI.updateInput(settings.currentInput);
        UI.updateMainUIControlsVisibility();
        
        if (settings.showWelcomeScreen) {
            setTimeout(UI.openGameSetupModal, 500); 
        }
        
        if (settings.isAudioPlaybackEnabled) DemoPlayer.speak(" "); 

        // Register the Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    };

})();
                
