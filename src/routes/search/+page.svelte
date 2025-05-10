<script lang="ts">
	import { onMount } from 'svelte';
	import { pb, searchSongs, getCurrentUser } from '$lib/pocketbase';

	/** @type {string} */
	let searchQuery = '';
	/** @type {import('$lib/pocketbase').Song[]} */
	let results = [];
	/** @type {boolean} */
	let loading = false;
	/** @type {string | null} */
	let error = null;
	/** @type {import('pocketbase').Record | null} */
	let user = null;
	/** @type {string[]} */
	let selectedLanguages = [];

	onMount(async () => {
		user = getCurrentUser();
		if (user) {
			// Fetch user's selected languages from profile
			selectedLanguages = user.languages || [];
		}
	});

	async function search() {
		if (searchQuery.length < 1) {
			results = [];
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await searchSongs(searchQuery, selectedLanguages);
			results = response.items;
		} catch (err) {
			console.error('Error fetching songs:', err);
			error = 'Failed to fetch results. Please try again.';
		} finally {
			loading = false;
		}
	}

	$: searchQuery, search();
</script>

<div class="min-h-screen bg-gray-950 py-8 text-white">
	<div class="mx-auto max-w-4xl px-4">
		<div class="mb-8 rounded-xl border-1 border-blue-800 bg-gray-900/50 p-6 shadow-lg">
			<h1 class="mb-6 text-2xl font-bold text-[#ffffff]">Search Songs</h1>

			<div class="mb-7">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search songs..."
					class="font-abel custom-glass-gradient mb-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-transparent focus:outline-none"
				/>

				{#if selectedLanguages.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						<span class="text-sm text-gray-400">Filtering by:</span>
						{#each selectedLanguages as lang}
							<span class="rounded-full bg-[#7623ad]/20 px-3 py-1 text-sm text-[#9e54cf]">
								{lang}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			{#if loading}
				<div class="flex justify-center py-8">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-[#2e193b]"></div>
				</div>
			{:else if error}
				<div class="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-red-300">
					{error}
				</div>
			{:else if results.length === 0 && searchQuery.length > 0}
				<div class="py-8 text-center text-gray-400">No songs found matching your search.</div>
			{:else if searchQuery.length === 0}
				<div class="py-8 text-center text-gray-400">Enter a search term to find songs.</div>
			{:else}
				<ul class="space-y-3">
					{#each results as song}
						<li
							class="overflow-hidden rounded-lg bg-gray-800 transition duration-300 hover:bg-gray-700"
						>
							<a href={`/songs/${song.id}`} class="block p-4">
								<h3 class="text-lg font-medium text-[#ac9dff]">
									{song.title}
								</h3>
								<div class="mt-1 flex items-center justify-between">
									<p class="font-abel text-sm text-gray-300">
										{song.artist || 'Unknown artist'}
									</p>
									<span class="rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-300">
										{song.key || 'No key'}
									</span>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes gradient-move {
		0% {
			background-position: 100% 0;
		}
		50% {
			background-position: 0 100%;
		}
		100% {
			background-position: 100% 0;
		}
	}

	.custom-glass-gradient:focus {
		background: rgba(19, 6, 27, 0.11); /* Dark semi-transparent background */
		/* Fade-in effect for the border */
		border-color: transparent; /* Remove default border */
		box-shadow:
			0 0 0 0 rgba(118, 35, 173, 0),
			0 0 0 4px rgba(44, 35, 173, 0.247); /* Transparent initial border */
		transition: box-shadow 0.5s ease-in-out; /* Smooth transition for the fade-in */
	}

	.custom-glass-gradient:focus-visible {
		box-shadow:
			0 0 0 3px rgba(88, 35, 173, 0.308),
			0 0 0 5px rgba(60, 35, 173, 0.3); /* Apply the glowing border with a slight delay */
	}

	/* Custom font for lyrics */
	@import url('https://fonts.googleapis.com/css2?family=Abel&display=swap');

	.font-abel {
		font-family: 'Abel', sans-serif;
	}
</style>
