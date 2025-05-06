<script>
  import { onMount } from "svelte";
  import PocketBase from "pocketbase";
  import { pb } from "$lib/pocketbase"; // Assuming you're using your PocketBase instance from here.

  let searchQuery = "";
  let results = [];
  let loading = false;
  let error = null;
  let user = null;
  let selectedLanguages = [];
  const pbInstance = new PocketBase("http://127.0.0.1:8090");

  onMount(async () => {
    const authStore = pb.authStore;
    user = authStore.model; // Get user from the auth store
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
      // Escape single quotes in searchQuery for safety
      const safeQuery = searchQuery.replace(/'/g, "\\'");

      // Build language filter part
      let languageFilter = "";
      if (selectedLanguages.length > 0) {
        languageFilter = selectedLanguages
          .map((lang) => `language = '${lang}'`)
          .join(" || ");
      }

      // Build full filter string
      const searchFilter = `(title ~ '${safeQuery}' || keywords ~ '${safeQuery}' || lyrics_chords ~ '${safeQuery}')`;
      const fullFilter = languageFilter
        ? `(${searchFilter}) && (${languageFilter})`
        : searchFilter;

      const res = await pbInstance.collection("songs").getList(1, 10, {
        filter: fullFilter,
      });

      results = res.items;
    } catch (err) {
      console.error("Error fetching songs:", err);
      error = "Failed to fetch results. Please try again.";
    } finally {
      loading = false;
    }
  }

  $: searchQuery, search();
</script>

<div class="min-h-screen bg-gray-950 text-white py-8">
  <div class="max-w-4xl mx-auto px-4">
    <div
      class="bg-gray-900 rounded-xl border-1 border-blue-800 shadow-lg p-6 mb-8"
    >
      <h1 class="text-2xl font-bold text-[#ffffff] mb-6">Search Songs</h1>

      <div class="mb-7 ">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search songs..."
          class="w-full mb-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-transparent font-abel custom-glass-gradient"
        />

        {#if selectedLanguages.length > 0}
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="text-sm text-gray-400">Filtering by:</span>
            {#each selectedLanguages as lang}
              <span
                class="bg-[#7623ad]/20 text-[#9e54cf] px-3 py-1 text-sm rounded-full"
              >
                {lang}
              </span>
            {/each}
          </div>
        {/if}
      </div>

      {#if loading}
        <div class="flex justify-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e193b]"
          ></div>
        </div>
      {:else if error}
        <div
          class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4"
        >
          {error}
        </div>
      {:else if results.length === 0 && searchQuery.length > 0}
        <div class="text-center py-8 text-gray-400">
          No songs found matching your search.
        </div>
      {:else if searchQuery.length === 0}
        <div class="text-center py-8 text-gray-400">
          Enter a search term to find songs.
        </div>
      {:else}
        <ul class="space-y-3">
          {#each results as song}
            <li
              class="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition duration-300"
            >
              <a href={`/songs/${song.id}`} class="block p-4">
                <h3 class="text-lg font-medium text-[#ac9dff]">
                  {song.title}
                </h3>
                <div class="flex justify-between items-center mt-1">
                  <p class="text-sm text-gray-300 font-abel">
                    {song.artist || "Unknown artist"}
                  </p>
                  <span
                    class="bg-gray-900 text-gray-300 px-2 py-1 text-xs rounded-md"
                  >
                    {song.key || "No key"}
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
  @import url("https://fonts.googleapis.com/css2?family=Abel&display=swap");

  .font-abel {
    font-family: "Abel", sans-serif;
  }
</style>
