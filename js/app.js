import { Player } from './player.js';
import { Banner } from './banner.js';

class App {
    constructor() {
        this.albums = [];
        this.player = new Player();
        this.banner = null;
        this.currentAlbum = null;
        this.totalSongs = 0;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('music_data.json');
            const data = await response.json();
            this.albums = data.albums;
            this.totalSongs = data.totalSongs;

            this.renderIntro();
            this.renderAlbumGrid();
            this.setupEventListeners();

            // Initialize Banner
            this.banner = new Banner(this.albums, () => {
                // Callback logic if needed
            });

            // Player listeners to stop banner
            this.player.audio.addEventListener('play', () => {
                this.banner.stop();
            });

            // Handle Routing
            this.handleRouting();
            window.addEventListener('popstate', () => this.handleRouting());

        } catch (error) {
            console.error('Failed to load music data:', error);
        }
    }

    handleRouting() {
        const params = new URLSearchParams(window.location.search);
        const albumId = params.get('album');
        const trackTitle = params.get('track');

        if (albumId) {
            this.showAlbumView(albumId, false);
            if (trackTitle && this.currentAlbum) {
                const trackIndex = this.currentAlbum.tracks.findIndex(t => t.title === trackTitle);
                if (trackIndex !== -1) {
                    const tracks = this.currentAlbum.tracks.map(t => ({ ...t, album: this.currentAlbum, cover: this.currentAlbum.cover }));
                    // Load track but don't auto-play to respect browser policies on page load
                    // unless user interaction triggered it (but here it's page load usually)
                    // Actually, if it's a popstate (back/forward), we might not want to autoplay either.
                    // Let's set autoPlay to false for deep linking.
                    this.player.playPlaylist(tracks, false, trackIndex, false);
                }
            }
        } else {
            this.showAlbumGrid(false);
        }
    }

    updateURL(params) {
        const url = new URL(window.location);
        url.search = params.toString();
        window.history.pushState({}, '', url);
    }

    setupEventListeners() {
        // Navigation
        document.querySelector('.logo-container').addEventListener('click', () => {
            this.updateURL(new URLSearchParams());
            this.showAlbumGrid();
        });

        // Shuffle All
        document.getElementById('shuffle-all-btn').addEventListener('click', () => {
            this.playRandom();
        });

        // Back Button (delegated)
        document.getElementById('album-view').addEventListener('click', (e) => {
            if (e.target.closest('.back-btn')) {
                this.updateURL(new URLSearchParams());
                this.showAlbumGrid();
            }
        });
    }

    playRandom() {
        const allTracks = this.albums.flatMap(album =>
            album.tracks.map(track => ({ ...track, album: album, cover: album.cover }))
        );
        this.player.playPlaylist(allTracks, true);
    }

    showAlbumGrid(updateHistory = true) {
        document.getElementById('album-grid-container').classList.remove('hidden');
        document.getElementById('album-view').classList.add('hidden');
        document.getElementById('intro-container').classList.remove('hidden'); // Show intro
        this.currentAlbum = null;

        // Show banner
        if (this.banner) this.banner.show();

        // Banner starts paused by default now, so no need to call start()

        if (updateHistory) {
            this.updateURL(new URLSearchParams());
        }
        document.title = "Mneuronico Music Portfolio";
    }

    showAlbumView(albumId, updateHistory = true) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;

        this.currentAlbum = album;
        if (this.banner) this.banner.hide();
        this.renderAlbumView(album);

        document.getElementById('album-grid-container').classList.add('hidden');
        document.getElementById('album-view').classList.remove('hidden');
        document.getElementById('intro-container').classList.add('hidden'); // Hide intro

        if (updateHistory) {
            const params = new URLSearchParams();
            params.set('album', albumId);
            this.updateURL(params);
        }
        document.title = `${album.title} - Mneuronico Music Portfolio`;
    }

    renderIntro() {
        const introContainer = document.getElementById('intro-container');
        introContainer.innerHTML = `
            <div class="intro-text">
                <p>Estas son canciones escritas y grabadas por mí principalmente durante mi niñez y adolescencia. 
                No son productos terminados y no deben tomarse como grabaciones profesionales. 
                La mayoría son pruebas, maquetas, etc. La intención no es mostrar el destino sino el camino.</p>
                <p class="song-count">Total de canciones: ${this.totalSongs}</p>
            </div>
        `;
    }

    renderAlbumGrid() {
        const grid = document.getElementById('album-grid');
        grid.innerHTML = this.albums.map(album => `
            <div class="album-card" data-id="${album.id}">
                <div class="cover-container">
                    <img src="${album.cover}" alt="${album.title}" class="album-cover" onerror="this.src='mneuronico.jpg'">
                    ${album.isRecommended ? '<span class="badge-recommended">Recomendado</span>' : ''}
                </div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-tracks-count">${album.tracks.length} tracks</div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showAlbumView(card.dataset.id);
            });
        });
    }

    renderAlbumView(album) {
        const view = document.getElementById('album-view');
        view.innerHTML = `
            <button class="back-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Albums
            </button>
            <div class="album-header">
                <img src="${album.cover}" alt="${album.title}" class="album-view-cover" onerror="this.src='mneuronico.jpg'">
                <div class="album-details">
                    <h2>${album.title}</h2>
                    <p>${album.tracks.length} Songs</p>
                    <div class="album-actions">
                        <button id="play-album-btn" class="nav-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Play Album
                        </button>
                        <button id="share-album-btn" class="nav-btn secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            Share
                        </button>
                    </div>
                </div>
            </div>
            <ul class="track-list">
                ${album.tracks.map((track, index) => `
                    <li class="track-item" data-index="${index}">
                        <div class="track-left">
                            <span class="track-number">${index + 1}</span>
                            <span class="track-title">${track.title}</span>
                        </div>
                        <button class="share-track-btn" data-index="${index}" title="Share Track">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;

        // Play Album Button
        view.querySelector('#play-album-btn').addEventListener('click', () => {
            const tracks = album.tracks.map(t => ({ ...t, album: album, cover: album.cover }));
            this.player.playPlaylist(tracks);
        });

        // Share Album Button
        view.querySelector('#share-album-btn').addEventListener('click', () => {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('album', album.id);
            this.copyToClipboard(url.toString());
        });

        // Track Click
        view.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.share-track-btn')) return; // Ignore share click

                const index = parseInt(item.dataset.index);
                const tracks = album.tracks.map(t => ({ ...t, album: album, cover: album.cover }));
                this.player.playPlaylist(tracks, false, index);

                // Update URL
                const track = tracks[index];
                const url = new URL(window.location.origin + window.location.pathname);
                url.searchParams.set('album', album.id);
                url.searchParams.set('track', track.title);
                window.history.pushState({}, '', url);
                document.title = `${track.title} - ${album.title} - Mneuronico Music Portfolio`;
            });
        });

        // Share Track Buttons
        view.querySelectorAll('.share-track-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const track = album.tracks[index];
                const url = new URL(window.location.origin + window.location.pathname);
                url.searchParams.set('album', album.id);
                url.searchParams.set('track', track.title);
                this.copyToClipboard(url.toString());
            });
        });
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
