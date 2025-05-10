<script lang="ts">
	import PocketBase from 'pocketbase';
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';

	type Song = {
		id: string;
		title: string;
		lyrics_chords: string;
		key: string;
		artist: string;
		keywords: string;
		language: string;
		links?: string;
		created_by?: string;
	};

	type User = {
		id: string;
		email?: string;
		[key: string]: any;
	};

	let title = '';
	let lyrics_chords = '';
	let key = '';
	let selectedNote = 'C';
	let selectedQuality = 'Major';
	let artist = '';
	let keywords = '';
	let language = '';
	let youtubeLink = '';
	let currentUser: User | null = null;

	// Available notes and qualities for key selection
	const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
	const qualities = ['Major', 'Minor'];

	let successMessage = '';
	let errorMessage = '';
	let songs: Song[] = [];
	let currentPage = 1;
	let totalPages = 0;
	let isAuthenticated = false;
	let isSubmitting = false;
	let isFetching = false;
	let debugInfo = ''; // For tracking what's happening

	// Edit song state variables
	let isEditing = false;
	let editingSong: Song | null = null;
	let editTitle = '';
	let editLyricsChords = '';
	let editSelectedNote = 'C';
	let editSelectedQuality = 'Major';
	let editArtist = '';
	let editKeywords = '';
	let editLanguage = '';
	let editYoutubeLink = '';
	let isUpdating = false;

	onMount(() => {
		// Check if user is authenticated on component mount
		checkAuthentication();
	});

	// Update the key whenever note or quality changes
	$: key = `${selectedNote}${selectedQuality === 'Minor' ? ' Minor' : ' Major'}`;
	$: editKey = `${editSelectedNote}${editSelectedQuality === 'Minor' ? ' Minor' : ' Major'}`;

	function checkAuthentication() {
		const authStore = pb.authStore;
		if (authStore.isValid) {
			currentUser = authStore.model;
			isAuthenticated = true;
			if (currentUser) {
				console.log('User authenticated:', currentUser.id);
			}
			// Fetch songs after confirming authentication
			fetchSongs();
		} else {
			isAuthenticated = false;
			currentUser = null;
			console.log('User not authenticated');
		}
	}

	async function addSong() {
		successMessage = '';
		errorMessage = '';
		isSubmitting = true;

		if (!isAuthenticated || !currentUser) {
			errorMessage = 'You must be logged in to add songs';
			isSubmitting = false;
			return;
		}

		try {
			const data = {
				title,
				lyrics_chords,
				key,
				artist,
				keywords,
				language,
				links: youtubeLink,
				created_by: currentUser.id // Add the current user's ID to the created_by field
			};

			console.log('Creating song with data:', data);
			const record = await pb.collection('songs').create(data);
			console.log('Song created successfully:', record);

			successMessage = 'Song added successfully!';
			title = '';
			lyrics_chords = '';
			selectedNote = 'C';
			selectedQuality = 'Major';
			artist = '';
			keywords = '';
			language = '';
			youtubeLink = '';

			// Refresh songs list after adding
			setTimeout(() => fetchSongs(), 500); // Small delay to allow the server to process
		} catch (error) {
			errorMessage = 'Error adding song: ' + (error instanceof Error ? error.message : String(error));
			console.error('Error adding song:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function fetchSongs() {
		// Early return if user is not authenticated
		if (!isAuthenticated || !currentUser) {
			console.log('Not fetching songs: User not authenticated');
			songs = [];
			return;
		}

		isFetching = true;
		errorMessage = '';
		successMessage = '';
		debugInfo = '';

		try {
			// Use the working filter format with single quotes
			const filterValue = encodeURIComponent(`created_by='${currentUser.id}'`);
			const url = `https://p2idzl17fmm0xad.pocketbasecloud.com/api/collections/songs/records?filter=${filterValue}&sort=-created`;

			console.log('Fetching songs with URL:', url);
			const response = await fetch(url);

			if (response.ok) {
				const data = await response.json();
				console.log(`Fetched ${data.items.length} songs for user`);

				// Set the songs in state
				songs = data.items;

				if (data.items.length > 0) {
					// Silently indicate success
					successMessage = `Found ${data.items.length} songs`;
				} else {
					// No songs found
					console.log('No songs found for current user');
				}
			} else {
				// If the primary approach fails, try fetching all songs and filter client-side
				console.error('Primary fetch failed, trying fallback approach');

				const fallbackResponse = await fetch('https://p2idzl17fmm0xad.pocketbasecloud.com/api/collections/songs/records');

				if (fallbackResponse.ok) {
					const allData = await fallbackResponse.json();
					console.log(`Fetched all ${allData.items.length} songs, filtering client-side`);

					// Client-side filtering
					const userSongs = allData.items.filter((song: Song) => currentUser && song.created_by === currentUser.id);

					console.log(`Found ${userSongs.length} songs for user after filtering`);
					songs = userSongs;

					if (userSongs.length > 0) {
						successMessage = `Found ${userSongs.length} songs (filtered client-side)`;
					}
				} else {
					throw new Error(`Failed to fetch songs: ${fallbackResponse.status}`);
				}
			}
		} catch (error) {
			console.error('Error fetching songs:', error);
			errorMessage = 'Error fetching songs: ' + (error instanceof Error ? error.message : String(error));
			songs = [];
		} finally {
			isFetching = false;
		}
	}

	function openEditModal(song: Song) {
		editingSong = song;
		// Split the key into note and quality
		if (song.key && song.key.length > 0) {
			if (song.key.endsWith('m')) {
				editSelectedNote = song.key.slice(0, -1);
				editSelectedQuality = 'Minor';
			} else {
				editSelectedNote = song.key;
				editSelectedQuality = 'Major';
			}
		} else {
			editSelectedNote = 'C';
			editSelectedQuality = 'Major';
		}

		editTitle = song.title || '';
		editLyricsChords = song.lyrics_chords || '';
		editArtist = song.artist || '';
		editKeywords = song.keywords || '';
		editLanguage = song.language || '';
		editYoutubeLink = song.links || '';

		isEditing = true;
	}

	function closeEditModal() {
		isEditing = false;
		editingSong = null;
	}

	async function updateSong() {
		if (!editingSong || !isAuthenticated) return;

		isUpdating = true;
		errorMessage = '';
		successMessage = '';

		try {
			const data = {
				title: editTitle,
				lyrics_chords: editLyricsChords,
				key: editKey,
				artist: editArtist,
				keywords: editKeywords,
				language: editLanguage,
				links: editYoutubeLink
				// Don't change the created_by field, keep it as is
			};

			console.log('Updating song with data:', data);
			const record = await pb.collection('songs').update(editingSong.id, data);
			console.log('Song updated successfully:', record);

			successMessage = 'Song updated successfully!';

			// Close the modal and refresh the songs list
			closeEditModal();
			setTimeout(() => fetchSongs(), 500);
		} catch (error) {
			errorMessage = 'Error updating song: ' + (error instanceof Error ? error.message : String(error));
			console.error('Error updating song:', error);
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-950 text-gray-200">
	<div class="container mx-auto max-w-6xl px-4 py-4">
		<h1 class="mb-5 text-center text-2xl font-bold text-[#ffffff]">Add a New Song</h1>

		{#if isAuthenticated}
			<!-- Song Form -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div class="lg:col-span-2">
					<div class="overflow-hidden rounded-xl bg-gray-900/80">
						<div class="p-4">
							<form on:submit|preventDefault={addSong} class="space-y-6">
								<!-- Title -->
								<div>
									<label for="title" class="mb-1 block text-sm font-medium text-gray-300">
										Song Title
									</label>
									<input
										bind:value={title}
										id="title"
										type="text"
										class="w-full rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
										placeholder="Enter song title"
										required
									/>
								</div>

								<!-- Lyrics & Chords -->
								<div>
									<label for="lyrics_chords" class="mb-1 block text-sm font-medium text-gray-300">
										Lyrics & Chords
									</label>
									<textarea
										bind:value={lyrics_chords}
										id="lyrics_chords"
										rows="12"
										class="font-abel w-full resize-y rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 font-mono text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
										placeholder="Enter lyrics with chords"
										required
									></textarea>
								</div>

								<!-- Song Details - 2 columns on large screens -->
								<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
									<!-- Key Selection -->
									<div>
										<label for="noteSelect" class="mb-1 block text-sm font-medium text-gray-300">
											Key
										</label>
										<div class="flex gap-2">
											<select
												id="noteSelect"
												bind:value={selectedNote}
												class="w-1/2 rounded-lg border-2 border-gray-800 bg-gray-950 px-3 py-2 text-white focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											>
												{#each notes as note}
													<option value={note}>{note}</option>
												{/each}
											</select>

											<select
												id="qualitySelect"
												bind:value={selectedQuality}
												class="w-1/2 rounded-lg border-2 border-gray-800 bg-gray-950 px-3 py-2 text-white focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											>
												{#each qualities as quality}
													<option value={quality}>{quality}</option>
												{/each}
											</select>
										</div>
										<p class="mt-1 text-xs text-gray-400">
											Selected key: {key}
										</p>
									</div>

									<!-- Artist -->
									<div>
										<label for="artist" class="mb-1 block text-sm font-medium text-gray-300">
											Artist
										</label>
										<input
											bind:value={artist}
											id="artist"
											type="text"
											class="w-full rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											placeholder="Enter artist name"
										/>
									</div>

									<!-- Language -->
									<div>
										<label for="language" class="mb-1 block text-sm font-medium text-gray-300">
											Language
										</label>
										<input
											bind:value={language}
											id="language"
											type="text"
											class="w-full rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											placeholder="Enter language"
										/>
									</div>

									<!-- Keywords -->
									<div>
										<label for="keywords" class="mb-1 block text-sm font-medium text-gray-300">
											Keywords
										</label>
										<input
											bind:value={keywords}
											id="keywords"
											type="text"
											class="w-full rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											placeholder="Enter keywords for search"
										/>
									</div>

									<!-- YouTube Link -->
									<div class="md:col-span-2">
										<label for="youtubeLink" class="mb-1 block text-sm font-medium text-gray-300">
											YouTube Link
										</label>
										<input
											bind:value={youtubeLink}
											id="youtubeLink"
											type="url"
											class="w-full rounded-lg border-2 border-gray-800 bg-gray-950 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
											placeholder="https://www.youtube.com/watch?v=..."
										/>
									</div>
								</div>

								<!-- Submit Button -->
								<div class="flex justify-center pt-4">
									<button
										type="submit"
										disabled={isSubmitting}
										class="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-6 py-2.5 font-medium text-white shadow-md transition duration-300 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-500 md:w-auto md:min-w-[200px]"
									>
										{#if isSubmitting}
											<svg
												class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												></circle>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Submitting...
										{:else}
											Add Song
										{/if}
									</button>
								</div>

								<!-- Success/Error Messages -->
								{#if successMessage}
									<div
										class="rounded border border-green-700 bg-green-800/30 px-4 py-3 text-green-400"
									>
										{successMessage}
									</div>
								{/if}

								{#if errorMessage}
									<div class="rounded border border-red-700 bg-red-800/30 px-4 py-3 text-red-400">
										{errorMessage}
									</div>
								{/if}
							</form>
						</div>
					</div>
				</div>

				<!-- Your Submissions -->
				<div class="lg:col-span-1">
					<div class="sticky top-8 overflow-hidden rounded-xl bg-gray-900/75 shadow-lg">
						<div class="p-6">
							<h2 class="mb-4 flex items-center justify-between text-xl font-bold text-white">
								<div class="flex items-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-5 w-5 text-[#8bb4ff]"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0014.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"
										/>
									</svg>
									Your Submissions
								</div>

								<!-- Refresh button -->
								<button
									on:click={fetchSongs}
									class="text-gray-400 transition-colors hover:text-[#005ac2]"
									title="Refresh songs"
									disabled={isFetching}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										class:animate-spin={isFetching}
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</button>
							</h2>

							{#if isFetching}
								<div class="flex justify-center py-8">
									<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-[#7623ad]"></div>
								</div>
							{:else if songs.length > 0}
								<div class="custom-scrollbar max-h-[700px] space-y-4 overflow-y-auto pr-2">
									{#each songs as song}
										<div
											class="rounded-lg bg-gray-950 p-4 transition duration-400 hover:bg-gray-950/75"
										>
											<h3 class="truncate text-lg font-medium text-[#a3e5ff]">
												{song.title}
											</h3>
											<div class="mt-2 flex items-center justify-between">
												<p class="text-sm text-gray-300">
													{song.artist || 'Unknown artist'}
												</p>
												<span class="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300">
													{song.key || 'No key'}
												</span>
											</div>
											<div class="mt-3 flex items-center justify-between">
												<div>
													{#if song.links}
														<a
															href={song.links}
															target="_blank"
															rel="noopener noreferrer"
															class="mr-2 inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="mr-1 h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																/>
															</svg>
															YouTube
														</a>
													{/if}
												</div>
												<div class="flex space-x-2">
													<!-- Edit Button -->
													<button
														on:click={() => openEditModal(song)}
														class="flex items-center rounded-md bg-gray-600 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-500 hover:text-white"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="mr-1 h-3.5 w-3.5"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
															/>
														</svg>
														Edit
													</button>

													<!-- View Song -->
													<a
														href={`/songs/${song.id}`}
														class="flex items-center rounded-md bg-[#2343ad] px-3 py-1 text-sm text-white transition-colors hover:bg-[#2343adb4]"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="mr-1 h-3.5 w-3.5"
															viewBox="0 0 20 20"
															fill="currentColor"
														>
															<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
															<path
																fill-rule="evenodd"
																d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
																clip-rule="evenodd"
															/>
														</svg>
														View
													</a>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="rounded-lg bg-gray-700 p-8 text-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mx-auto mb-4 h-12 w-12 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
										/>
									</svg>
									<p class="text-gray-400">You haven't submitted any songs yet.</p>
									<p class="mt-2 text-sm text-gray-500">
										Your songs will appear here after submission.
									</p>
								</div>
							{/if}

							{#if errorMessage}
								<div
									class="mt-4 rounded border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-400"
								>
									{errorMessage}
								</div>
							{/if}

							{#if successMessage && !errorMessage}
								<div
									class="mt-4 hidden rounded border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-400"
								>
									{successMessage}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Login Required Message -->
			<div class="mx-auto max-w-2xl overflow-hidden rounded-xl bg-gray-900/50 shadow-lg">
				<div class="p-6 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto mb-4 h-16 w-16"
						fill="none"
						viewBox="-13 0 50 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					<h2 class="mb-2 text-2xl font-bold text-white">Login Required</h2>
					<p class="mb-6 text-gray-300">
						You need to be logged in to add songs and access your submissions.
					</p>
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<a
							href="/login"
							class="w-full rounded-lg bg-[#7623ad] px-6 py-2.5 font-medium text-white shadow-md transition duration-400 hover:bg-[#5a1a8a] sm:w-auto"
						>
							Log In
						</a>
						<a
							href="/signup"
							class="w-full rounded-lg bg-gray-700 px-6 py-2.5 font-medium text-white shadow-md transition duration-400 hover:bg-gray-600 sm:w-auto"
						>
							Sign Up
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Edit Song Modal -->
{#if isEditing && editingSong}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-gray-800 shadow-2xl">
			<div class="p-6">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-white">Edit Song</h2>
					<button on:click={closeEditModal} class="text-gray-400 hover:text-white">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={updateSong} class="space-y-6">
					<!-- Title -->
					<div>
						<label for="editTitle" class="mb-1 block text-sm font-medium text-gray-300">
							Song Title
						</label>
						<input
							bind:value={editTitle}
							id="editTitle"
							type="text"
							class="w-full rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
							placeholder="Enter song title"
							required
						/>
					</div>

					<!-- Lyrics & Chords -->
					<div>
						<label for="editLyricsChords" class="mb-1 block text-sm font-medium text-gray-300">
							Lyrics & Chords
						</label>
						<textarea
							bind:value={editLyricsChords}
							id="editLyricsChords"
							rows="8"
							class="font-abel w-full resize-y rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 font-mono text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
							placeholder="Enter lyrics with chords"
						></textarea>
					</div>

					<!-- Song Details - 2 columns -->
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Key Selection -->
						<div>
							<label for="editNoteSelect" class="mb-1 block text-sm font-medium text-gray-300">
								Key
							</label>
							<div class="flex gap-2">
								<select
									id="editNoteSelect"
									bind:value={editSelectedNote}
									class="w-1/2 rounded-lg border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								>
									{#each notes as note}
										<option value={note}>{note}</option>
									{/each}
								</select>

								<select
									id="editQualitySelect"
									bind:value={editSelectedQuality}
									class="w-1/2 rounded-lg border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								>
									{#each qualities as quality}
										<option value={quality}>{quality}</option>
									{/each}
								</select>
							</div>
							<p class="mt-1 text-xs text-gray-400">
								Selected key: {editKey}
							</p>
						</div>

						<!-- Artist -->
						<div>
							<label for="editArtist" class="mb-1 block text-sm font-medium text-gray-300">
								Artist
							</label>
							<input
								bind:value={editArtist}
								id="editArtist"
								type="text"
								class="w-full rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								placeholder="Enter artist name"
							/>
						</div>

						<!-- Language -->
						<div>
							<label for="editLanguage" class="mb-1 block text-sm font-medium text-gray-300">
								Language
							</label>
							<input
								bind:value={editLanguage}
								id="editLanguage"
								type="text"
								class="w-full rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								placeholder="Enter language"
							/>
						</div>

						<!-- Keywords -->
						<div>
							<label for="editKeywords" class="mb-1 block text-sm font-medium text-gray-300">
								Keywords
							</label>
							<input
								bind:value={editKeywords}
								id="editKeywords"
								type="text"
								class="w-full rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								placeholder="Enter keywords for search"
							/>
						</div>

						<!-- YouTube Link -->
						<div class="md:col-span-2">
							<label for="editYoutubeLink" class="mb-1 block text-sm font-medium text-gray-300">
								YouTube Link
							</label>
							<input
								bind:value={editYoutubeLink}
								id="editYoutubeLink"
								type="url"
								class="w-full rounded-lg border-gray-600 bg-gray-700 px-4 py-2.5 text-white transition duration-400 focus:border-[#7623ad] focus:ring-[#7623ad] focus:outline-none"
								placeholder="https://www.youtube.com/watch?v=..."
							/>
						</div>
					</div>

					<!-- Buttons -->
					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={closeEditModal}
							class="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white shadow-md transition duration-400 hover:bg-gray-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isUpdating}
							class="flex items-center justify-center rounded-lg bg-[#7623ad] px-6 py-2 font-medium text-white shadow-md transition duration-300 hover:bg-[#5a1a8a] disabled:cursor-not-allowed disabled:bg-gray-500"
						>
							{#if isUpdating}
								<svg
									class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Updating...
							{:else}
								Update Song
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.font-abel {
		font-family: 'Abel', sans-serif;
	}
	/* Custom scrollbar for Webkit browsers */
	.custom-scrollbar::-webkit-scrollbar {
		width: 8px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: #374151;
		border-radius: 10px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #4b5563;
		border-radius: 10px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #6b7280;
	}
</style>
