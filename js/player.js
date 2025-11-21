export class Player {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false; // Shuffle logic handled by playlist randomization for now

        this.elements = {
            playBtn: document.getElementById('play-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            playIcon: document.getElementById('play-icon'),
            pauseIcon: document.getElementById('pause-icon'),
            progressBar: document.getElementById('seek-bar'),
            currentTime: document.getElementById('current-time'),
            duration: document.getElementById('duration'),
            volumeBar: document.getElementById('volume-bar'),
            title: document.getElementById('player-title'),
            album: document.getElementById('player-album'),
            cover: document.getElementById('player-cover')
        };

        this.setupListeners();
    }

    setupListeners() {
        // Play/Pause
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());

        // Next/Prev
        this.elements.nextBtn.addEventListener('click', () => this.next());
        this.elements.prevBtn.addEventListener('click', () => this.prev());

        // Audio Events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.duration.textContent = this.formatTime(this.audio.duration);
            this.elements.progressBar.max = this.audio.duration;
        });
        this.audio.addEventListener('ended', () => this.next());

        // Seek
        this.elements.progressBar.addEventListener('input', (e) => {
            this.audio.currentTime = e.target.value;
        });

        // Volume
        this.elements.volumeBar.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });
    }

    playPlaylist(tracks, shuffle = false, startIndex = 0) {
        this.playlist = [...tracks];
        if (shuffle) {
            this.shufflePlaylist();
            this.currentIndex = 0;
        } else {
            this.currentIndex = startIndex;
        }
        this.loadTrack(this.playlist[this.currentIndex]);
        this.play();
    }

    shufflePlaylist() {
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
    }

    loadTrack(track) {
        this.audio.src = track.src;
        this.elements.title.textContent = track.title;
        this.elements.album.textContent = track.album.title;
        this.elements.cover.src = track.cover;
        this.elements.cover.classList.remove('hidden');

        // Reset progress
        this.elements.progressBar.value = 0;
        this.elements.currentTime.textContent = "0:00";
    }

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
        }).catch(e => console.error("Playback failed:", e));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    next() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
            this.loadTrack(this.playlist[this.currentIndex]);
            this.play();
        } else {
            // Loop to start? Or stop. Let's loop for now.
            this.currentIndex = 0;
            this.loadTrack(this.playlist[this.currentIndex]);
            this.play();
        }
    }

    prev() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.loadTrack(this.playlist[this.currentIndex]);
                this.play();
            }
        }
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.elements.playIcon.classList.add('hidden');
            this.elements.pauseIcon.classList.remove('hidden');
        } else {
            this.elements.playIcon.classList.remove('hidden');
            this.elements.pauseIcon.classList.add('hidden');
        }
    }

    updateProgress() {
        this.elements.progressBar.value = this.audio.currentTime;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
