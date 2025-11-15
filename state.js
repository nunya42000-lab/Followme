(function() {
    'use strict';

    let settings = { ...AppConfig.DEFAULT_SETTINGS };
    let appState = {};

    function getInitialState() {
        return { 
            sequences: Array.from({ length: AppConfig.MAX_MACHINES }, () => []),
            machineCount: 1,
            nextSequenceIndex: 0,
            currentRound: 1,
            maxRound: settings.sequenceLength
        };
    }

    function saveState() {
        try {
            localStorage.setItem(AppConfig.SETTINGS_KEY, JSON.stringify(settings));
            localStorage.setItem(AppConfig.STATE_KEY, JSON.stringify(appState));
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
    }

    function loadState() {
        try {
            const storedSettings = localStorage.getItem(AppConfig.SETTINGS_KEY);
            const storedState = localStorage.getItem(AppConfig.STATE_KEY);

            if (storedSettings) {
                const loadedSettings = JSON.parse(storedSettings);
                delete loadedSettings.areSlidersLocked; 
                settings = { ...AppConfig.DEFAULT_SETTINGS, ...loadedSettings };
            } else {
                settings = { ...AppConfig.DEFAULT_SETTINGS };
            }

            // Migrate old 'changing' mode to 'unique_rounds'
            if (settings.currentMode === 'changing') {
                settings.currentMode = AppConfig.MODES.UNIQUE_ROUNDS;
            }
            if (settings.isChangingAutoClearEnabled !== undefined) {
                settings.isUniqueRoundsAutoClearEnabled = settings.isChangingAutoClearEnabled;
                delete settings.isChangingAutoClearEnabled;
            }

            const defaultStates = {
                [AppConfig.INPUTS.KEY9]: getInitialState(),
                [AppConfig.INPUTS.KEY12]: getInitialState(),
                [AppConfig.INPUTS.PIANO]: getInitialState(),
            };

            if (storedState) {
                const loadedState = JSON.parse(storedState);
                appState[AppConfig.INPUTS.KEY9] = { ...defaultStates[AppConfig.INPUTS.KEY9], ...(loadedState[AppConfig.INPUTS.KEY9] || {}) };
                appState[AppConfig.INPUTS.KEY12] = { ...defaultStates[AppConfig.INPUTS.KEY12], ...(loadedState[AppConfig.INPUTS.KEY12] || {}) };
                appState[AppConfig.INPUTS.PIANO] = { ...defaultStates[AppConfig.INPUTS.PIANO], ...(loadedState[AppConfig.INPUTS.PIANO] || {}) };
                
                Object.values(appState).forEach(state => {
                    if (state.sequenceCount !== undefined) {
                        state.machineCount = state.sequenceCount;
                        delete state.sequenceCount;
                    }
                });

            } else {
                appState = defaultStates;
            }

            Object.values(appState).forEach(state => {
                state.maxRound = settings.sequenceLength;
            });

        } catch (error) {
            console.error("Failed to load state from localStorage:", error);
            localStorage.removeItem(AppConfig.SETTINGS_KEY);
            localStorage.removeItem(AppConfig.STATE_KEY);
            settings = { ...AppConfig.DEFAULT_SETTINGS };
            appState = {
                [AppConfig.INPUTS.KEY9]: getInitialState(),
                [AppConfig.INPUTS.KEY12]: getInitialState(),
                [AppConfig.INPUTS.PIANO]: getInitialState(),
            };
        }
    }

    function resetToDefaults() {
        settings = { ...AppConfig.DEFAULT_SETTINGS };
        appState = {
            [AppConfig.INPUTS.KEY9]: getInitialState(),
            [AppConfig.INPUTS.KEY12]: getInitialState(),
            [AppConfig.INPUTS.PIANO]: getInitialState(),
        };
        saveState();
    }

    // Expose to global scope
    window.StateManager = {
        loadState,
        saveState,
        getInitialState,
        resetToDefaults,
        getSettings: () => settings,
        getAppState: () => appState,
        getCurrentState: () => appState[settings.currentInput],
    };

})();
            
