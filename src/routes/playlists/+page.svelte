<script>
  import { onMount, onDestroy } from "svelte";
  import { pb } from "$lib/pocketbase.js";
  import { goto } from "$app/navigation";
  

  let playlists = [];
  let newPlaylistName = "";
  let newVisibility = "Private"; // Can be "Private" or "Public"
  let loading = false;
  let userId = ""; // Initialize as an empty string
  let isFetching = false; // Flag to track if a fetch request is in progress
  let songDetails = {}; // Store song details by ID
  let showShareModal = false; // Control visibility of share modal
  let selectedPlaylist = null; // Store the playlist being shared
  let shareUrl = ""; // Store the share URL
  let copySuccess = false; // Flag to show copy success message
  let isLoggedIn = false; // Flag to track if user is logged in
  let showDeleteModal = false; // Control visibility of delete confirmation modal
  let playlistToDelete = null; // Store the playlist to be deleted

  // Fetch playlists on component mount
  onMount(async () => {
    await fetchCurrentUser(); // Fetch the current user
    if (isLoggedIn) {
      await fetchPlaylists();
      // Subscribe to realtime updates
      pb.collection("playlists").subscribe("*", handlePlaylistUpdate);
    }
  });

  onDestroy(() => {
    if (isLoggedIn) {
      pb.collection("playlists").unsubscribe("*");
    }
  });

  async function fetchCurrentUser() {
    try {
      const user = pb.authStore.model; // Get the current user from the auth store
      if (user) {
        userId = user.id; // Set userId to the logged-in user's ID
        isLoggedIn = true;
      } else {
        console.error("No user is logged in.");
        isLoggedIn = false;
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      isLoggedIn = false;
    }
  }

  async function fetchPlaylists() {
    if (isFetching) return; // Prevent new requests if one is already in progress
    isFetching = true; // Set the flag to indicate a request is in progress
    loading = true;
    try {
      // Only fetch playlists that belong to the current user
      playlists = await pb.collection("playlists").getFullList({
        filter: `User = "${userId}"`,
        expand: "Songs",
      });
      console.log("Fetched playlists:", playlists);

      // Fetch song details for all songs in all playlists
      await fetchSongDetails();
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      isFetching = false; // Reset the flag when the request is complete
      loading = false; // Update loading state
    }
  }

  // Fetch song details for all songs in all playlists
  async function fetchSongDetails() {
    try {
      // Collect all unique song IDs from all playlists
      const songIds = new Set();
      playlists.forEach((playlist) => {
        if (playlist.Songs && Array.isArray(playlist.Songs)) {
          playlist.Songs.forEach((songId) => songIds.add(songId));
        }
      });

      // Fetch details for each song
      const songPromises = Array.from(songIds).map((songId) =>
        pb
          .collection("songs")
          .getOne(songId)
          .then((song) => {
            songDetails[songId] = song;
            return song;
          })
          .catch((error) => {
            console.error(`Error fetching song ${songId}:`, error);
            return null;
          })
      );

      await Promise.all(songPromises);
      console.log("Fetched song details:", songDetails);
    } catch (error) {
      console.error("Error fetching song details:", error);
    }
  }

  function handlePlaylistUpdate(event) {
    console.log("Realtime event:", event.action, event.record);
    fetchPlaylists();
  }

  // Create a new playlist using PocketBase's API
  async function createPlaylist(event) {
    event.preventDefault();
    if (!newPlaylistName.trim()) {
      console.error("Playlist name is empty.");
      return;
    }

    // Construct data as per the PocketBase API example:
    const data = {
      playlist_name: newPlaylistName,
      field: [newVisibility],
      User: userId, // Use the logged-in user's ID
      Songs: [], // Start with an empty array
    };

    try {
      const record = await pb.collection("playlists").create(data);
      console.log("Playlist created:", record);
      newPlaylistName = "";
      await fetchPlaylists();
    } catch (error) {
      console.error("Error creating playlist:", error);
      if (error.data) console.error("Detailed error:", error.data);
    }
  }

  // Toggle the privacy setting on a playlist
  async function togglePrivacy(playlist) {
    playlist.field = playlist.field.includes("Private")
      ? ["Public"]
      : ["Private"];
    try {
      const updated = await pb
        .collection("playlists")
        .update(playlist.id, playlist);
      console.log("Playlist updated:", updated);
    } catch (error) {
      console.error("Error updating playlist:", error);
    }
  }

  // Generate a shareable URL for the playlist
  function generatePlaylistURL(playlist) {
    // Use the current window location to get the base URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/playlists/${playlist.id}`;
  }

  // Open the share modal for a playlist
  function openShareModal(playlist) {
    selectedPlaylist = playlist;
    shareUrl = generatePlaylistURL(playlist);
    showShareModal = true;
    copySuccess = false;
  }

  // Close the share modal
  function closeShareModal() {
    showShareModal = false;
    selectedPlaylist = null;
    copySuccess = false;
  }

  // Copy the share URL to clipboard
  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copySuccess = true;

      // Reset the success message after 3 seconds
      setTimeout(() => {
        copySuccess = false;
      }, 3000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  }

  // Make the playlist public and share it
  async function makePublicAndShare() {
    if (!selectedPlaylist) return;

    try {
      // Update the playlist to be public
      selectedPlaylist.field = ["Public"];
      await pb
        .collection("playlists")
        .update(selectedPlaylist.id, selectedPlaylist);
      console.log("Playlist made public:", selectedPlaylist);

      // Refresh the playlists
      await fetchPlaylists();

      // Show success message
      copySuccess = true;

      // Reset the success message after 3 seconds
      setTimeout(() => {
        copySuccess = false;
      }, 3000);
    } catch (error) {
      console.error("Error making playlist public:", error);
    }
  }

  // Remove a song from a playlist by filtering it out
  async function removeSong(playlist, songId) {
    playlist.Songs = playlist.Songs.filter((id) => id !== songId);
    try {
      const updated = await pb
        .collection("playlists")
        .update(playlist.id, playlist);
      console.log("Playlist updated after removing song:", updated);
    } catch (error) {
      console.error("Error updating playlist:", error);
    }
  }

  // Function to navigate to the playlist details page
  async function navigateToPlaylist(playlistId) {
    await goto(`/playlists/${playlistId}`); // Navigate to the playlist details page
  }

  async function fetchTranspositions(playlistId) {
    try {
      const transpositions = await pb
        .collection("song_transpositions")
        .getFullList({
          filter: `playlist = "${playlistId}"`,
        });
      console.log("Fetched transpositions:", transpositions);
    } catch (error) {
      console.error("Error fetching transpositions:", error);
    }
  }

  async function updateTransposition(
    transpositionId,
    newKeyOffset,
    newTransposedLyrics
  ) {
    try {
      await pb.collection("song_transpositions").update(transpositionId, {
        key_offset: newKeyOffset,
        transposed_lyrics: newTransposedLyrics,
      });
      console.log("Transposition updated successfully");
    } catch (error) {
      console.error("Error updating transposition:", error);
    }
  }

  // Get song title by ID
  function getSongTitle(songId) {
    return songDetails[songId]?.title || "Unknown Song";
  }

  // Open the delete confirmation modal
  function openDeleteModal(playlist) {
    playlistToDelete = playlist;
    showDeleteModal = true;
  }

  // Close the delete confirmation modal
  function closeDeleteModal() {
    showDeleteModal = false;
    playlistToDelete = null;
  }

  // Delete the playlist
  async function deletePlaylist() {
    if (!playlistToDelete) return;

    try {
      // Delete the playlist
      await pb.collection("playlists").delete(playlistToDelete.id);
      console.log("Playlist deleted:", playlistToDelete.id);

      // Refresh the playlists
      await fetchPlaylists();

      // Close the modal
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  }

  // Add font link to ensure Abel font is available
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Abel&display=swap";
  document.head.appendChild(fontLink);

  // Remove the font link
  document.head.removeChild(fontLink);
</script>

<div class="min-h-screen bg-gray-950 text-white p-4 pb-20">
  <div class="container mx-auto max-w-6xl">
    <div class="bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-2xl font-bold mb-4  text-[#ffffff]">My Playlists</h1>

      {#if !isLoggedIn}
        <div class="bg-gray-800 p-4 rounded-lg mb-4 ">
          <p class="text-gray-200">
            Please <a href="/login" class="text-[#7623ad] hover:underline"
              >sign in</a
            > to view and manage your playlists.
          </p>
        </div>
      {:else}
        <!-- New Playlist Creation Form -->
        <form
          on:submit={createPlaylist}
          class="flex flex-col sm:flex-row gap-2 mb-6"
        >
          <input
            type="text"
            bind:value={newPlaylistName}
            placeholder="New Playlist Name"
            class="flex-grow bg-gray-800  border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 custom-glass-gradient"
          />
          <select
            bind:value={newVisibility}
            class="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-500"
          >
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
          <button
            type="submit"
            class="bg-indigo-700   hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg transition duration-300"
          >
            Create Playlist
          </button>
        </form>

        {#if loading}
          <div class="flex justify-center items-center min-h-[100px]">
            <p class="text-gray-300">Loading playlists...</p>
          </div>
        {:else if playlists.length > 0}
          <ul class="space-y-4 ">
            {#each playlists as playlist}
              <li class="bg-black/50 shadow-black shadow rounded-lg overflow-hidden">
                <div
                  class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-950 border-b-3 border-gray-900"
                >
                  <span
                    class="text-lg font-medium cursor-pointer hover:text-[#7623ad] transition duration-300 mb-2 sm:mb-0"
                    on:click={() => navigateToPlaylist(playlist.id)}
                    >{playlist.playlist_name}</span
                  >
                  <div class="flex flex-wrap gap-2">
                    <button
                      on:click={() => togglePrivacy(playlist)}
                      class="px-3 py-1 rounded-lg text-white {playlist.field.includes(
                        'Private'
                      )
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-green-600 hover:bg-green-500'} transition duration-300"
                    >
                      {playlist.field.includes("Private")
                        ? "Private"
                        : "Public"}
                    </button>
                    <button
                      on:click={() => openShareModal(playlist)}
                      class="bg-[#7623ad] hover:bg-[#5a1a8a] text-white px-3 py-1 rounded-lg transition duration-300"
                    >
                      Share
                    </button>
                    <button
                      on:click={() => openDeleteModal(playlist)}
                      class="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded-lg transition duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <!-- Display Songs in the Playlist -->
                {#if playlist.Songs && playlist.Songs.length > 0}
                  <ul class="divide-y divide-gray-900 ">
                    {#each playlist.Songs as songId}
                      <li
                        class="flex justify-between items-center p-3 hover:bg-gray-900/50 transition duration-500"
                      >
                        <span class="text-gray-200">{getSongTitle(songId)}</span
                        >
                        <button
                          on:click={() => removeSong(playlist, songId)}
                          class="text-red-400 hover:text-red-300 transition duration-300"
                        >
                          Remove
                        </button>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <div class="p-4 text-center text-gray-400">
                    No songs in this playlist yet.
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <div class="bg-gray-700 p-6 rounded-lg text-center">
            <p class="text-gray-300 mb-4">You don't have any playlists yet.</p>
            <p class="text-gray-400">
              Create your first playlist using the form above.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Share Modal -->
{#if showShareModal && selectedPlaylist}
  <div
    class="fixed inset-0 bg-black/75 bg-opacity-80 flex justify-center items-center z-50"
    on:click={closeShareModal}
  >
    <div
      class="bg-gray-900 p-6 rounded-lg w-11/12 max-w-md"
      on:click|stopPropagation
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-[#ffffff]">Share Playlist</h2>
        <button
          class="text-gray-400 hover:text-white text-2xl"
          on:click={closeShareModal}>&times;</button
        >
      </div>

      <div class="mb-4">
        <p class="mb-4 text-gray-300">Share this playlist with others:</p>

        <div class="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readonly
            class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
          />
          <button
            on:click={copyShareUrl}
            class="bg-[#7623ad] hover:bg-[#5a1a8a] text-white px-4 py-2 rounded-lg transition duration-300"
          >
            Copy Link
          </button>
        </div>

        {#if copySuccess}
          <p class="text-green-400 mb-4">Link copied to clipboard!</p>
        {/if}

        {#if selectedPlaylist.field.includes("Private")}
          <div
            class="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4"
          >
            <p class="text-yellow-300 mb-2">
              This playlist is currently private. To share it, you need to make
              it public.
            </p>
            <button
              on:click={makePublicAndShare}
              class="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-300"
            >
              Make Public & Share
            </button>
          </div>
        {:else}
          <p class="text-green-400">
            This playlist is public and can be shared with anyone.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && playlistToDelete}
  <div
    class="fixed inset-0 bg-black/75 bg-opacity-80 flex justify-center items-center z-50"
    on:click={closeDeleteModal}
  >
    <div
      class="bg-gray-900 p-6 rounded-lg w-11/12 max-w-md"
      on:click|stopPropagation
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-[#ff2f2f]">Delete Playlist</h2>
        <button
          class="text-gray-400 hover:text-white text-2xl"
          on:click={closeDeleteModal}>&times;</button
        >
      </div>

      <div class="mb-4">
        <p class="mb-4 text-gray-300">
          Are you sure you want to delete the playlist "{playlistToDelete.playlist_name}"?
        </p>
        <p class="text-red-400 mb-6">
          This action cannot be undone. All songs in this playlist will be
          removed.
        </p>

        <div class="flex justify-end gap-2">
          <button
            on:click={deletePlaylist}
            class="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition duration-300"
          >
            Delete Playlist
          </button>
          <button
            on:click={closeDeleteModal}
            class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom font for lyrics */
  @import url("https://fonts.googleapis.com/css2?family=Abel&display=swap");

  .font-abel {
    font-family: "Abel", sans-serif;
  }
</style>
