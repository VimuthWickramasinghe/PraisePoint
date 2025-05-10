// This tells SvelteKit to handle client-side navigation
export const csr = true;
// This enables server-side rendering
export const ssr = true;
// Disable prerendering for dynamic content
export const prerender = false;

/** @type {import('./$types').LayoutLoad} */
export function load() {
	return {};
}
