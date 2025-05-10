<script>
  import { onMount, onDestroy } from "svelte";
  import { pb } from "$lib/pocketbase";
  import { goto } from "$app/navigation";

  let user = null;
  let playlists = [];
  let newPlaylistName = "";
  let selectedLanguages = [];
  let loading = false;
  let successMessage = "";
  let errorMessage = "";
  let profileImageUrl = "";
  let isUploading = false;
  let fileInput;
  let songSubmissionsCount = 0;

  const languagesList = [
  { name: "English" },
  { name: "Sinhala" },
  { name: "Tamil" },
  { name: "Afrikaans" },
  { name: "Albanian" },
  { name: "Amharic" },
  { name: "Arabic" },
  { name: "Aragonese" },
  { name: "Armenian" },
  { name: "Asturian" },
  { name: "Aymara" },
  { name: "Azerbaijani" },
  { name: "Basque" },
  { name: "Belarusian" },
  { name: "Bengali" },
  { name: "Bodo" },
  { name: "Bosnian" },
  { name: "Breton" },
  { name: "Bulgarian" },
  { name: "Catalan" },
  { name: "Central Kurdish" },
  { name: "Chechen" },
  { name: "Chinese" },
  { name: "Corsican" },
  { name: "Croatian" },
  { name: "Czech" },
  { name: "Danish" },
  { name: "Dhivehi" },
  { name: "Dutch" },
  { name: "Dzongkha" },
  { name: "Esperanto" },
  { name: "Estonian" },
  { name: "Ewe" },
  { name: "Faroese" },
  { name: "Filipino" },
  { name: "Finnish" },
  { name: "French" },
  { name: "Galician" },
  { name: "Georgian" },
  { name: "German" },
  { name: "Greek" },
  { name: "Guarani" },
  { name: "Gujarati" },
  { name: "Hausa" },
  { name: "Hawaiian" },
  { name: "Hebrew" },
  { name: "Hindi" },
  { name: "Hungarian" },
  { name: "Icelandic" },
  { name: "Indonesian" },
  { name: "Interlingua" },
  { name: "Inuktitut" },
  { name: "Irish" },
  { name: "Italian" },
  { name: "Japanese" },
  { name: "Kalaallisut" },
  { name: "Kannada" },
  { name: "Kashmiri" },
  { name: "Kazakh" },
  { name: "Khmer" },
  { name: "Kinyarwanda" },
  { name: "Korean" },
  { name: "Kurdish" },
  { name: "Kyrgyz" },
  { name: "Lao" },
  { name: "Latin" },
  { name: "Latvian" },
  { name: "Lingala" },
  { name: "Lithuanian" },
  { name: "Luganda" },
  { name: "Luxembourgish" },
  { name: "Macedonian" },
  { name: "Maithili" },
  { name: "Malay" },
  { name: "Malayalam" },
  { name: "Maltese" },
  { name: "Manipuri" },
  { name: "Marathi" },
  { name: "Mongolian" },
  { name: "Nepali" },
  { name: "Northern Sotho" },
  { name: "Norwegian" },
  { name: "Occitan" },
  { name: "Oriya" },
  { name: "Oromo" },
  { name: "Ossetian" },
  { name: "Pashto" },
  { name: "Persian" },
  { name: "Polish" },
  { name: "Portuguese" },
  { name: "Punjabi" },
  { name: "Quechua" },
  { name: "Romanian" },
  { name: "Romansh" },
  { name: "Russian" },
  { name: "Samoan" },
  { name: "Santali" },
  { name: "Sardinian" },
  { name: "Scottish Gaelic" },
  { name: "Serbian" },
  { name: "Serbo_Croatian" },
  { name: "Shona" },
  { name: "Sindhi" },
  { name: "Slovak" },
  { name: "Slovenian" },
  { name: "Somali" },
  { name: "Southern Sotho" },
  { name: "Spanish" },
  { name: "Sundanese" },
  { name: "Swahili" },
  { name: "Swedish" },
  { name: "Tajik" },
  { name: "Tatar" },
  { name: "Telugu" },
  { name: "Thai" },
  { name: "Tigrinya" },
  { name: "Tongan" },
  { name: "Tswana" },
  { name: "Turkish" },
  { name: "Turkmen" },
  { name: "Twi" },
  { name: "Udmurt" },
  { name: "Ukrainian" },
  { name: "Urdu" },
  { name: "Uyghur" },
  { name: "Uzbek" },
  { name: "Venda" },
  { name: "Vietnamese" },
  { name: "Walloon" },
  { name: "Welsh" },
  { name: "Western Frisian" },
  { name: "Wolof" },
  { name: "Xhosa" },
  { name: "Yiddish" },
  { name: "Yoruba" },
  { name: "Zhuang" },
  { name: "Zulu" }
];


onMount(async () => {
  const authStore = pb.authStore;
  user = authStore.model;
  if (user) {
    console.log("User ID:", user.id);  // Check if this is correct
    await refreshUserData();
    await fetchPlaylists();
    await loadProfileImage();
    await fetchSongSubmissionsCount();

    // Subscribe to real-time updates for the user's record
    pb.collection("users").subscribe(user.id, handleUserUpdate);
  }
});


  async function refreshUserData() {
    try {
      if (user) {
        const userData = await pb.collection("users").getOne(user.id);
        user = userData;
        selectedLanguages = userData.languages || [];
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }

  async function loadProfileImage() {
    try {
      if (user && user.avatar) {
        // Get the file URL from the avatar field
        profileImageUrl = pb.getFileUrl(user, user.avatar);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  }

  // Fetch the count of songs submitted by the user
  async function fetchSongSubmissionsCount() {
    try {
      if (user) {
        const songsList = await pb.collection("songs").getList(1, 1, {
          filter: `created_by = "${user.id}"`,
        });

        // Get the total items count from the list response
        songSubmissionsCount = songsList.totalItems;
      }
    } catch (error) {
      console.error("Error fetching song submissions count:", error);
      songSubmissionsCount = 0;
    }
  }

  function handleUserUpdate(event) {
    if (event.action === "update") {
      const updatedUser = event.record;
      if (updatedUser.id === user.id) {
        user = updatedUser;
        selectedLanguages = updatedUser.languages || [];
        loadProfileImage(); // Reload profile image when user data is updated
      }
    }
  }

  // Update user language preferences
  async function updateLanguagePreferences() {
    if (!user) {
      errorMessage = "You need to be logged in to update preferences.";
      return;
    }

    try {
      const filteredLanguages = selectedLanguages.filter((lang) => lang !== "");

      const response = await pb.collection("users").update(user.id, {
        languages: filteredLanguages,
      });

      user = response;
      selectedLanguages = response.languages || [];

      successMessage = "Language preferences updated successfully!";
      errorMessage = "";

      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      console.error("Error updating languages:", error);
      errorMessage = "Failed to update language preferences. Please try again.";
      successMessage = "";
    }
  }

  // Handle profile image upload
  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    isUploading = true;
    errorMessage = "";

    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("avatar", file);

      // Update the user record with the new avatar
      const updatedUser = await pb
        .collection("users")
        .update(user.id, formData);

      // Update the local user object
      user = updatedUser;

      // Update the profile image URL
      await loadProfileImage();

      successMessage = "Profile picture updated successfully!";

      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      errorMessage = "Failed to upload profile image. Please try again.";
    } finally {
      isUploading = false;
    }
  }

  // Trigger file input click
  function triggerFileInput() {
    fileInput.click();
  }

  // Unsubscribe from real-time updates when the component is destroyed
  onDestroy(() => {
    if (user) {
      pb.collection("users").unsubscribe(user.id);
    }
  });

  // Fetch playlists for the logged-in user
  async function fetchPlaylists() {
  if (user) {
    loading = true;
    try {
      playlists = await pb.collection("playlists").getFullList({
        filter: `User = "${user.id}"`,
      });
      console.log("Fetched playlists:", playlists);
      playlists.forEach((playlist) => console.log("Playlist Name:", playlist.name));
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
    loading = false;
  }
}



  // Create a new playlist
  async function createPlaylist() {
    if (newPlaylistName.trim() === "") return;
    try {
      await pb.collection("playlists").create({
        name: newPlaylistName,
        owner: user.id,
      });
      newPlaylistName = "";
      await fetchPlaylists();
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  }

  // Logout: clear auth token and redirect to login
  async function handleLogout() {
    try {
      await pb.authStore.clear(); // Clear authentication store
      window.location.href = "/"; // Redirect to homepage or login page
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  }
</script>

<div class="min-h-screen bg-gray-950 text-white flex flex-col">
  <!-- Header -->
  <header class="bg-gray-900/50 shadow-lg">
    <div class="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-[#ffffff]">User Profile</h1>
      {#if user}
        <button
          on:click={handleLogout}
          class="bg-red-900 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Logout
        </button>
      {/if}
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-grow max-w-4xl mx-auto p-6 w-full">
    {#if user}
      <!-- Profile Section -->
      <div class="bg-gray-900/50 rounded-xl shadow-lg p-6 mb-8">
        <div
          class="flex flex-col md:flex-row items-center md:items-start gap-6"
        >
          <!-- Profile Picture Section -->
          <div class="flex flex-col items-center">
            <div
              class="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-900 bg-gray-700 flex items-center justify-center"
            >
              {#if profileImageUrl}
                <img
                  src={profileImageUrl}
                  alt="Profile Picture"
                  class="w-full h-full object-cover"
                />
              {:else}
                <div
                  class="w-full h-full bg-[#7623ad] flex items-center justify-center"
                >
                  <span class="text-white text-5xl font-bold">
                    {user.firstName ? user.firstName.charAt(0) : "U"}
                  </span>
                </div>
              {/if}
            </div>
            <div class="mt-4 flex flex-col items-center">
              <button
                on:click={triggerFileInput}
                class="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                {profileImageUrl ? "Replace Picture" : "Add Picture"}
              </button>
              <input
                type="file"
                accept="image/*"
                bind:this={fileInput}
                on:change={handleImageUpload}
                class="hidden"
              />
              {#if isUploading}
                <div class="mt-2 text-sm text-gray-400">Uploading...</div>
              {/if}
            </div>
          </div>

          <!-- User Info Section -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-white mb-2">
              {user.firstName}
              {user.lastName}
            </h2>
            <p class="text-gray-300 mb-4">Welcome to your profile!</p>

            {#if successMessage}
              <div
                class="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4"
              >
                {successMessage}
              </div>
            {/if}

            {#if errorMessage}
              <div
                class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4"
              >
                {errorMessage}
              </div>
            {/if}

            <!-- User Stats or Additional Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div class="bg-gray-900/50 p-4 rounded-lg">
                <h3 
                  class="font-semibold text-gray-300 relative group"
                  title="Total number of playlists you have created"
                >
                  Your Playlists
                  <span 
                    class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-2 py-1 shadow-lg"
                  >
                    Total number of playlists you have created
                  </span>
                </h3>
                <p class="text-2xl font-bold text-indigo-400">
                  {playlists.length}
                </p>
              </div>
              <div class="bg-indigo-900/50 p-4 rounded-lg hover:bg-indigo-900/70 transition duration-600">
                <h3 class="font-semibold text-gray-300">Song Submissions</h3>
                <p class="text-2xl font-bold text-indigo-400">
                  {songSubmissionsCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="bg-gray-900/50 rounded-xl shadow-lg p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-white">Your Playlists</h2>
          <a
            href="/playlists"
            class="text-indigo-400 hover:text-indigo-500 font-medium transition duration-300"
          >
            View All
          </a>
        </div>

        

        {#if loading}
          <div class="flex justify-center py-4">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7623ad]"
            ></div>
          </div>
        {:else if playlists.length > 0}
          <ul class="divide-y divide-gray-700">
            {#each playlists as playlist}
              <li class="py-3 flex justify-between items-center">
                <span class="font-medium text-gray-200">{playlist.playlist_name}</span>
                <a
                  href="/playlists/{playlist.id}"
                  class="text-blue-400 hover:text-blue-500 text-sm font-medium transition duration-300"
                >
                  Open
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="flex justify-center py-4">
            <a
              href="/playlists"
              class="text-indigo-700 hover:text-indigo-600 font-medium transition duration-300"
            >
              Go to Playlists
            </a>
          </div>
        {/if}
      </div>
    {:else}
      <div class="bg-gray-900/50 rounded-xl shadow-lg p-5 mb-7 text-center">
        <p class="text-lg text-gray-300 mb-4">
          You are not logged in. Please  <a
        href="/signup"
        class="bg-indigo-600 w-full p-2 m-2 pb-3  text-white transition-all rounded-2xl font-medium"
        > sign up </a
          >  to create playlists.
        </p>
      </div>
    {/if}

    <div class="bg-gray-900/50 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-white">Song Submissions</h2>
        <a
          href="/MySongs"
          class="text-indigo-400 hover:text-indigo-500 font-medium transition duration-300"
        >
          View All
        </a>
      </div>
    </div>

  <!-- Language Selection -->
  <div
    class="bg-gray-900/50 rounded-xl shadow-lg p-6 mb-20 max-w-4xl mx-auto mb-8 w-full"
  >
    <h2 class="text-xl font-semibold text-white mb-4">
      Select Your Preferred Languages
    </h2>

    <div class="flex flex-wrap gap-2 mb-4">
      {#each selectedLanguages as lang, index (lang)}
        <span
          class="bg-[#7623ad]/20 text-[#cc7eff] px-3 py-1 rounded-full flex items-center gap-1"
        >
          {lang}
          <button
            on:click={() => {
              selectedLanguages.splice(index, 1);
              selectedLanguages = [...selectedLanguages];
            }}
            class="text-red-500 hover:text-red-400 transition duration-300"
          >
            &times;
          </button>
        </span>
      {/each}
    </div>

    <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
      <select
        on:change={(e) => {
          const value = e.target.value;
          if (value && !selectedLanguages.includes(value)) {
            selectedLanguages = [...selectedLanguages, value];
          }
          e.target.value = "";
        }}
        class="p-3 bg-gray-950 border border-indigo-950 rounded-lg text-white w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-800 transition duration-300"
      >
        <option value="" disabled selected>Select a language</option>
        {#each languagesList as { name }}
          {#if !selectedLanguages.includes(name)}
            <option value={name}>{name}</option>
          {/if}
        {/each}
      </select>

      <button
        class="bg-indigo-800 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300 w-full md:w-auto"
        on:click={updateLanguagePreferences}
      >
        Save Preferences
      </button>
    </div>

    {#if successMessage}
      <p class="mt-4 text-green-400 text-center">{successMessage}</p>
    {/if}
    {#if errorMessage}
      <p class="mt-4 text-red-400 text-center">{errorMessage}</p>
    {/if}
  </div>
</div>

<style>
  /* Custom styles for elements that can't be easily styled with Tailwind */
  .profile-picture-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #7623ad;
    color: white;
    font-size: 48px;
    font-weight: bold;
  }
</style>
