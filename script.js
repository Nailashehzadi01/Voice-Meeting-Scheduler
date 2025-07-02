// VoiceSchedule Pro - Enhanced AI-Powered Meeting Scheduler
class VoiceSchedulerPro {
    constructor() {
        this.meetings = JSON.parse(localStorage.getItem('voiceSchedulePro_meetings')) || [];
        this.settings = JSON.parse(localStorage.getItem('voiceSchedulePro_settings')) || this.getDefaultSettings();
        this.isListening = false;
        this.recognition = null;
        this.currentSection = 'dashboard';
        this.lastTranscript = '';
        this.finalTranscript = '';
        this.confidenceLevel = 0;
        this.voiceCommands = JSON.parse(localStorage.getItem('voiceSchedulePro_commands')) || [];
        this.aiInsights = [];
        this.notifications = JSON.parse(localStorage.getItem('voiceSchedulePro_notifications')) || [];
        this.currentCalendarDate = new Date();
        this.charts = {};
        
        this.init();
    }

    getDefaultSettings() {
        return {
            voiceLanguage: 'en-US',
            voiceSensitivity: 75,
            autoProcessVoice: true,
            emailNotifications: true,
            pushNotifications: true,
            reminderNotifications: true,
            reminderTime: 10,
            soundNotifications: false,
            theme: 'light',
            compactMode: false,
            animations: true,
            fontSize: 'medium',
            defaultView: 'month',
            weekStart: 1,
            showWeekends: true,
            autoSyncCalendar: false,
            enableAnalytics: true,
            debugMode: false,
            autoBackup: 'weekly',
            maxMeetings: 100,
            continuousListening: false,
            voiceConfirmation: true
        };
    }

    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.setupEventListeners();
            this.setupSettingsListeners();
            this.initializeVoiceRecognition();
            this.initializeTabs();
            this.updateDashboard();
            this.renderMeetings();
            this.renderCalendarView();
            this.updateAnalytics();
            this.setMinDate();
            this.generateAIInsights();
            this.updateNotifications();
            this.applyTheme();
            this.loadSettings();
        }, 2000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Voice button
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        // Meeting form
        const meetingForm = document.getElementById('meetingForm');
        if (meetingForm) {
            meetingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createMeeting();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchMeetings');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchMeetings(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMeetings(e.target.dataset.filter);
            });
        });

        // Auto-generate meeting titles when typing in description
        const descriptionField = document.getElementById('meetingDescription');
        if (descriptionField) {
            descriptionField.addEventListener('input', (e) => {
                this.autoGenerateTitle(e.target.value);
            });
        }

        // Duration change handler
        const durationSelect = document.getElementById('meetingDuration');
        if (durationSelect) {
            durationSelect.addEventListener('change', (e) => {
                this.handleDurationChange(e.target.value);
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Recurring meeting toggle
        const recurringCheckbox = document.getElementById('isRecurring');
        if (recurringCheckbox) {
            recurringCheckbox.addEventListener('change', (e) => {
                this.toggleRecurringOptions(e.target.checked);
            });
        }
    }

    setupSettingsListeners() {
        // Voice language setting
        const voiceLanguage = document.getElementById('voiceLanguage');
        if (voiceLanguage) {
            voiceLanguage.addEventListener('change', (e) => {
                this.settings.voiceLanguage = e.target.value;
                this.updateVoiceLanguage();
                this.saveSettings();
            });
        }

        // Voice sensitivity setting
        const voiceSensitivity = document.getElementById('voiceSensitivity');
        if (voiceSensitivity) {
            voiceSensitivity.addEventListener('input', (e) => {
                this.settings.voiceSensitivity = parseInt(e.target.value);
                this.handleDurationChange(e.target.value);
                this.saveSettings();
            });
        }

        // All other settings
        const settingIds = [
            'autoProcessVoice', 'emailNotifications', 'pushNotifications', 
            'reminderNotifications', 'soundNotifications', 'compactMode',
            'animations', 'showWeekends', 'autoSyncCalendar', 'enableAnalytics',
            'debugMode', 'continuousListening', 'voiceConfirmation'
        ];

        settingIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.type === 'checkbox') {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.checked;
                    this.saveSettings();
                });
            }
        });

        const selectSettingIds = [
            'reminderTime', 'theme', 'fontSize', 'defaultView', 
            'weekStart', 'autoBackup'
        ];

        selectSettingIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.value;
                    if (id === 'theme') this.applyTheme();
                    this.saveSettings();
                });
            }
        });

        const numberSettingIds = ['maxMeetings'];
        numberSettingIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = parseInt(e.target.value);
                    this.saveSettings();
                });
            }
        });

        // Settings navigation
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.dataset.panel;
                this.switchSettingsPanel(panel);
            });
        });
    }

    initializeTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    toggleRecurringOptions(show) {
        const recurringOptions = document.getElementById('recurringOptions');
        if (recurringOptions) {
            recurringOptions.style.display = show ? 'block' : 'none';
        }
    }

    handleDurationChange(value) {
        const customDuration = document.getElementById('customDuration');
        const sensitivityValue = document.getElementById('sensitivityValue');
        
        if (value === 'custom' && customDuration) {
            customDuration.style.display = 'block';
        } else if (customDuration) {
            customDuration.style.display = 'none';
        }

        if (sensitivityValue) {
            sensitivityValue.textContent = value + '%';
        }
    }

    // Voice Recognition
    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.settings.voiceLanguage;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI();
                this.startWaveAnimation();
            };
            
            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                    if (event.results[i].confidence) {
                        this.confidenceLevel = event.results[i].confidence * 100;
                        this.updateConfidence(this.confidenceLevel);
                    }
                }
                this.updateTranscription(transcript);
                
                if (event.results[event.results.length - 1].isFinal) {
                    this.finalTranscript = transcript;
                    this.showDoneButton();
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecognition();
                this.showToast('Voice recognition error: ' + event.error, 'error');
            };
            
            this.recognition.onend = () => {
                if (this.isListening) {
                    this.isListening = false;
                    this.updateVoiceUI();
                    this.stopWaveAnimation();
                }
            };
        } else {
            this.showToast('Voice recognition not supported in this browser', 'warning');
        }
    }

    updateVoiceLanguage() {
        if (this.recognition) {
            this.recognition.lang = this.settings.voiceLanguage;
        }
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            schedule: 'Schedule New Meeting',
            meetings: 'My Meetings',
            calendar: 'Calendar View',
            analytics: 'Analytics & Reports',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[sectionName];

        this.currentSection = sectionName;

        // Update section-specific content
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'meetings') {
            this.renderMeetings();
        } else if (sectionName === 'calendar') {
            this.renderCalendarView();
        } else if (sectionName === 'analytics') {
            this.updateAnalytics();
        } else if (sectionName === 'settings') {
            this.loadSettings();
        }

        // Close mobile sidebar
        this.closeMobileSidebar();
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }

    toggleVoiceRecognition() {
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.showVoiceModal();
        }
    }

    startVoiceRecognition() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.updateVoiceStatus('Listening... Speak now', 'listening');
                document.getElementById('startVoice').textContent = 'Stop Listening';
                document.getElementById('startVoice').onclick = () => this.stopVoiceRecognition();
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
                this.showToast('Voice recognition failed to start', 'error');
            }
        }
    }

    startQuickVoice() {
        this.showVoiceModal();
        setTimeout(() => {
            this.startVoiceRecognition();
        }, 500);
    }

    stopVoiceRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.updateVoiceUI();
        this.stopWaveAnimation();
        this.updateVoiceStatus('Click to start voice command', 'idle');
        document.getElementById('startVoice').textContent = 'Start Listening';
        document.getElementById('startVoice').onclick = () => this.startVoiceRecognition();
    }

    updateVoiceUI() {
        const voiceCircle = document.getElementById('voiceCircle');
        if (voiceCircle) {
            if (this.isListening) {
                voiceCircle.classList.add('listening');
            } else {
                voiceCircle.classList.remove('listening');
            }
        }
    }

    updateVoiceStatus(message, status) {
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            voiceStatus.textContent = message;
        }
    }

    startWaveAnimation() {
        document.querySelectorAll('.wave').forEach(wave => {
            wave.style.animationPlayState = 'running';
        });
    }

    stopWaveAnimation() {
        document.querySelectorAll('.wave').forEach(wave => {
            wave.style.animationPlayState = 'paused';
        });
    }

    updateTranscription(text) {
        const transcription = document.getElementById('voiceTranscription');
        if (transcription) {
            transcription.textContent = text;
            transcription.classList.add('active');
        }
    }

    updateConfidence(confidence) {
        const confidenceBar = document.getElementById('confidenceBar');
        if (confidenceBar) {
            confidenceBar.style.width = confidence + '%';
        }
    }

    showDoneButton() {
        this.stopVoiceRecognition();
        this.updateVoiceStatus('Voice command captured! Click Done to process.', 'captured');
        
        // Show done button
        const doneButton = document.createElement('button');
        doneButton.id = 'done-voice-button';
        doneButton.className = 'btn btn-primary';
        doneButton.innerHTML = '<i class="fas fa-check"></i> Done';
        doneButton.style.marginLeft = '10px';
        doneButton.onclick = () => this.processFinalVoiceCommand();
        
        // Remove existing done button if any
        const existingDone = document.getElementById('done-voice-button');
        if (existingDone) {
            existingDone.remove();
        }
        
        // Add done button to voice actions
        const voiceActions = document.querySelector('.voice-actions');
        if (voiceActions) {
            voiceActions.appendChild(doneButton);
        }
    }

    processFinalVoiceCommand() {
        if (this.finalTranscript) {
            const data = this.parseVoiceCommand(this.finalTranscript);
            if (data && (data.title || data.date || data.time)) {
                this.populateFormFromVoice(data);
                this.showToast('Voice command processed successfully!', 'success');
            } else {
                // Generate smart defaults if no specific data found
                this.generateSmartDefaults(this.finalTranscript);
                this.showToast('Smart defaults applied from voice input!', 'info');
            }
            
            // Log voice command
            this.logVoiceCommand(this.finalTranscript, true);
            this.closeVoiceModal();
            this.switchSection('schedule');
        }
    }

    generateSmartDefaults(transcript) {
        // Generate meeting title from transcript
        const title = this.generateMeetingTitle(transcript);
        if (title) {
            document.getElementById('meetingTitle').value = title;
        }
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('meetingDate').value = tomorrow.toISOString().split('T')[0];
        
        // Set default time to current time + 1 hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const timeString = now.toTimeString().slice(0, 5);
        document.getElementById('meetingTime').value = timeString;
        
        // Set description with original transcript
        document.getElementById('meetingDescription').value = `Meeting about: ${transcript}`;
    }

    autoGenerateTitle(description) {
        const titleField = document.getElementById('meetingTitle');
        
        // Only auto-generate if title field is empty and description has meaningful content
        if (titleField && !titleField.value.trim() && description.trim().length > 3) {
            const generatedTitle = this.generateMeetingTitle(description);
            if (generatedTitle && generatedTitle !== 'New Meeting') {
                titleField.value = generatedTitle;
                
                // Show AI suggestion
                const suggestion = document.getElementById('titleSuggestion');
                if (suggestion) {
                    suggestion.textContent = `AI suggested: ${generatedTitle}`;
                    suggestion.classList.add('active');
                    setTimeout(() => {
                        suggestion.classList.remove('active');
                    }, 4000);
                }
                
                // Add visual feedback
                titleField.style.background = '#e0e7ff';
                setTimeout(() => {
                    titleField.style.background = '';
                }, 2000);
            }
        }
    }

    generateMeetingTitle(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        
        // Common meeting patterns with better matching
        const patterns = {
            'standup': 'Daily Standup Meeting',
            'stand up': 'Daily Standup Meeting',
            'review': 'Project Review Meeting',
            'planning': 'Planning Meeting',
            'team meeting': 'Team Meeting',
            'team': 'Team Meeting',
            'client': 'Client Meeting',
            'call': 'Conference Call',
            'interview': 'Interview Meeting',
            'demo': 'Demo Meeting',
            'demonstration': 'Demo Meeting',
            'presentation': 'Presentation Meeting',
            'sync': 'Sync Meeting',
            'kickoff': 'Project Kickoff',
            'retrospective': 'Retrospective Meeting',
            'retro': 'Retrospective Meeting',
            'one on one': 'One-on-One Meeting',
            '1:1': 'One-on-One Meeting',
            'brainstorm': 'Brainstorming Session',
            'training': 'Training Session',
            'workshop': 'Workshop Meeting',
            'follow up': 'Follow-up Meeting',
            'check in': 'Check-in Meeting',
            'budget': 'Budget Meeting',
            'sales': 'Sales Meeting',
            'marketing': 'Marketing Meeting',
            'strategy': 'Strategy Meeting',
            'quarterly': 'Quarterly Review',
            'monthly': 'Monthly Meeting',
            'weekly': 'Weekly Meeting'
        };

        // Check for exact pattern matches first
        for (const [keyword, title] of Object.entries(patterns)) {
            if (lowerTranscript.includes(keyword)) {
                return title;
            }
        }
        
        // Try to extract meaningful words and create smart title
        const meaningfulWords = transcript.split(/[\s,.-]+/).filter(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            return cleanWord.length > 2 && 
                   !['with', 'the', 'and', 'for', 'meeting', 'call', 'schedule', 'book', 'create', 'about', 'discuss', 'talk', 'have', 'need', 'want', 'lets', 'will', 'can', 'should', 'would'].includes(cleanWord);
        });
        
        if (meaningfulWords.length > 0) {
            // Take first 2-3 meaningful words and create title
            const titleWords = meaningfulWords.slice(0, 3);
            let title = this.capitalizeWords(titleWords.join(' '));
            
            // Add "Meeting" if not already present
            if (!title.toLowerCase().includes('meeting') && !title.toLowerCase().includes('session') && !title.toLowerCase().includes('call')) {
                title += ' Meeting';
            }
            
            return title;
        }
        
        // Last resort - check for person names or project names
        const words = transcript.split(' ').filter(word => word.length > 2);
        if (words.length > 0) {
            // Capitalize first word and add Meeting
            return this.capitalizeWords(words[0]) + ' Meeting';
        }
        
        return 'New Meeting';
    }

    showVoiceModal() {
        const modal = document.getElementById('voiceModal');
        if (modal) {
            modal.classList.add('active');
            // Reset transcription and status
            this.updateTranscription('Say something like "Schedule meeting with team tomorrow at 10 AM"');
            this.updateVoiceStatus('Click to start voice command', 'idle');
            this.finalTranscript = '';
            this.updateConfidence(0);
            
            // Remove any existing done button
            const existingDone = document.getElementById('done-voice-button');
            if (existingDone) {
                existingDone.remove();
            }
        }
    }

    closeVoiceModal() {
        const modal = document.getElementById('voiceModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.stopVoiceRecognition();
        
        // Clean up done button
        const doneButton = document.getElementById('done-voice-button');
        if (doneButton) {
            doneButton.remove();
        }
        
        // Reset values
        this.finalTranscript = '';
        this.confidenceLevel = 0;
    }

    processVoiceCommand() {
        if (this.finalTranscript) {
            this.processFinalVoiceCommand();
        }
    }

    parseVoiceCommand(command) {
        const lowerCommand = command.toLowerCase();
        
        // Extract title using various patterns
        let title = '';
        const titlePatterns = [
            /schedule (?:a |an )?(.+?) (?:meeting|call|session)/i,
            /book (?:a |an )?(.+?) (?:meeting|call|session)/i,
            /create (?:a |an )?(.+?) (?:meeting|call|session)/i,
            /set up (?:a |an )?(.+?) (?:meeting|call|session)/i,
            /meeting (?:about|for|with) (.+?)(?:\s+(?:tomorrow|today|on|at)|\s*$)/i
        ];

        for (const pattern of titlePatterns) {
            const match = command.match(pattern);
            if (match) {
                title = this.capitalizeWords(match[1].trim());
                break;
            }
        }

        // Extract date
        let date = '';
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (lowerCommand.includes('today')) {
            date = today.toISOString().split('T')[0];
        } else if (lowerCommand.includes('tomorrow')) {
            date = tomorrow.toISOString().split('T')[0];
        } else if (lowerCommand.includes('monday')) {
            date = this.getNextWeekday(1);
        } else if (lowerCommand.includes('tuesday')) {
            date = this.getNextWeekday(2);
        } else if (lowerCommand.includes('wednesday')) {
            date = this.getNextWeekday(3);
        } else if (lowerCommand.includes('thursday')) {
            date = this.getNextWeekday(4);
        } else if (lowerCommand.includes('friday')) {
            date = this.getNextWeekday(5);
        } else if (lowerCommand.includes('saturday')) {
            date = this.getNextWeekday(6);
        } else if (lowerCommand.includes('sunday')) {
            date = this.getNextWeekday(0);
        }

        // Extract time
        let time = '';
        const timePattern = /(?:at |from )?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
        const timeMatch = command.match(timePattern);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || '00';
            const ampm = timeMatch[3];
            
            if (ampm) {
                if (ampm.toLowerCase() === 'pm' && hours !== 12) {
                    hours += 12;
                } else if (ampm.toLowerCase() === 'am' && hours === 12) {
                    hours = 0;
                }
            }
            
            time = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }

        return { title, date, time };
    }

    capitalizeWords(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    populateFormFromVoice(data) {
        if (data.title) {
            document.getElementById('meetingTitle').value = data.title;
        }
        if (data.date) {
            document.getElementById('meetingDate').value = data.date;
        }
        if (data.time) {
            document.getElementById('meetingTime').value = data.time;
        }
    }

    highlightAIFields(fields) {
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.background = '#e0e7ff';
                setTimeout(() => {
                    field.style.background = '';
                }, 2000);
            }
        });
    }

    processChipClick(chipText) {
        this.updateTranscription(chipText);
        this.finalTranscript = chipText;
        this.showDoneButton();
    }

    logVoiceCommand(command, success) {
        const logEntry = {
            id: Date.now(),
            command: command,
            success: success,
            timestamp: new Date().toISOString()
        };
        this.voiceCommands.push(logEntry);
        localStorage.setItem('voiceSchedulePro_commands', JSON.stringify(this.voiceCommands));
    }

    // Meeting Management
    createMeeting() {
        const title = document.getElementById('meetingTitle').value;
        const date = document.getElementById('meetingDate').value;
        const time = document.getElementById('meetingTime').value;
        const duration = document.getElementById('meetingDuration').value === 'custom' ? 
                        document.getElementById('customDuration').value : 
                        document.getElementById('meetingDuration').value;
        const description = document.getElementById('meetingDescription').value;
        const location = document.getElementById('meetingLocation').value;
        const attendees = document.getElementById('meetingAttendees').value;
        const priority = document.getElementById('meetingPriority').value;
        const category = document.getElementById('meetingCategory').value;
        const notes = document.getElementById('meetingNotes').value;
        const sendReminder = document.getElementById('sendReminder').checked;
        const addToCalendar = document.getElementById('addToCalendar').checked;
        const type = document.getElementById('meetingType').value;

        if (!title || !date || !time) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Handle recurring meetings
        const isRecurring = document.getElementById('isRecurring').checked;
        let meetings = [];

        if (isRecurring) {
            meetings = this.createRecurringMeetings({
                title, date, time, duration, description, location, attendees,
                priority, category, notes, sendReminder, addToCalendar, type
            });
        } else {
            const meeting = {
                id: Date.now(),
                title, date, time, duration: parseInt(duration), description, location,
                attendees, priority, category, notes, sendReminder, addToCalendar, type,
                createdAt: new Date().toISOString(),
                isRecurring: false
            };
            meetings = [meeting];
        }

        meetings.forEach(meeting => {
            this.meetings.push(meeting);
        });

        this.saveMeetings();
        this.updateDashboard();
        this.renderMeetings();
        this.renderCalendarView();
        this.clearForm();
        
        const message = isRecurring ? 
            `${meetings.length} recurring meetings scheduled successfully!` : 
            `Meeting "${title}" scheduled successfully!`;
        this.showToast(message, 'success');

        // Add to recent activity
        this.addToRecentActivity('meeting_created', `Created meeting: ${title}`);
    }

    createRecurringMeetings(meetingData) {
        const meetings = [];
        const frequency = document.getElementById('recurringFreq').value;
        const endDate = document.getElementById('recurringEnd').value;
        const count = parseInt(document.getElementById('recurringCount').value) || 10;
        
        const startDate = new Date(meetingData.date);
        const endDateTime = endDate ? new Date(endDate) : null;
        
        let currentDate = new Date(startDate);
        let createdCount = 0;
        
        while (createdCount < count && (!endDateTime || currentDate <= endDateTime)) {
            const meeting = {
                ...meetingData,
                id: Date.now() + createdCount,
                date: currentDate.toISOString().split('T')[0],
                duration: parseInt(meetingData.duration),
                createdAt: new Date().toISOString(),
                isRecurring: true,
                recurringId: Date.now(),
                recurringFrequency: frequency
            };
            
            meetings.push(meeting);
            
            // Calculate next date based on frequency
            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
            }
            
            createdCount++;
        }
        
        return meetings;
    }

    deleteMeeting(id) {
        const meeting = this.meetings.find(m => m.id === id);
        if (!meeting) return;

        let confirmMessage = 'Are you sure you want to delete this meeting?';
        if (meeting.isRecurring) {
            confirmMessage = 'This is a recurring meeting. Delete all occurrences or just this one?\n\nClick OK to delete all, Cancel to delete just this one.';
        }

        const deleteAll = confirm(confirmMessage);
        
        if (meeting.isRecurring && deleteAll) {
            // Delete all meetings with the same recurringId
            this.meetings = this.meetings.filter(m => m.recurringId !== meeting.recurringId);
            this.showToast('All recurring meetings deleted', 'success');
        } else {
            // Delete just this meeting
            this.meetings = this.meetings.filter(m => m.id !== id);
            this.showToast('Meeting deleted successfully', 'success');
        }

        this.saveMeetings();
        this.updateDashboard();
        this.renderMeetings();
        this.renderCalendarView();
        this.addToRecentActivity('meeting_deleted', `Deleted meeting: ${meeting.title}`);
    }

    editMeeting(id) {
        const meeting = this.meetings.find(m => m.id === id);
        if (meeting) {
            // Populate form with meeting data
            document.getElementById('meetingTitle').value = meeting.title;
            document.getElementById('meetingDate').value = meeting.date;
            document.getElementById('meetingTime').value = meeting.time;
            document.getElementById('meetingDuration').value = meeting.duration;
            document.getElementById('meetingDescription').value = meeting.description || '';
            document.getElementById('meetingLocation').value = meeting.location || '';
            document.getElementById('meetingAttendees').value = meeting.attendees || '';
            document.getElementById('meetingPriority').value = meeting.priority || 'medium';
            document.getElementById('meetingCategory').value = meeting.category || 'work';
            document.getElementById('meetingNotes').value = meeting.notes || '';
            document.getElementById('meetingType').value = meeting.type || 'video-call';
            
            // Handle checkboxes
            if (meeting.sendReminder !== undefined) {
                document.getElementById('sendReminder').checked = meeting.sendReminder;
            }
            if (meeting.addToCalendar !== undefined) {
                document.getElementById('addToCalendar').checked = meeting.addToCalendar;
            }
            
            // Delete the existing meeting
            this.deleteMeeting(id);
            this.switchSection('schedule');
            this.showToast('Meeting loaded for editing', 'info');
        }
    }

    saveMeetings() {
        localStorage.setItem('voiceSchedulePro_meetings', JSON.stringify(this.meetings));
    }

    saveSettings() {
        localStorage.setItem('voiceSchedulePro_settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        // Apply settings to form elements
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
        
        // Update sensitivity display
        this.handleDurationChange(this.settings.voiceSensitivity);
        this.applyTheme();
    }

    applyTheme() {
        const body = document.body;
        
        if (this.settings.theme === 'dark') {
            body.classList.add('dark-theme');
        } else if (this.settings.theme === 'light') {
            body.classList.remove('dark-theme');
        } else { // auto
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.classList.add('dark-theme');
            } else {
                body.classList.remove('dark-theme');
            }
        }
    }

    // Dashboard and Analytics
    updateDashboard() {
        this.renderUpcomingMeetings();
        this.renderRecentActivity();
        this.updateDashboardStats();
        this.updateWeeklyChart();
    }

    updateDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = this.meetings.filter(m => new Date(m.date) >= new Date()).length;
        const todayMeetings = this.meetings.filter(m => m.date === today).length;
        
        document.getElementById('totalMeetings').textContent = this.meetings.length;
        document.getElementById('upcomingMeetings').textContent = upcoming;
        document.getElementById('voiceCommands').textContent = this.voiceCommands.length;
        document.getElementById('todayMeetings').textContent = todayMeetings;
    }

    renderUpcomingMeetings() {
        const container = document.getElementById('upcomingMeetingsList');
        const today = new Date();
        const upcoming = this.meetings
            .filter(meeting => new Date(meeting.date) >= today)
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No upcoming meetings</p>
                    <button class="btn btn-primary" onclick="app.switchSection('schedule')">Schedule Meeting</button>
                </div>
            `;
            return;
        }

        container.innerHTML = upcoming.map(meeting => `
            <div class="meeting-item">
                <div class="meeting-info">
                    <h4>${meeting.title}</h4>
                    <div class="meeting-details">
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(meeting.date)}</span>
                        <span><i class="fas fa-clock"></i> ${this.formatTime(meeting.time)}</span>
                        ${meeting.priority !== 'medium' ? `<span class="priority-badge priority-${meeting.priority}">${meeting.priority}</span>` : ''}
                    </div>
                </div>
                <div class="meeting-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.joinMeeting(${meeting.id})" title="Join">
                        <i class="fas fa-video"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        const activities = JSON.parse(localStorage.getItem('voiceSchedulePro_activity')) || [];
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Welcome to VoiceSchedule Pro!</strong></p>
                        <span class="activity-time">Start by scheduling your first meeting</span>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.message}</strong></p>
                    <span class="activity-time">${this.getRelativeTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    addToRecentActivity(type, message) {
        const activities = JSON.parse(localStorage.getItem('voiceSchedulePro_activity')) || [];
        activities.unshift({
            id: Date.now(),
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.splice(50);
        }
        
        localStorage.setItem('voiceSchedulePro_activity', JSON.stringify(activities));
    }

    getActivityIcon(type) {
        const icons = {
            'meeting_created': 'fa-calendar-plus',
            'meeting_deleted': 'fa-calendar-minus',
            'meeting_updated': 'fa-calendar-edit',
            'voice_command': 'fa-microphone',
            'settings_changed': 'fa-cogs',
            'data_exported': 'fa-download',
            'data_imported': 'fa-upload'
        };
        return icons[type] || 'fa-info-circle';
    }

    // Meeting Rendering and Management
    renderMeetings() {
        const container = document.getElementById('meetingsContainer');
        
        if (this.meetings.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>No meetings found</h3>
                    <p>Start by scheduling your first meeting</p>
                    <button class="btn btn-primary" onclick="app.switchSection('schedule')">
                        <i class="fas fa-plus"></i> Schedule Meeting
                    </button>
                </div>
            `;
            return;
        }

        this.renderFilteredMeetings(this.meetings);
    }

    joinMeeting(id) {
        const meeting = this.meetings.find(m => m.id === id);
        if (meeting && meeting.location) {
            if (meeting.location.startsWith('http')) {
                window.open(meeting.location, '_blank');
                this.showToast('Opening meeting link...', 'info');
            } else {
                this.showToast(`Meeting location: ${meeting.location}`, 'info');
            }
        } else {
            this.showToast('No meeting link available', 'warning');
        }
        this.addToRecentActivity('meeting_joined', `Joined meeting: ${meeting.title}`);
    }

    filterMeetings(filter) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        let filtered = [];
        
        switch (filter) {
            case 'upcoming':
                filtered = this.meetings.filter(meeting => new Date(meeting.date) >= today);
                break;
            case 'today':
                filtered = this.meetings.filter(meeting => meeting.date === todayStr);
                break;
            case 'this-week':
                const weekStart = this.getStartOfWeek();
                const weekEnd = this.getEndOfWeek();
                filtered = this.meetings.filter(meeting => {
                    const meetingDate = new Date(meeting.date);
                    return meetingDate >= weekStart && meetingDate <= weekEnd;
                });
                break;
            case 'past':
                filtered = this.meetings.filter(meeting => new Date(meeting.date) < today);
                break;
            default:
                filtered = this.meetings;
        }

        this.renderFilteredMeetings(filtered);
    }

    changeView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        const container = document.getElementById('meetingsContainer');
        if (view === 'grid') {
            container.classList.add('grid-view');
        } else {
            container.classList.remove('grid-view');
        }
    }

    renderCalendarView() {
        this.renderCalendar();
    }

    sortMeetings(sortBy) {
        let sorted = [...this.meetings];
        
        switch (sortBy) {
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
                break;
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
                break;
            case 'title-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'priority':
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                sorted.sort((a, b) => (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2));
                break;
        }
        
        this.renderFilteredMeetings(sorted);
    }

    searchMeetings(query) {
        if (!query.trim()) {
            this.renderMeetings();
            return;
        }

        const filtered = this.meetings.filter(meeting => 
            meeting.title.toLowerCase().includes(query.toLowerCase()) ||
            (meeting.description && meeting.description.toLowerCase().includes(query.toLowerCase())) ||
            (meeting.attendees && meeting.attendees.toLowerCase().includes(query.toLowerCase())) ||
            (meeting.location && meeting.location.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderFilteredMeetings(filtered);
    }

    renderFilteredMeetings(meetings) {
        const container = document.getElementById('meetingsContainer');
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-search"></i>
                    <h3>No meetings found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        const sortedMeetings = meetings.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });

        container.innerHTML = sortedMeetings.map(meeting => `
            <div class="meeting-card">
                <div class="meeting-header">
                    <div class="meeting-title">${meeting.title}</div>
                    <div class="meeting-actions">
                        ${meeting.location && meeting.location.startsWith('http') ? 
                            `<button class="btn btn-sm btn-voice" onclick="app.joinMeeting(${meeting.id})" title="Join Meeting">
                                <i class="fas fa-video"></i>
                            </button>` : ''
                        }
                        <button class="btn btn-sm btn-secondary" onclick="app.editMeeting(${meeting.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteMeeting(${meeting.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="meeting-details">
                    <div class="meeting-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(meeting.date)}</span>
                    </div>
                    <div class="meeting-detail">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatTime(meeting.time)} (${meeting.duration} min)</span>
                    </div>
                    ${meeting.location ? `
                        <div class="meeting-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${meeting.location}</span>
                        </div>
                    ` : ''}
                    ${meeting.attendees ? `
                        <div class="meeting-detail">
                            <i class="fas fa-users"></i>
                            <span>${meeting.attendees}</span>
                        </div>
                    ` : ''}
                    ${meeting.description ? `
                        <div class="meeting-detail">
                            <i class="fas fa-info-circle"></i>
                            <span>${meeting.description}</span>
                        </div>
                    ` : ''}
                    ${meeting.priority && meeting.priority !== 'medium' ? `
                        <div class="meeting-detail">
                            <span class="priority-badge priority-${meeting.priority}">${meeting.priority}</span>
                        </div>
                    ` : ''}
                    ${meeting.isRecurring ? `
                        <div class="meeting-detail">
                            <i class="fas fa-sync-alt"></i>
                            <span>Recurring (${meeting.recurringFrequency})</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Analytics
    updateAnalytics() {
        this.updateWeeklyChart();
        this.updateFrequencyChart();
        this.updateTypesChart();
        this.updateHoursChart();
        this.updateVoiceChart();
        this.generateAIInsights();
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        const weeklyData = this.getWeeklyMeetingData();
        
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Meetings',
                    data: weeklyData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    getWeeklyMeetingData() {
        const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        
        this.meetings.forEach(meeting => {
            const date = new Date(meeting.date);
            const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
            weekData[dayOfWeek]++;
        });
        
        return weekData;
    }

    updateFrequencyChart() {
        const ctx = document.getElementById('frequencyChart');
        if (!ctx) return;

        // Group meetings by month
        const monthlyData = {};
        this.meetings.forEach(meeting => {
            const month = new Date(meeting.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const labels = Object.keys(monthlyData).slice(-6);
        const data = labels.map(label => monthlyData[label]);

        if (this.charts.frequency) {
            this.charts.frequency.destroy();
        }

        this.charts.frequency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Meetings per Month',
                    data: data,
                    backgroundColor: '#10b981',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    updateTypesChart() {
        const ctx = document.getElementById('typesChart');
        if (!ctx) return;

        const typeData = {};
        this.meetings.forEach(meeting => {
            const type = meeting.type || 'video-call';
            typeData[type] = (typeData[type] || 0) + 1;
        });

        if (this.charts.types) {
            this.charts.types.destroy();
        }

        this.charts.types = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(typeData),
                datasets: [{
                    data: Object.values(typeData),
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateHoursChart() {
        const ctx = document.getElementById('hoursChart');
        if (!ctx) return;

        const hourData = new Array(24).fill(0);
        this.meetings.forEach(meeting => {
            const hour = parseInt(meeting.time.split(':')[0]);
            hourData[hour]++;
        });

        if (this.charts.hours) {
            this.charts.hours.destroy();
        }

        this.charts.hours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Meetings by Hour',
                    data: hourData,
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    updateVoiceChart() {
        const ctx = document.getElementById('voiceChart');
        if (!ctx) return;

        const dailyCommands = {};
        this.voiceCommands.forEach(command => {
            const date = new Date(command.timestamp).toLocaleDateString();
            dailyCommands[date] = (dailyCommands[date] || 0) + 1;
        });

        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString();
        }).reverse();

        const data = last7Days.map(date => dailyCommands[date] || 0);

        if (this.charts.voice) {
            this.charts.voice.destroy();
        }

        this.charts.voice = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: 'Voice Commands',
                    data: data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    generateAIInsights() {
        const insights = [];
        
        if (this.meetings.length > 0) {
            // Most productive day
            const dayData = this.getWeeklyMeetingData();
            const maxDay = dayData.indexOf(Math.max(...dayData));
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            insights.push(`Your most productive day is ${dayNames[maxDay]}`);

            // Most common meeting time
            const hourData = new Array(24).fill(0);
            this.meetings.forEach(meeting => {
                const hour = parseInt(meeting.time.split(':')[0]);
                hourData[hour]++;
            });
            const peakHour = hourData.indexOf(Math.max(...hourData));
            insights.push(`Your peak meeting time is ${peakHour}:00`);

            // Meeting frequency trend
            const recent = this.meetings.filter(m => 
                new Date(m.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length;
            const previous = this.meetings.filter(m => {
                const date = new Date(m.date);
                return date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) && 
                       date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            }).length;
            
            if (recent > previous) {
                const increase = Math.round(((recent - previous) / (previous || 1)) * 100);
                insights.push(`You've scheduled ${increase}% more meetings this month`);
            }
        }

        if (this.voiceCommands.length > 0) {
            insights.push(`You've used ${this.voiceCommands.length} voice commands so far`);
        }

        // Update insights display
        const container = document.getElementById('analyticsInsights');
        if (container) {
            container.innerHTML = insights.length > 0 ? 
                insights.map(insight => `
                    <div class="insight-item">
                        <i class="fas fa-lightbulb"></i>
                        <p>${insight}</p>
                    </div>
                `).join('') :
                `<div class="no-data">
                    <i class="fas fa-chart-line"></i>
                    <p>Create more meetings to see AI insights</p>
                </div>`;
        }
    }

    // Calendar
    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Update month/year display
        const monthYearElement = document.getElementById('calendarMonthYear');
        if (monthYearElement) {
            monthYearElement.textContent = `${monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
        }

        // Generate calendar grid
        const firstDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), 1);
        const lastDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Calendar days
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayMeetings = this.meetings.filter(meeting => meeting.date === dateStr);
            
            let dayClass = 'calendar-day';
            if (currentDate.getMonth() !== this.currentCalendarDate.getMonth()) {
                dayClass += ' other-month';
            }
            if (dateStr === todayStr) {
                dayClass += ' today';
            }
            if (dayMeetings.length > 0) {
                dayClass += ' has-meetings';
            }
            
            calendarHTML += `
                <div class="${dayClass}" onclick="app.handleCalendarDayClick('${dateStr}', ${JSON.stringify(dayMeetings).replace(/"/g, '&quot;')})">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="calendar-meetings">
                        ${dayMeetings.slice(0, 2).map(meeting => 
                            `<div class="calendar-meeting" title="${meeting.title} at ${this.formatTime(meeting.time)}">${meeting.title.length > 15 ? meeting.title.substring(0, 15) + '...' : meeting.title}</div>`
                        ).join('')}
                        ${dayMeetings.length > 2 ? `<div class="meeting-indicator">+${dayMeetings.length - 2} more</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        calendarGrid.innerHTML = calendarHTML;
    }

    changeMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    handleCalendarDayClick(date, meetings) {
        if (meetings.length > 0) {
            const meetingList = meetings.map(meeting => 
                `• ${meeting.title} at ${this.formatTime(meeting.time)}`
            ).join('\n');
            alert(`Meetings on ${this.formatDate(date)}:\n\n${meetingList}`);
        } else {
            if (confirm(`No meetings on ${this.formatDate(date)}. Would you like to schedule one?`)) {
                document.getElementById('meetingDate').value = date;
                this.switchSection('schedule');
            }
        }
    }

    // Notifications
    updateNotifications() {
        this.generateMeetingReminders();
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    generateMeetingReminders() {
        if (!this.settings.reminderNotifications) return;

        const now = new Date();
        const reminderTime = this.settings.reminderTime * 60 * 1000; // Convert to milliseconds

        this.meetings.forEach(meeting => {
            const meetingTime = new Date(meeting.date + ' ' + meeting.time);
            const reminderTime = new Date(meetingTime.getTime() - reminderTime);
            
            if (now >= reminderTime && now < meetingTime) {
                const existingReminder = this.notifications.find(n => 
                    n.type === 'reminder' && n.meetingId === meeting.id
                );
                
                if (!existingReminder) {
                    this.notifications.push({
                        id: Date.now(),
                        type: 'reminder',
                        meetingId: meeting.id,
                        title: 'Meeting Reminder',
                        message: `${meeting.title} starts in ${this.settings.reminderTime} minutes`,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                }
            }
        });

        this.saveNotifications();
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                this.renderNotifications();
            }
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationContent');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-bell"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        const sortedNotifications = this.notifications
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = sortedNotifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" onclick="app.markNotificationRead(${notification.id})">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${this.getRelativeTime(notification.timestamp)}</span>
            </div>
        `).join('');
    }

    markNotificationRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.renderNotifications();
            this.updateNotificationBadge();
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    saveNotifications() {
        localStorage.setItem('voiceSchedulePro_notifications', JSON.stringify(this.notifications));
    }

    // Utility Functions
    clearForm() {
        document.getElementById('meetingForm').reset();
        this.setMinDate();
        
        // Set default time to next hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        document.getElementById('meetingTime').value = now.toTimeString().slice(0, 5);
        
        // Reset tabs
        this.switchTab('basic');
        
        // Hide recurring options
        this.toggleRecurringOptions(false);
        document.getElementById('isRecurring').checked = false;
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('meetingDate');
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = today;
        }
    }

    setQuickDate(action) {
        const dateInput = document.getElementById('meetingDate');
        const today = new Date();
        
        switch (action) {
            case 'today':
                dateInput.value = today.toISOString().split('T')[0];
                break;
            case 'tomorrow':
                today.setDate(today.getDate() + 1);
                dateInput.value = today.toISOString().split('T')[0];
                break;
            case 'nextWeek':
                today.setDate(today.getDate() + 7);
                dateInput.value = today.toISOString().split('T')[0];
                break;
        }
    }

    getStartOfWeek() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(today.setDate(diff));
    }

    getEndOfWeek() {
        const startOfWeek = this.getStartOfWeek();
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return endOfWeek;
    }

    getNextWeekday(dayOfWeek) {
        const today = new Date();
        const currentDay = today.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        return targetDate.toISOString().split('T')[0];
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
    }

    showToast(message, type = 'info', title = '') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // Data Management
    exportData() {
        const data = {
            meetings: this.meetings,
            settings: this.settings,
            voiceCommands: this.voiceCommands,
            notifications: this.notifications,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voiceschedule-pro-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
        this.addToRecentActivity('data_exported', 'Exported all data');
    }

    exportMeetings() {
        const csv = this.convertMeetingsToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meetings-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Meetings exported successfully', 'success');
    }

    convertMeetingsToCSV() {
        const headers = ['Title', 'Date', 'Time', 'Duration', 'Description', 'Location', 'Attendees', 'Priority', 'Category', 'Type'];
        const rows = this.meetings.map(meeting => [
            meeting.title,
            meeting.date,
            meeting.time,
            meeting.duration,
            meeting.description || '',
            meeting.location || '',
            meeting.attendees || '',
            meeting.priority || 'medium',
            meeting.category || 'work',
            meeting.type || 'video-call'
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    generateReport() {
        const report = {
            totalMeetings: this.meetings.length,
            upcomingMeetings: this.meetings.filter(m => new Date(m.date) >= new Date()).length,
            voiceCommands: this.voiceCommands.length,
            averageDuration: this.meetings.reduce((sum, m) => sum + m.duration, 0) / this.meetings.length || 0,
            mostCommonType: this.getMostCommonType(),
            peakDay: this.getPeakDay(),
            generatedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voiceschedule-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Report generated successfully', 'success');
    }

    getMostCommonType() {
        const types = {};
        this.meetings.forEach(m => {
            const type = m.type || 'video-call';
            types[type] = (types[type] || 0) + 1;
        });
        return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'video-call');
    }

    getPeakDay() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = this.getWeeklyMeetingData();
        const maxIndex = dayData.indexOf(Math.max(...dayData));
        return days[(maxIndex + 1) % 7]; // Adjust for Monday start
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('voiceSchedulePro_meetings');
            localStorage.removeItem('voiceSchedulePro_settings');
            localStorage.removeItem('voiceSchedulePro_commands');
            localStorage.removeItem('voiceSchedulePro_notifications');
            localStorage.removeItem('voiceSchedulePro_activity');
            
            this.meetings = [];
            this.voiceCommands = [];
            this.notifications = [];
            this.settings = this.getDefaultSettings();
            
            this.updateDashboard();
            this.renderMeetings();
            this.renderCalendarView();
            this.updateAnalytics();
            this.loadSettings();
            
            this.showToast('All data cleared successfully', 'success');
        }
    }

    importCalendar() {
        this.showToast('Calendar import feature coming soon!', 'info');
    }

    saveDraft() {
        const formData = new FormData(document.getElementById('meetingForm'));
        const draft = {};
        for (let [key, value] of formData.entries()) {
            draft[key] = value;
        }
        localStorage.setItem('voiceSchedulePro_draft', JSON.stringify(draft));
        this.showToast('Draft saved successfully', 'success');
    }

    loadTemplate() {
        this.showToast('Template feature coming soon!', 'info');
    }

    refreshMeetings() {
        this.renderMeetings();
        this.showToast('Meetings refreshed', 'info');
    }

    startAIScheduling() {
        this.showToast('AI Scheduling feature coming soon!', 'info');
    }

    switchSettingsPanel(panelName) {
        // Update settings navigation
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');

        // Update settings panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${panelName}-panel`).classList.add('active');
    }
}

// Initialize app
const app = new VoiceSchedulerPro();

// Global functions for HTML onclick handlers
function startQuickVoice() {
    app.startQuickVoice();
}

function showVoiceModal() {
    app.showVoiceModal();
}

function closeVoiceModal() {
    app.closeVoiceModal();
}

function startVoiceRecognition() {
    app.startVoiceRecognition();
}

function toggleNotificationPanel() {
    app.toggleNotificationPanel();
}

function closeNotificationPanel() {
    app.closeNotificationPanel();
}

function markAllRead() {
    app.notifications.forEach(n => n.read = true);
    app.saveNotifications();
    app.renderNotifications();
    app.updateNotificationBadge();
    app.showToast('All notifications marked as read', 'success');
}

function clearNotifications() {
    app.notifications = [];
    app.saveNotifications();
    app.renderNotifications();
    app.updateNotificationBadge();
    app.showToast('All notifications cleared', 'success');
}

function clearForm() {
    app.clearForm();
}

function changeMonth(direction) {
    app.changeMonth(direction);
}

function switchSection(section) {
    app.switchSection(section);
}

function setQuickDate(action) {
    app.setQuickDate(action);
}

function toggleRecurringOptions(show) {
    app.toggleRecurringOptions(show);
}

function changeView(view) {
    app.changeView(view);
}

function sortMeetings(sortBy) {
    app.sortMeetings(sortBy);
}

function exportData() {
    app.exportData();
}

function exportMeetings() {
    app.exportMeetings();
}

function generateReport() {
    app.generateReport();
}

function clearAllData() {
    app.clearAllData();
}

function importCalendar() {
    app.importCalendar();
}

function saveDraft() {
    app.saveDraft();
}

function loadTemplate() {
    app.loadTemplate();
}

function refreshMeetings() {
    app.refreshMeetings();
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

function closeMobileSidebar() {
    app.closeMobileSidebar();
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function importData(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.meetings) {
                    app.meetings = data.meetings;
                    app.saveMeetings();
                }
                if (data.settings) {
                    app.settings = { ...app.getDefaultSettings(), ...data.settings };
                    app.saveSettings();
                    app.loadSettings();
                }
                if (data.voiceCommands) {
                    app.voiceCommands = data.voiceCommands;
                    localStorage.setItem('voiceSchedulePro_commands', JSON.stringify(app.voiceCommands));
                }
                app.updateDashboard();
                app.renderMeetings();
                app.renderCalendarView();
                app.showToast('Data imported successfully', 'success');
            } catch (error) {
                app.showToast('Error importing data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
}