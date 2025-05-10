// src/routes/playlists/[id]/+page.ts
import { pb } from "$lib/pocketbase";
import PocketBase from "pocketbase";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const pb = new PocketBase("https://p2idzl17fmm0xad.pocketbasecloud.com/api/");

  try {
    // Get the current user
    const currentUser = pb.authStore.model;
    
    // Fetch the playlist
    const playlist = await pb.collection("playlists").getOne(params.id, {
      expand: "Songs",
    });
    
    // Check if the playlist is private and if the current user is not the owner
    if (playlist.field.includes("Private") && (!currentUser || currentUser.id !== playlist.User)) {
      // If the playlist is private and the user is not the owner, throw an error
      throw error(403, {
        message: "This playlist is private. Only the owner can view it."
      });
    }
    
    return { playlist };
  } catch (err) {
    console.error("Error loading playlist:", err);
    
    // If it's our custom error, rethrow it
    if (err.status === 403) {
      throw err;
    }
    
    // For other errors, return a generic "not found" error
    throw error(404, {
      message: "Playlist not found"
    });
  }
}
