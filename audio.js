class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.value = 0.5;
        
        this.backgroundMusicNode = null;
        this.isPlaying = false;
    }

    createOscillator(frequency, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }

    generateBackgroundMusic() {
        if (this.isPlaying) return;
        
        const notes = [262, 330, 392, 330, 262, 330, 392, 330]; // C4, E4, G4 pattern
        const noteDuration = 0.2;
        let time = this.audioContext.currentTime;
        
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGainNode);
        gainNode.gain.value = 0.2;

        const playNote = (index) => {
            if (!this.isPlaying) return;

            const oscillator = this.createOscillator(notes[index], 'sine');
            oscillator.connect(gainNode);
            
            oscillator.start(time);
            oscillator.stop(time + noteDuration);
            
            time += noteDuration;
            
            setTimeout(() => {
                playNote((index + 1) % notes.length);
            }, noteDuration * 1000);
        };

        this.isPlaying = true;
        playNote(0);
    }

    playBackgroundMusic() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.generateBackgroundMusic();
    }

    stopBackgroundMusic() {
        this.isPlaying = false;
    }

    playEatSound() {
        const oscillator = this.createOscillator(600, 'square');
        const gainNode = this.audioContext.createGain();
        
        gainNode.connect(this.masterGainNode);
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playGameOverSound() {
        this.stopBackgroundMusic();
        
        const oscillator = this.createOscillator(200, 'sawtooth');
        const gainNode = this.audioContext.createGain();
        
        gainNode.connect(this.masterGainNode);
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    playLevelUpSound() {
        const playTone = (freq, time) => {
            const oscillator = this.createOscillator(freq, 'square');
            const gainNode = this.audioContext.createGain();
            
            gainNode.connect(this.masterGainNode);
            oscillator.connect(gainNode);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + time + 0.1);
            
            oscillator.start(this.audioContext.currentTime + time);
            oscillator.stop(this.audioContext.currentTime + time + 0.1);
        };

        // Play ascending notes
        playTone(400, 0);
        playTone(500, 0.1);
        playTone(600, 0.2);
    }
} 