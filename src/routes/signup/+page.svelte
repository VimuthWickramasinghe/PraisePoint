<script>
  import { pb } from "$lib/pocketbase";
  import { goto } from "$app/navigation";

  let firstName = "";
  let lastName = "";
  let email = "";
  let password = "";
  let confirm = "";
  let passError = false;
  let lengthError = false;
  let signUpError = null;

  async function handleSignUp() {
    if (password !== confirm) {
      passError = true;
      return;
    }
    passError = false;

    if (password.length < 8) {
      lengthError = true;
      return;
    }
    lengthError = false;

    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
        passwordConfirm: password,
        emailVisibility: true,
        verified: false,
      };

      const userRecord = await pb.collection("users").create(userData);
      await pb.collection("users").authWithPassword(email, password);
      goto("/profile");
    } catch (error) {
      signUpError = error?.response?.message || error?.message || "Sign-up failed. Please try again.";
    }
  }

  function signInWithGoogle() {
    pb.collection("users")
      .authWithOAuth2({ provider: "google" })
      .then(() => goto("/profile"))
      .catch((error) => {
        signUpError = "Google sign-in failed. Please try again.";
      });
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
<div class="w-full max-w-md bg-gray-800/25 rounded-2xl shadow-lg p-8 text-gray-300">
  <h2 class="text-3xl font-semibold text-center text-white mb-6">Sign Up to Praise Point</h2>
  <form on:submit|preventDefault={handleSignUp}>
    <input type="text" placeholder="First Name" bind:value={firstName} class="w-full mb-4 p-3 rounded-lg bg-gray-600/25 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
    <input type="text" placeholder="Last Name" bind:value={lastName} class="w-full mb-4 p-3 rounded-lg bg-gray-600/25 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
    <input type="email" placeholder="Email" bind:value={email} class="w-full mb-4 p-3 rounded-lg bg-gray-600/25 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
    <input type="password" placeholder="Password" bind:value={password} class="w-full mb-4 p-3 rounded-lg bg-gray-600/25 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
    <input type="password" placeholder="Confirm Password" bind:value={confirm} class="w-full mb-4 p-3 rounded-lg bg-gray-600/25 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
    {#if passError}<p class="text-red-500 mb-2">Passwords do not match!</p>{/if}
    {#if lengthError}<p class="text-red-500 mb-2">Password must be at least 8 characters long!</p>{/if}
    {#if signUpError}<p class="text-red-500 mb-2">{signUpError}</p>{/if}
    <button type="submit" class="w-full bg-blue-500 py-3 rounded-lg hover:bg-blue-600 transition-all">Sign Up</button>
  </form>
  <div class="flex flex-col items-center mt-4">
    <button class="w-full bg-red-500 py-3 rounded-lg hover:bg-red-600 transition-all text-white" on:click={signInWithGoogle}>Continue with Google</button>
    <a href="/login" class="text-blue-400 hover:text-blue-500 mt-4">Already have an account? Log in</a>
  </div>
</div>
</div>
