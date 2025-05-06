// src/lib/pocketbase.js
import PocketBase from "pocketbase";

// Create and export the PocketBase instance
export const pb = new PocketBase("http://127.0.0.1:8090");

// Helper function to fetch all songs, sorted by title in descending order
export async function fetchSongs() {
  try {
    return await pb.collection("songs").getFullList({ sort: "-title" });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

// Example update call should be performed in your component logic, for instance:
// await pb.collection("playlists").update(playlist.id, playlist);
