<script>
	import { onMount } from 'svelte';

	// Replace with your actual video IDs and titles.
	let videos = [
		{ id: 'ZpDYakCTBaA?si=6uP7wCnJUFNSprHI', title: "Eagle's Wings" },
		{ id: '9owDwKimSp4?si=9FsTAzBJzNS6NV2A', title: 'He is Lord' },
		{ id: 'Q8LZ7aICzwQ?si=WNu1ZCP2H7x_THXt', title: 'ඔබ උසස්ය සමිදේ' },
		{ id: 'S7LtI3b5wjI?si=_974ePO9lZlnDQfu', title: 'ඔබ ඕනේ' },
		{ id: 'UD_hMgxKIaw?si=gf0Qi4-ycv_UXsVs', title: 'Video 5' },
		{ id: 'b6aqCcI-ETU?si=ux4uo2msO79eZlh8', title: 'Video 6' },
		{ id: 'ODaSjVPEWAY?si=76r58rloMVGsHhL1', title: 'ගයව් හාලේලූයා' }

	];

	let carouselContainer;

	function scrollNext() {
		carouselContainer.scrollBy({
			left: carouselContainer.clientWidth,
			behavior: 'smooth'
		});
	}

	function scrollPrev() {
		carouselContainer.scrollBy({
			left: -carouselContainer.clientWidth,
			behavior: 'smooth'
		});
	}
</script>

<section
	class="dark:bg-linear-to-r/hsl h-70 relative w-96 w-full from-indigo-700 to-teal-400 object-fill"
>
	<video
		autoplay
		loop
		muted
		playsinline
		disablepictureinpicture
		class="absolute left-0 top-0 z-0 h-full w-full bg-cover object-cover opacity-60 mix-blend-luminosity invert"
	>
		<source src="/YouTube.mp4" type="video/mp4" />
	</video>

	<!-- Centered text -->
	<div
		class="absolute left-1/2 top-1/2 z-10 w-full -translate-x-1/2 -translate-y-1/2 transform px-4 text-center sm:px-8"
	>
		<h1
			class="font-abel mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white"
		>
			Welcome to PraisePoint
		</h1>
		<p
			class="font-abel px-4 text-lg font-normal text-white sm:px-16 sm:text-xl md:text-2xl lg:px-48"
		>
			Access chords, lyrics, and resources for worship music. Search for songs and start playing.
		</p>
	</div>
</section>

<section class="bg-linear-to-t h-auto from-black to-gray-900 py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-23 text-center">
			<div
				class="mx-auto flex max-w-lg flex-col justify-center gap-5 md:max-w-2xl md:flex-row lg:max-w-full"
			>
				<a
					href="/search"
					class="flex cursor-pointer items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-500 hover:bg-indigo-700 focus:outline-none"
				>
					Search Songs
				</a>
				<a
					href="/signup"
					class="flex cursor-pointer items-center justify-center rounded-full bg-indigo-50 px-6 py-3 text-sm font-semibold text-indigo-600 transition-all duration-500 hover:bg-indigo-100 focus:outline-none"
				>
					SignIn
				</a>
			</div>
		</div>

		<div
			class="mx-auto grid max-w-lg grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-full lg:grid-cols-4"
		>
			<!-- First Card -->
			<div class="relative h-auto w-full md:col-span-2">
				<div class="flex flex-row flex-wrap justify-between rounded-2xl bg-gray-800">
					<div class="w-full p-5 md:w-1/2 xl:p-8">
						<div class="block">
							<svg
								width="30"
								height="30"
								viewBox="0 0 30 30"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M15 12.5V18.75M18.75 2.5L11.25 2.5M15 28.75C8.7868 28.75 3.75 23.7132 3.75 17.5C3.75 11.2868 8.7868 6.25 15 6.25C21.2132 6.25 26.25 11.2868 26.25 17.5C26.25 23.7132 21.2132 28.75 15 28.75Z"
									stroke="white"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path>
							</svg>
						</div>
						<h3 class="w-full py-5 text-lg font-bold text-white xl:w-64 xl:text-xl">
							Live Sessions
						</h3>
						<p class="mb-8 w-full text-xs font-normal text-gray-300 xl:w-64">
							Experience a cleaner setup with synchronized playlists across all devices, where
							everyone sees and follows in real-time, eliminating the hassle of sharing chord
							sheets.
						</p>
						<button
							class="flex items-center justify-between gap-2 rounded-full border border-solid border-gray-300 px-5 py-2 text-xs font-semibold text-white transition-all duration-500 hover:bg-white/5"
						>
							View More
							<svg
								width="6"
								height="10"
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
						</button>
					</div>
					<div class="relative hidden h-auto md:block md:w-1/2">
						<img
							src="https://pagedone.io/asset/uploads/1695028873.png"
							alt="Header tailwind Section"
							class="ml-auto h-full object-cover"
						/>
					</div>
				</div>
			</div>

			<!-- Second Card -->
			<div class="relative h-auto w-full">
				<div class="h-full rounded-2xl bg-indigo-500 p-5 xl:p-8">
					<div class="block">
						<svg
							width="30"
							height="30"
							viewBox="0 0 30 30"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M24.6429 11.4286C24.6429 14.3872 20.2457 16.7857 14.8214 16.7857C9.3972 16.7857 5 14.3872 5 11.4286M24.6429 16.7857C24.6429 19.7444 20.2457 22.1429 14.8214 22.1429C9.3972 22.1429 5 19.7444 5 16.7857M24.6429 22.1429C24.6429 25.1015 20.2457 27.5 14.8214 27.5C9.3972 27.5 5 25.1015 5 22.1429M24.6429 6.96429C24.6429 9.42984 20.2457 11.4286 14.8214 11.4286C9.3972 11.4286 5 9.42984 5 6.96429C5 4.49873 9.3972 2.5 14.8214 2.5C20.2457 2.5 24.6429 4.49873 24.6429 6.96429Z"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
							></path>
						</svg>
					</div>
					<h3 class="py-5 text-lg font-bold text-white xl:text-xl">Chord Transposition</h3>
					<p class="mb-8 text-xs font-normal text-white">
						Play in Any Key. PraisePoint's Chord Transposition makes it easy to adjust any song to
						your perfect key in seconds!
					</p>
					<button
						class="flex items-center justify-between gap-2 rounded-full border border-solid border-gray-300 px-5 py-2 text-xs font-semibold text-white transition-all duration-500 hover:bg-white/5"
					>
						View More
						<svg
							width="6"
							height="10"
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
					</button>
				</div>
			</div>

			<!-- Third Card -->
			<div class="relative h-auto w-full">
				<div class="h-full rounded-2xl bg-violet-500 p-5 xl:p-8">
					<div class="block">
						<svg
							width="30"
							height="30"
							viewBox="0 0 30 30"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M26.7301 15.661C26.7301 22.1995 21.306 27.5 14.6151 27.5C7.9241 27.5 2.5 22.1995 2.5 15.661C2.5 9.1225 7.9241 3.822 14.6151 3.822M18.1313 10.1507L18.1313 4.85383C18.1313 3.22503 19.6455 2.00299 21.1519 2.70013C23.7608 3.90751 26.6177 6.25557 27.456 10.2563C27.7542 11.6798 26.4931 12.8563 25.0064 12.8368L20.7873 12.7814C19.3147 12.762 18.1313 11.5899 18.1313 10.1507Z"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
							></path>
						</svg>
					</div>
					<h3 class="py-5 text-lg font-bold text-white xl:text-xl">Generate PDF's</h3>
					<p class="mb-8 text-xs font-normal text-white">
						Say goodbye to messy notes! With just a few clicks, create clean, organized PDFs for
						your worship sessions.
					</p>
					<button
						class="flex items-center justify-between gap-2 rounded-full border border-solid border-gray-300 px-5 py-2 text-xs font-semibold text-white transition-all duration-500 hover:bg-white/5"
					>
						View More
						<svg
							width="6"
							height="10"
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
					</button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Second Section (Download Section) -->
<section class="flex items-center justify-center bg-gray-100 p-20 dark:bg-black">
	<div
		class="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 text-center shadow-md md:max-w-xl lg:max-w-2xl dark:border-gray-700 dark:bg-black"
	>
		<h5 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">Coming Soon!</h5>
		<p class="mb-5 text-base text-gray-500 dark:text-gray-400">
			Get PraisePoint on your favourite device. Download the app today.
		</p>
		<div
			class="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
		>
			<a
				href="javascript:void(0)"
				class="inline-flex w-full items-center justify-center rounded-lg bg-gray-800 px-4 py-2.5 text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-700"
			>
				<svg
					class="me-3 h-7 w-7"
					aria-hidden="true"
					focusable="false"
					data-prefix="fab"
					data-icon="apple"
					role="img"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 384 512"
				>
					<path
						fill="currentColor"
						d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
					></path>
				</svg>
				<div class="text-left">
					<div class="mb-1 text-xs">Download on the</div>
					<div class="-mt-1 font-sans text-sm font-semibold">Mac App Store</div>
				</div>
			</a>
			<a
				href="#"
				class="inline-flex w-full items-center justify-center rounded-lg bg-gray-800 px-4 py-2.5 text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 sm:w-auto dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-gray-700"
			>
				<svg
					class="me-3 h-7 w-7"
					aria-hidden="true"
					focusable="false"
					data-prefix="fab"
					data-icon="google-play"
					role="img"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 512 512"
				>
					<path
						fill="currentColor"
						d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
					></path>
				</svg>
				<div class="text-left">
					<div class="mb-1 text-xs">Get it on</div>
					<div class="-mt-1 font-sans text-sm font-semibold">Google Play</div>
				</div>
			</a>
		</div>
	</div>
</section>

<!-- Carousel Container -->
<section class="relative bg-black py-8  pb-26 ">
	<button
		on:click={scrollPrev}
		class="scale-126 absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-950 p-3 text-white hover:bg-gray-900"
	>
		<svg
			transform="rotate(180)"
			width="6"
			height="10"
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
	</button>

	<div
		bind:this={carouselContainer}
		class="scrollbar-hide flex w-full gap-4 overflow-x-auto scroll-smooth px-12"
	>
		{#each videos as video}
			<div class="w-full flex-none sm:w-1/2 lg:w-1/4">
				<div class="aspect-video overflow-hidden rounded-lg">
					<iframe
						class="h-full w-full"
						src="https://www.youtube.com/embed/{video.id}?enablejsapi=1"
						title={video.title}
						frameborder="0"
						allow="encrypted-media"
						allowfullscreen
					></iframe>
				</div>
				<p class="mt-2 text-center text-sm text-gray-800">{video.title}</p>
			</div>
		{/each}
	</div>

	<button
		on:click={scrollNext}
		class="scale-126 absolute right-2 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-gray-950 p-3 text-white hover:bg-gray-900"
	>
		<svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M1 9L3.58579 6.41421C4.25245 5.74755 4.58579 5.41421 4.58579 5C4.58579 4.58579 4.25245 4.25245 3.58579 3.58579L1 1"
				stroke="white"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			></path>
		</svg>
	</button>
</section>

<style lang="postcss">
	/* Hide scrollbar for a cleaner look */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
