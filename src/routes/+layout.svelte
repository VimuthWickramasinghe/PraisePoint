<script>
	import '../app.css';
	import Navbar from './Navbar.svelte';
</script>

<div class="min-h-screen bg-gray-950">
	<Navbar />
	<slot />
</div>
