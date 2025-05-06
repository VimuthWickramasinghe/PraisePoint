import PocketBase from "pocketbase";

export async function load({ params, fetch }) {
  const pb = new PocketBase("http://127.0.0.1:8090");

  try {
    const song = await pb.collection("songs").getOne(params.id);
    return { song }; // Return the song properly
  } catch (error) {
    console.error("Song not found:", error);
    return { status: 404, error: new Error("Song not found") };
  }
}
