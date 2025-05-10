<script>
	let { children } = $props();
	import '../app.css';

	import Navbar from './Navbar.svelte';
</script>


	<div class="min-h-screen bg-gray-950">
		{@render children()}
	</div>


<Navbar />
