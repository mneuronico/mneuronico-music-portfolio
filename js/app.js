import { Player } from './player.js';

class App {
    constructor() {
        this.albums = [];
        this.player = new Player();
        this.currentAlbum = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('music_data.json');
            this.albums = await response.json();
            this.renderAlbumGrid();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load music data:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelector('.logo-container').addEventListener('click', () => {
            this.showAlbumGrid();
        });

        // Shuffle All
        document.getElementById('shuffle-all-btn').addEventListener('click', () => {
            const allTracks = this.albums.flatMap(album => 
                album.tracks.map(track => ({ ...track, album: album, cover: album.cover }))
            );
            this.player.playPlaylist(allTracks, true);
        });

        // Back Button (delegated)
        document.getElementById('album-view').addEventListener('click', (e) => {
            if (e.target.closest('.back-btn')) {
                this.showAlbumGrid();
            }
        });
    }

    showAlbumGrid() {
        document.getElementById('album-grid').classList.remove('hidden');
        document.getElementById('album-view').classList.add('hidden');
        this.currentAlbum = null;
    }

    showAlbumView(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;

        this.currentAlbum = album;
        this.renderAlbumView(album);
        
        document.getElementById('album-grid').classList.add('hidden');
        document.getElementById('album-view').classList.remove('hidden');
    }

    renderAlbumGrid() {
        const grid = document.getElementById('album-grid');
        grid.innerHTML = this.albums.map(album => `
            <div class="album-card" data-id="${album.id}">
                <img src="${album.cover}" alt="${album.title}" class="album-cover" onerror="this.src='mneuronico.jpg'">
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
                    <button id="play-album-btn" class="nav-btn" style="margin-top: 1rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Play Album
                    </button>
                </div>
            </div>
            <ul class="track-list">
                ${album.tracks.map((track, index) => `
                    <li class="track-item" data-index="${index}">
                        <span class="track-number">${index + 1}</span>
                        <span class="track-title">${track.title}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        // Play Album Button
        view.querySelector('#play-album-btn').addEventListener('click', () => {
            const tracks = album.tracks.map(t => ({ ...t, album: album, cover: album.cover }));
            this.player.playPlaylist(tracks);
        });

        // Track Click
        view.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const tracks = album.tracks.map(t => ({ ...t, album: album, cover: album.cover }));
                this.player.playPlaylist(tracks, false, index);
            });
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
