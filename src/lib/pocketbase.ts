// src/lib/pocketbase.js
import PocketBase from 'pocketbase';

// Create and export the PocketBase instance
export const pb = new PocketBase('https://p2idzl17fmm0xad.pocketbasecloud.com');

// Type definitions
export interface Song {
	id: string;
	title: string;
	lyrics_chords: string;
	key: string;
	artist: string;
	keywords: string;
	language: string;
	links?: string;
	link2?: string;
	youtube_id?: string;
	created_by?: string;
	created: string;
	updated: string;
}

export interface Playlist {
	id: string;
	title: string;
	description: string;
	Songs: Song[];
	user_id: string;
	created: string;
	updated: string;
}

export interface FetchSongsOptions {
	sort?: string;
	filter?: string;
	page?: number;
	perPage?: number;
}

export interface UserData {
	email: string;
	password: string;
	name?: string;
}

// Helper functions for common operations
export async function fetchSongs(options: FetchSongsOptions = {}): Promise<{ items: Song[] }> {
	try {
		const { sort = '-title', filter = '', page = 1, perPage = 10 } = options;
		return await pb.collection('songs').getList(page, perPage, {
			sort,
			filter,
			expand: 'created_by'
		});
	} catch (error) {
		console.error('Error fetching songs:', error);
		throw error;
	}
}

export async function fetchPlaylists(userId: string): Promise<{ items: Playlist[] }> {
	try {
		return await pb.collection('playlists').getList(1, 50, {
			filter: `user_id = "${userId}"`,
			expand: 'Songs',
			sort: '-created'
		});
	} catch (error) {
		console.error('Error fetching playlists:', error);
		throw error;
	}
}

export async function searchSongs(query: string, languages: string[] = []): Promise<{ items: Song[] }> {
	try {
		// Get all songs using getFullList instead of filtered getList
		const allSongs = await pb.collection('songs').getFullList({
			sort: '-created'
		}) as Song[];
		
		// Then filter them programmatically to avoid filter syntax errors
		const safeQuery = query.trim().toLowerCase();
		
		let filteredSongs = allSongs;
		
		// Apply search query filter if provided
		if (safeQuery) {
			filteredSongs = filteredSongs.filter(song => 
				song.title.toLowerCase().includes(safeQuery)
			);
		}
		
		// Apply language filter if provided
		if (languages && languages.length > 0) {
			filteredSongs = filteredSongs.filter(song => 
				languages.includes(song.language)
			);
		}
		
		// Return in the same format as getList for compatibility
		return {
			items: filteredSongs
		};
	} catch (error) {
		console.error('Error searching songs:', error);
		throw error;
	}
}

// Auth helper functions
export async function login(email: string, password: string): Promise<any> {
	try {
		return await pb.collection('users').authWithPassword(email, password);
	} catch (error) {
		console.error('Login error:', error);
		throw error;
	}
}

export async function signup(userData: UserData): Promise<any> {
	try {
		return await pb.collection('users').create(userData);
	} catch (error) {
		console.error('Signup error:', error);
		throw error;
	}
}

export function logout(): void {
	pb.authStore.clear();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
	return pb.authStore.isValid;
}

// Get current user
export function getCurrentUser(): any {
	return pb.authStore.model;
}

// Example update call should be performed in your component logic, for instance:
// await pb.collection("playlists").update(playlist.id, playlist);
