<script>
  import { page } from "$app/stores";
  $: currentPath = $page.url.pathname;
</script>

<div
  class="fixed opacity-85 z-50 w-full h-14 max-w-lg -translate-x-1/2 bg-white border border-gray-950 rounded-full bottom-2 left-1/2 dark:bg-gray-900 dark:border-gray-800"
>
  <div
    class="grid h-full max-w-lg grid-cols-5 mx-auto items-center text-center"
  >
    <!-- Home -->
    <a href="/" class={currentPath === "/" ? "active" : ""}>
      <button
        type="button"
        class="w-full h-full inline-flex flex-col items-center justify-center px-5 rounded-s-full group"
      >
        <svg
          class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"
          />
        </svg>
        <span class="text-xs text-gray-400">Home</span>
      </button>
    </a>

    <!-- Search -->
    <a href="/search" class={currentPath === "/search" ? "active" : ""}>
      <button
        type="button"
        class="w-full h-full inline-flex flex-col items-center justify-center px-5 group"
      >
        <svg
          class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
          fill="currentColor"
          viewBox="0 0 50 50"
        >
          <path
            d="M 21 3 C 11.6 3 4 10.6 4 20 C 4 29.4 11.6 37 21 37 C 24.35 37 27.47 36.02 30.10 34.35 L 42.38 46.62 L 46.62 42.38 L 34.52 30.28 C 36.69 27.42 38 23.87 38 20 C 38 10.6 30.4 3 21 3 z M 21 7 C 28.2 7 34 12.8 34 20 C 34 27.2 28.2 33 21 33 C 13.8 33 8 27.2 8 20 C 8 12.8 13.8 7 21 7 z"
          />
        </svg>
        <span class="text-xs text-gray-400">Search</span>
      </button>
    </a>

    <!-- Add Song (no active class) -->
    <a href="/addsong">
      <button
        type="button"
        class="w-12 h-12 -translate-y-2 inline-flex items-center justify-center font-medium bg-blue-600 rounded-full hover:bg-blue-700 group focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
      >
        <svg
          class="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 18 18"
        >
          <path d="M9 1v16M1 9h16" />
        </svg>
        <span class="sr-only">Add Song</span>
      </button>
    </a>

    <!-- Settings -->
    <a
      href="/playlists"
      class={currentPath.startsWith("/playlists") ? "active" : ""}
    >
      <button
        type="button"
        class="w-full h-full inline-flex flex-col items-center justify-center px-5 group"
      >
        <svg
          class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 1 0 14a7 7 0 0 1 0-14z"
          />
        </svg>
        <span class="text-xs text-gray-400">Playlists</span>
      </button>
    </a>

    <!-- Profile -->
    <a href="/profile" class={currentPath === "/profile" ? "active" : ""}>
      <button
        type="button"
        class="w-full h-full inline-flex flex-col items-center justify-center px-5 rounded-e-full group"
      >
        <svg
          class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"
          />
        </svg>
        <span class="text-xs text-gray-400">Profile</span>
      </button>
    </a>
  </div>
</div>

<style>
  a.active svg {
    color: #2563eb; /* Tailwind blue-600 */
  }

  a.active span {
    color: #2563eb;
  }

  :global(html) {
    background-color: black;
  }

  .font-abel {
    font-family: "Abel", sans-serif;
  }
</style>
