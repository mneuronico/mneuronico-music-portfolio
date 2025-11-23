export class Banner {
    constructor(albums, onPlayCallback) {
        this.albums = albums;
        this.onPlayCallback = onPlayCallback; // To stop banner when main player starts
        this.audioA = new Audio();
        this.audioB = new Audio();
        this.currentAudio = this.audioA;
        this.nextAudio = this.audioB;
        this.isPlaying = false;
        this.fadeDuration = 2000; // 2s crossfade
        this.clipDuration = 20000; // 20s clip
        this.timer = null;
        this.container = document.getElementById('banner-container');
        this.infoElement = document.getElementById('banner-info');
        this.coverElement = document.getElementById('banner-cover');

        this.init();
    }

    init() {
        // Flatten tracks
        this.allTracks = this.albums.flatMap(album =>
            album.tracks.map(track => ({ ...track, album: album, cover: album.cover }))
        );

        if (this.allTracks.length === 0) return;

        // Set initial UI state
        this.infoElement.textContent = "Click to Play Mashup";
        this.coverElement.src = "mneuronico.jpg"; // Default or random cover

        this.container.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.start();
            }
        });
    }

    show() {
        this.container.classList.add('visible');
    }

    hide() {
        this.container.classList.remove('visible');
        this.stop();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.container.classList.add('active'); // For styling if needed
        this.infoElement.textContent = "Loading...";
        this.playNextClip(this.currentAudio, true);
    }

    stop() {
        this.isPlaying = false;
        this.container.classList.remove('active');
        this.audioA.pause();
        this.audioB.pause();
        clearTimeout(this.timer);
    }

    playNextClip(audioElement, isFirst = false) {
        if (!this.isPlaying) return;

        const track = this.getRandomTrack();
        audioElement.src = track.src;

        // Random start time (avoiding last 10s)
        audioElement.addEventListener('loadedmetadata', () => {
            if (!this.isPlaying) return; // Check again

            const maxStart = Math.max(0, audioElement.duration - 15);
            audioElement.currentTime = Math.random() * maxStart;

            audioElement.volume = 0;
            audioElement.play().catch(e => console.error("Banner play failed", e));

            // Fade In
            this.fade(audioElement, 0, 1, this.fadeDuration);

            // Update UI
            this.updateUI(track);

            // Schedule next
            this.timer = setTimeout(() => {
                const next = audioElement === this.audioA ? this.audioB : this.audioA;
                this.playNextClip(next);
                // Fade out current after overlap
                setTimeout(() => {
                    this.fade(audioElement, 1, 0, this.fadeDuration);
                }, 0);
            }, this.clipDuration - this.fadeDuration);

        }, { once: true });
    }

    fade(audio, startVol, endVol, duration) {
        const steps = 20;
        const stepTime = duration / steps;
        const volStep = (endVol - startVol) / steps;
        let currentVol = startVol;
        let stepCount = 0;

        const interval = setInterval(() => {
            currentVol += volStep;
            stepCount++;
            if (currentVol < 0) currentVol = 0;
            if (currentVol > 1) currentVol = 1;
            audio.volume = currentVol;

            if (stepCount >= steps) {
                clearInterval(interval);
                if (endVol === 0) {
                    audio.pause();
                }
            }
        }, stepTime);
    }

    getRandomTrack() {
        return this.allTracks[Math.floor(Math.random() * this.allTracks.length)];
    }

    updateUI(track) {
        this.infoElement.textContent = `${track.title} - ${track.album.title}`;
        this.coverElement.src = track.cover;
        // Trigger animation
        this.coverElement.classList.remove('fade-in');
        void this.coverElement.offsetWidth; // trigger reflow
        this.coverElement.classList.add('fade-in');
    }
}
