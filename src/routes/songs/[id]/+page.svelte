<script>
	export let data;

	let song = data.song;
	let transposedLyrics = song?.lyrics_chords || '';
	let keyOffset = 0;
	let showModal = false;
	let currentKey = song?.key || '';
	const originalKey = song?.key || '';
	let scale = 1;

	// Add playlist-related variables
	let showPlaylistModal = false;
	let playlists = [];
	let selectedPlaylistId = '';
	let userId = '';
	let loading = false;

	// 🎯 Handles full watch links, shortened youtu.be, and trims any extra params
	$: embedUrls = song
		? [song.links, song.link2]
				.filter(Boolean) // remove null/undefined
				.map((link) => {
					try {
						const url = new URL(link.trim());

						if (url.hostname.includes('youtu.be')) {
							return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
						}

						if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
							const videoId = url.searchParams.get('v');
							return `https://www.youtube.com/embed/${videoId}`;
						}
					} catch (err) {
						console.error('Invalid YouTube link:', link);
					}

					return null;
				})
				.filter(Boolean)
		: []; // remove any invalid ones

	// Load user's playlists when component mounts
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase.js';
	import { goto } from '$app/navigation';

	onMount(async () => {
		try {
			// Get current user
			const user = pb.authStore.model;
			if (user) {
				userId = user.id;

				// Fetch user's playlists
				const result = await pb.collection('playlists').getFullList({
					filter: `User = "${userId}"`
				});
				playlists = result;
				console.log('User playlists:', playlists);
			}
		} catch (error) {
			console.error('Error loading playlists:', error);
		}
	});

	// Function to open playlist selection modal
	function openPlaylistModal() {
		showPlaylistModal = true;
	}

	// Function to close playlist selection modal
	function closePlaylistModal() {
		showPlaylistModal = false;
		selectedPlaylistId = '';
	}

	// Function to add song to selected playlist
	async function addToPlaylist() {
		if (!selectedPlaylistId) {
			alert('Please select a playlist');
			return;
		}

		loading = true;
		try {
			// Get the selected playlist
			const playlist = await pb.collection('playlists').getOne(selectedPlaylistId);

			// Create a new Songs array that includes the current song ID
			const updatedSongs = [...(playlist.Songs || [])];

			// Add the song to the playlist if it's not already there
			if (!updatedSongs.includes(song.id)) {
				updatedSongs.push(song.id);

				// Update the playlist with the new Songs array
				await pb.collection('playlists').update(selectedPlaylistId, {
					Songs: updatedSongs
				});

				alert('Song added to playlist successfully!');
			} else {
				alert('This song is already in the playlist');
			}

			closePlaylistModal();
		} catch (error) {
			console.error('Error adding song to playlist:', error);
			alert('Failed to add song to playlist');
		} finally {
			loading = false;
		}
	}

	const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	function transposeNote(note, offset) {
		const idx = notes.indexOf(note);
		if (idx === -1) return note;
		return notes[(idx + offset + notes.length) % notes.length];
	}

	function splitChord(chord) {
		const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
		if (!match) return { root: chord, quality: '' };
		return { root: match[1], quality: match[2] };
	}

	function transposeChord(chord, offset) {
		if (chord.includes('/')) {
			const parts = chord.split('/');
			return transposeChord(parts[0], offset) + '/' + transposeChord(parts[1], offset);
		}
		const { root, quality } = splitChord(chord);
		return transposeNote(root, offset) + quality;
	}

	function isChord(token) {
		return /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*)?$/.test(
			token
		);
	}

	function transposeText(text, offset) {
		return text
			.split(/(\s+)/)
			.map((token) => (isChord(token) ? transposeChord(token, offset) : token))
			.join('');
	}

	function changeKey(offset) {
		keyOffset += offset;
		transposedLyrics = transposeText(song.lyrics_chords, keyOffset);
		currentKey = getCurrentKey();
	}

	function getCurrentKey() {
		const parts = originalKey.split(' ');
		const root = parts[0];
		const suffix = parts.slice(1).join(' ');
		const idx = notes.indexOf(root);
		if (idx === -1) return originalKey;
		return notes[(idx + keyOffset + notes.length) % notes.length] + (suffix ? ' ' + suffix : '');
	}

	function toggleModal() {
		showModal = !showModal;
	}
	//ZOOM FEATURE
	let fontSize = 1.2; // Set default to 120%

	function zoomIn() {
		if (fontSize < 3) fontSize += 0.1;
	}

	function zoomOut() {
		if (fontSize > 0.5) fontSize -= 0.1;
	}

	function handleCreatePlaylist() {
		goto('/playlists'); // Navigate to the playlists page
	}
</script>

{#if song}
	<div class="container mx-auto max-w-2xl p-2">
		<div class="mb-2 overflow-hidden rounded-lg bg-gray-900/50 shadow-lg">
			<h1
				class="cursor-pointer p-4 text-center text-xl font-bold text-white transition-colors hover:bg-gray-900"
				on:click={toggleModal}
			>
				{song.title}
				<span class="ml-2 inline-block">
					<svg
						width="9"
						transform="rotate(90)"
						height="15"
						viewBox="0 0 6 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1 9L3.58579 6.41421C4.25245 5.74755 4.58579 5.41421 4.58579 5C4.58579 4.58579 4.25245 4.25245 3.58579 3.58579L1 1"
							stroke="white"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						></path>
					</svg>
				</span>
			</h1>
		</div>

		<div class="mb-4 flex items-center justify-between">
			<div class="flex flex-col">
				<p class="text-sm text-gray-300">
					Original Key: <span class="font-medium text-[#d28fff]">{originalKey}</span>
				</p>
				<p class="text-sm text-gray-300">
					Current Key: <span class="font-medium text-[#d28fff]">{currentKey}</span>
				</p>
			</div>

			<div class="flex items-center gap-2">
				<button
					on:click={() => changeKey(-1)}
					class="rounded-full bg-gray-900/25 p-2 transition-colors hover:bg-gray-900"
					title="Transpose Down"
				>
					<svg
						class="h-5 w-5 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M6 12L18 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>

				<button
					on:click={() => changeKey(1)}
					class="rounded-full bg-gray-900/25 p-2 transition-colors hover:bg-gray-900"
					title="Transpose Up"
				>
					<svg
						class="h-5 w-5 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M6 12H18M12 6V18"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>

		<div class="mb-6 flex items-center justify-between rounded-lg bg-gray-950 p-3">
			<div class="flex items-center gap-2">
				<button
					on:click={zoomOut}
					class="rounded-md bg-gray-900 px-3 py-1 text-white transition-colors hover:bg-gray-800"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
				<span class="text-sm text-gray-300">{Math.round(fontSize * 100)}%</span>

				<button
					on:click={zoomIn}
					class="rounded-md bg-gray-900 px-3 py-1 text-white transition-colors hover:bg-gray-800"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>

			<button
				on:click={openPlaylistModal}
				class="flex items-center gap-2 rounded-md bg-[#7623ad] px-4 py-1 text-white transition-colors hover:bg-[#5a1b85]"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
					<path
						fill-rule="evenodd"
						d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
						clip-rule="evenodd"
					/>
				</svg>
				Add to Playlist
			</button>
		</div>

		<div class="lyrics-container" style="font-size: {fontSize}rem;">
			<pre
				class="lyrics mb-20 rounded-lg bg-gray-950 p-4 text-white shadow-lg">{transposedLyrics}</pre>
		</div>
	</div>

	{#if showModal}
		<div
			class="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			on:click={toggleModal}
		>
			<div
				class="mx-4 w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl"
				on:click|stopPropagation
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-white">Song Details</h2>
					<button class="text-2xl text-gray-400 hover:text-white" on:click={toggleModal}
						>&times;</button
					>
				</div>

				<p class="mb-4 text-gray-300">
					Artist: <span class="text-[#bf5eff]">{song.artist || 'Unknown Artist'}</span>
				</p>
				<h3 class="mb-4 text-lg font-semibold text-white">YouTube Video:</h3>

				{#if embedUrls.length > 0}
					<div class="grid gap-4">
						{#each embedUrls as url}
							<div class="relative h-0 w-full overflow-hidden rounded-lg pb-[56.25%] shadow-lg">
								<iframe
									class="absolute top-0 left-0 h-full w-full"
									src={url}
									frameborder="0"
									allow="autoplay; encrypted-media"
									allowfullscreen
									title="YouTube Video"
								></iframe>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-400">No video links provided.</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Playlist Selection Modal -->
	{#if showPlaylistModal}
		<div
			class="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			on:click={closePlaylistModal}
		>
			<div
				class="mx-4 w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl"
				on:click|stopPropagation
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-white">Add to Playlist</h2>
					<button class="text-2xl text-gray-400 hover:text-white" on:click={closePlaylistModal}
						>&times;</button
					>
				</div>

				{#if userId}
					{#if playlists && playlists.length > 0}
						<div class="mb-4 max-h-60 overflow-y-auto">
							{#each playlists as playlist}
								<div
									class="flex items-center border-b border-gray-700 p-3 transition-colors hover:bg-gray-700"
								>
									<input
										type="radio"
										id={playlist.id}
										name="playlist"
										value={playlist.id}
										bind:group={selectedPlaylistId}
										class="mr-3"
									/>
									<label for={playlist.id} class="cursor-pointer text-white"
										>{playlist.playlist_name}</label
									>
								</div>
							{/each}
						</div>
						<div class="flex justify-end gap-3">
							<button
								on:click={addToPlaylist}
								class="rounded-md bg-[#7623ad] px-4 py-2 text-white transition-colors hover:bg-[#5a1b85] disabled:cursor-not-allowed disabled:opacity-50"
								disabled={loading || !selectedPlaylistId}
							>
								{loading ? 'Adding...' : 'Add to Playlist'}
							</button>
							<button
								on:click={closePlaylistModal}
								class="rounded-md bg-gray-950 px-4 py-2 text-white transition-colors hover:bg-black"
							>
								Cancel
							</button>
						</div>
					{:else}
						<p class="mb-4 text-gray-300">You don't have any playlists yet.</p>
						<div class="flex justify-end gap-3">
							<a
								href="#"
								class="rounded-md bg-[#7623ad] px-4 py-2 text-white transition-colors hover:bg-[#5a1b85]"
								on:click={(e) => {
									e.preventDefault(); // Prevent default link behavior
									handleCreatePlaylist(); // Call the navigation function
								}}
							>
								Create Playlist
							</a>
							<button
								on:click={closePlaylistModal}
								class="rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
							>
								Close
							</button>
						</div>
					{/if}
				{:else}
					<p class="mb-4 text-gray-300">Please sign in to add songs to playlists.</p>
					<div class="flex justify-end gap-3">
						<a
							href="/login"
							class="rounded-md bg-[#7623ad] px-4 py-2 text-white transition-colors hover:bg-[#5a1b85]"
						>
							Sign In
						</a>
						<button
							on:click={closePlaylistModal}
							class="rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="container mx-auto max-w-2xl p-4">
		<div class="rounded-lg bg-gray-800 p-6 text-center shadow-lg">
			<p class="text-lg text-red-400">Song not found. Please check the URL.</p>
		</div>
	</div>
{/if}

<style>
	.lyrics-container {
		/* Let the container size naturally to its content */
		display: block;
		/* Remove min-height: 100vh; */
		/* Remove padding-bottom: 10vh; */

		/* Optionally limit the container's width so text isn't too wide on big screens */
		max-width: 50rem; /* or 60ch, or 700px, etc. to your preference */
		margin: 0 auto; /* centers horizontally */

		/* If you still want some spacing at the bottom, you can do:
     padding-bottom: 2rem; 
  */

		/* The transform-origin is no longer necessary if you're not scaling with transforms */
		/* transform-origin: top center; */
		overflow: visible;
	}

	.lyrics {
		white-space: pre-wrap;
		font-size: inherit; /* Inherit from the inline style in <div style="font-size: {fontSize}rem;"> */
		font-family: 'Abel', sans-serif;
	}

	.font-abel {
		font-family: 'Abel', sans-serif;
	}

	.video-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%;
		height: 0;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
