import { error } from "@sveltejs/kit";
import { pb } from "$lib/pocketbase";

export async function load({ params }) {
  try {
    // Fetch the session data
    const session = await pb.collection("playlist_sessions").getOne(params.id);

    if (!session) {
      throw error(404, "Session not found or has ended");
    }

    // Fetch the playlist
    const playlist = await pb.collection("playlists").getOne(session.playlist, {
      expand: "Songs",
    });

    if (!playlist) {
      throw error(404, "Playlist not found");
    }

    // Return the session and playlist data
    return {
      session,
      playlist,
    };
  } catch (err) {
    console.error("Error loading live session:", err);
    throw error(404, "Session not found or has ended");
  }
}
