<script>
	let { children } = $props();
	import '../app.css';

	import Navbar from './Navbar.svelte';
</script>


	<div class="min-h-screen bg-gray-950 pb-16">
		{@render children()}
	</div>


<Navbar />
