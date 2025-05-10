import PocketBase from 'pocketbase';

export async function load({ params, fetch }) {
	const pb = new PocketBase('https://p2idzl17fmm0xad.pocketbasecloud.com');

	try {
		const song = await pb.collection('songs').getOne(params.id);
		if (!song) {
			return {
				status: 404,
				error: new Error('Song not found')
			};
		}
		return { song };
	} catch (error) {
		console.error('Error loading song:', error);
		return {
			status: error.status || 500,
			error: new Error(error.message || 'Failed to load song')
		};
	}
}
