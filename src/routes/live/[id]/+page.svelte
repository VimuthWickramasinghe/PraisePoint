<script>
  import { onMount, onDestroy } from "svelte";
  import { pb } from "$lib/pocketbase.js";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  export let data;

  let playlist = null;
  let song = null;
  let currentSongData = {
    transposedLyrics: "",
    keyOffset: 0,
    currentKey: "",
    originalKey: "",
  };
  let loading = true;
  let playlistSongs = [];
  let showLyrics = false;
  let songTranspositions = {};
  let errorMessage = "";
  let isLiveSession = true;
  let viewerCount = 0;
  let isViewer = false;
  let unsubscribeSession = null;
  let unsubscribeTranspositions = null;
  let sessionId = null;
  let openSongId = null;
  let scale = 1;
  let selectedSong = null;

  // Function to load the live session data
  async function loadLiveSession() {
    try {
      const { id } = $page.params;
      sessionId = id;

      // Fetch the session data from the playlist_sessions collection
      let session;
      try {
        session = await pb.collection("playlist_sessions").getOne(id);
        console.log("Fetched session:", session);
      } catch (error) {
        console.error("Error fetching session:", error);
        if (error.status === 404) {
          errorMessage =
            "Live session not found. The session may have ended or the URL is incorrect.";
        } else if (error.status === 403) {
          errorMessage =
            "Access denied. You may not have permission to view this session.";
        } else {
          errorMessage = `Error loading session: ${error.message || "Unknown error"}`;
        }
        loading = false;
        return;
      }

      if (!session) {
        errorMessage =
          "Live session not found or has ended. Please check the URL.";
        loading = false;
        return;
      }

      // Fetch the playlist associated with the session
      try {
        playlist = await pb.collection("playlists").getOne(session.playlist, {
          expand: "Songs",
        });
        console.log("Fetched playlist:", playlist);
      } catch (error) {
        console.error("Error fetching playlist:", error);
        errorMessage =
          "Error loading playlist data. The playlist may have been deleted.";
        loading = false;
        return;
      }

      // Fetch all songs in the playlist
      if (playlist.Songs && playlist.Songs.length > 0) {
        try {
          const songPromises = playlist.Songs.map((songId) =>
            pb.collection("songs").getOne(songId)
          );
          playlistSongs = await Promise.all(songPromises);
          console.log("Fetched songs:", playlistSongs);
        } catch (error) {
          console.error("Error fetching songs:", error);
          // Continue with partial data if some songs fail to load
        }
      }

      // Fetch transposition data for all songs in the playlist
      if (playlistSongs.length > 0) {
        try {
          const transpositionPromises = playlistSongs.map(
            (song) =>
              pb
                .collection("song_transpositions")
                .getFirstListItem(
                  `song = "${song.id}" && playlist = "${playlist.id}"`
                )
                .catch(() => null) // If no transposition exists, return null
          );

          const transpositions = await Promise.all(transpositionPromises);

          // Create a map of song ID to transposition data
          transpositions.forEach((transposition) => {
            if (transposition) {
              songTranspositions[transposition.song] = transposition;
            }
          });

          console.log("Fetched transpositions:", songTranspositions);
        } catch (error) {
          console.error("Error fetching transpositions:", error);
          // Continue with partial data if transpositions fail to load
        }
      }

      // Set the current song based on the session
      if (session.open_song) {
        openSongId = session.open_song;
        const openSong = playlistSongs.find((s) => s.id === openSongId);
        if (openSong) {
          song = openSong;
          updateCurrentSongData(song);
        }
      }

      // Join the live session as a viewer
      try {
        await joinLiveSession();
      } catch (error) {
        console.error("Error joining live session:", error);
        // Continue even if joining fails
      }

      // Set up subscriptions for real-time updates
      setupSubscriptions();
    } catch (error) {
      console.error("Error loading live session:", error);
      errorMessage =
        error.message || "An error occurred while loading the live session";
    } finally {
      loading = false;
    }
  }

  // Function to set up real-time subscriptions
  function setupSubscriptions() {
    if (!playlist || !sessionId) return;

    // Subscribe to session updates
    try {
      console.log("Setting up subscription for session:", sessionId);
      unsubscribeSession = pb
        .collection("playlist_sessions")
        .subscribe(sessionId, function (e) {
          console.log("Session update received:", e.action, e.record);

          if (e.action === "update") {
            // Update the open song ID
            openSongId = e.record.open_song;
            viewerCount = e.record.viewerCount || 0;

            console.log(
              "Session updated - open_song:",
              openSongId,
              "viewerCount:",
              viewerCount
            );

            // If the open song is different from the current song, update it
            if (openSongId && (!song || song.id !== openSongId)) {
              console.log("Switching to song:", openSongId);
              const openSong = playlistSongs.find((s) => s.id === openSongId);
              if (openSong) {
                song = openSong;
                showLyrics = true; // Show lyrics when a new song is selected
                updateCurrentSongData(song);
              }
            } else if (!openSongId) {
              // If no song is open in the session, close the lyrics
              console.log("No song open in session, closing lyrics");
              showLyrics = false;
            }
          } else if (e.action === "delete") {
            // Session has ended
            console.log("Session has ended");
            errorMessage = "The live session has ended";
            isLiveSession = false;
          }
        });
    } catch (error) {
      console.error("Error setting up session subscription:", error);
    }

    // Subscribe to transposition updates
    try {
      console.log("Setting up subscription for transpositions");
      unsubscribeTranspositions = pb
        .collection("song_transpositions")
        .subscribe(
          "*",
          function (e) {
            console.log("Transposition update received:", e.action, e.record);

            // Only process updates for songs in this playlist
            if (e.record.playlist === playlist.id) {
              const songId = e.record.song;

              // Update the transposition in our local state
              if (e.action === "create" || e.action === "update") {
                songTranspositions[songId] = e.record;

                // If this is the currently selected song, update the display
                if (song && song.id === songId) {
                  updateCurrentSongData(song);
                }
              } else if (e.action === "delete") {
                // Remove the transposition from our local state
                delete songTranspositions[songId];

                // If this is the currently selected song, reset to original key
                if (song && song.id === songId) {
                  updateCurrentSongData(song);
                }
              }
            }
          },
          {
            filter: `playlist = "${playlist.id}"`,
          }
        );
    } catch (error) {
      console.error("Error setting up transposition subscription:", error);
    }
  }

  // Function to join a live session as a viewer
  async function joinLiveSession() {
    if (!playlist) return;

    try {
      // Update the session to increment the viewer count
      const session = await pb
        .collection("playlist_sessions")
        .getOne(sessionId);
      const currentViewerCount = session.viewerCount || 0;

      await pb.collection("playlist_sessions").update(sessionId, {
        viewerCount: currentViewerCount + 1,
        updated: new Date().toISOString(),
      });

      // Mark this user as a viewer
      isViewer = true;
      viewerCount = currentViewerCount + 1;

      console.log("Joined live session as viewer. Total viewers:", viewerCount);
    } catch (error) {
      console.error("Error joining live session:", error);
    }
  }

  // Function to leave a live session
  async function leaveLiveSession() {
    if (!playlist || !isViewer) return;

    try {
      // Update the session to decrement the viewer count
      const session = await pb
        .collection("playlist_sessions")
        .getOne(sessionId);
      const currentViewerCount = session.viewerCount || 1;

      await pb.collection("playlist_sessions").update(sessionId, {
        viewerCount: Math.max(0, currentViewerCount - 1),
        updated: new Date().toISOString(),
      });

      // Mark this user as no longer a viewer
      isViewer = false;
      viewerCount = Math.max(0, currentViewerCount - 1);

      console.log("Left live session. Remaining viewers:", viewerCount);
    } catch (error) {
      console.error("Error leaving live session:", error);
    }
  }

  // Function to zoom in
  function zoomIn() {
    scale += 0.1;
  }

  // Function to zoom out
  function zoomOut() {
    if (scale > 0.5) scale -= 0.1;
  }

  // Chord transposition functions
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  function transposeNote(note, offset) {
    const idx = notes.indexOf(note);
    if (idx === -1) return note;
    return notes[(idx + offset + notes.length) % notes.length];
  }

  function splitChord(chord) {
    const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match) return { root: chord, quality: "" };
    return { root: match[1], quality: match[2] };
  }

  function transposeChord(chord, offset) {
    if (chord.includes("/")) {
      const parts = chord.split("/");
      return (
        transposeChord(parts[0], offset) +
        "/" +
        transposeChord(parts[1], offset)
      );
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
      .join("");
  }

  function getCurrentKey(originalKey, offset) {
    const parts = originalKey.split(" ");
    const root = parts[0];
    const suffix = parts.slice(1).join(" ");
    const idx = notes.indexOf(root);
    if (idx === -1) return originalKey;
    return (
      notes[(idx + offset + notes.length) % notes.length] +
      (suffix ? " " + suffix : "")
    );
  }

  // Function to transpose the key
  async function transposeKey(offset) {
    if (!song) return;

    // Calculate the new key offset
    const newKeyOffset = currentSongData.keyOffset + offset;

    // Create or update the transposition record
    try {
      // Check if we already have a transposition for this song
      const existingTransposition = Object.values(songTranspositions).find(
        (t) => t.song === song.id && t.playlist === playlist.id
      );

      if (existingTransposition) {
        // Update the existing transposition
        await pb
          .collection("song_transpositions")
          .update(existingTransposition.id, {
            key_offset: newKeyOffset,
            updated: new Date().toISOString(),
          });
      } else {
        // Create a new transposition
        await pb.collection("song_transpositions").create({
          song: song.id,
          playlist: playlist.id,
          key_offset: newKeyOffset,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        });
      }

      // The UI will be updated via the subscription
    } catch (error) {
      console.error("Error transposing key:", error);
      alert("Failed to transpose key. Please try again.");
    }
  }

  // Update the song data when switching songs
  function updateCurrentSongData(newSong) {
    if (!newSong) return;

    // Get the original key from the song
    currentSongData.originalKey = newSong.key || "";

    // Get transposition data if available
    const transposition = songTranspositions[newSong.id];
    currentSongData.keyOffset = transposition
      ? transposition.key_offset || 0
      : 0;

    // Apply the transposition
    currentSongData.transposedLyrics = transposeText(
      newSong.lyrics_chords,
      currentSongData.keyOffset
    );

    // Update the current key
    currentSongData.currentKey = getCurrentKey(
      currentSongData.originalKey,
      currentSongData.keyOffset
    );

    console.log(
      `Updated song data: Song ID ${newSong.id}, Key Offset: ${currentSongData.keyOffset}`
    );
  }

  // Load the live session when the component is mounted
  onMount(() => {
    loadLiveSession();
  });

  // Clean up subscriptions when component is destroyed
  onDestroy(() => {
    if (unsubscribeSession && typeof unsubscribeSession === "function") {
      unsubscribeSession();
    }
    if (
      unsubscribeTranspositions &&
      typeof unsubscribeTranspositions === "function"
    ) {
      unsubscribeTranspositions();
    }

    // Leave the live session when the component is destroyed
    if (isViewer) {
      leaveLiveSession();
    }
  });
</script>

{#if loading}
  <div class="flex justify-center items-center min-h-[200px]">
    <p class="text-white text-lg">Loading live session...</p>
  </div>
{:else if errorMessage}
  <div
    class="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-gray-900 rounded-lg m-8 max-w-2xl mx-auto"
  >
    <h2 class="text-red-400 text-2xl font-bold mb-4">Session Error</h2>
    <p class="text-white text-lg mb-8">{errorMessage}</p>
    <a
      href="/playlists"
      class="bg-[#7623ad] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#5a1a8a] transition duration-300"
    >
      Back to Playlists
    </a>
  </div>
{:else if playlist && song}
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="container mx-auto max-w-6xl">
      <div class="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold mb-4 text-[#7623ad]">
            {playlist.playlist_name}
          </h1>
          <div
            class="flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-1.5 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
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
            <span>{viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}</span
            >
          </div>
        </div>
        <p class="text-gray-300">Live Session</p>
      </div>

      <div class="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-4 text-[#7623ad]">{song.title}</h2>

        <div class="flex justify-between items-center mb-4">
          <div
            class="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg"
          >
            <span class="text-[#7623ad] font-bold"
              >{currentSongData.currentKey}</span
            >
          </div>

          <!-- Add transpose buttons -->
          <div class="flex items-center gap-2">
            <button
              on:click={() => transposeKey(-1)}
              class="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg"
              title="Lower Key"
            >
              ↓
            </button>
            <button
              on:click={() => transposeKey(1)}
              class="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg"
              title="Raise Key"
            >
              ↑
            </button>
          </div>
        </div>

        <div class="bg-black rounded-lg p-4">
          <pre
            class="font-['Abel'] text-white whitespace-pre-wrap text-lg">{currentSongData.transposedLyrics}</pre>
        </div>
      </div>
    </div>
  </div>
{:else}
  <p class="text-center text-red-500 mt-6">
    Live session not found or has ended. Please check the URL.
  </p>
{/if}

<style>
  /* Custom font for lyrics */
  @import url("https://fonts.googleapis.com/css2?family=Abel&display=swap");

  .font-abel {
    font-family: "Abel", sans-serif;
  }
</style>
