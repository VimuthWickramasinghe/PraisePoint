<script>
  import { onMount } from "svelte";
  import { pb } from "$lib/pocketbase";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let loginError = "";
  let showResetForm = false;
  let resetEmail = "";
  let resetSuccess = false;
  let resetError = "";
  let resetToken = "";
  let newPassword = "";
  let confirmPassword = "";
  let showResetPasswordForm = false;
  let resetPasswordError = "";
  let resetPasswordSuccess = false;

  async function handleLogin() {
    try {
      const authData = await pb.collection("users").authWithPassword(email, password);
      console.log("Auth Data:", authData);
      goto("/profile");
    } catch (error) {
      console.error("Login failed:", error);
      loginError = error?.response?.message || error?.message || "Login failed. Please try again.";
    }
  }

  async function requestPasswordReset() {
    try {
      await pb.collection("users").requestPasswordReset(resetEmail);
      resetSuccess = true;
      resetError = null;
    } catch (error) {
      console.error("Password reset request failed:", error);
      resetError = error?.response?.message || error?.message || "Password reset request failed.";
      resetSuccess = false;
    }
  }

  async function confirmPasswordReset() {
    if (newPassword !== confirmPassword) {
      resetPasswordError = "Passwords do not match";
      return;
    }

    try {
      await pb.collection("users").confirmPasswordReset(resetToken, newPassword, confirmPassword);
      resetPasswordSuccess = true;
      resetPasswordError = null;
      setTimeout(() => goto("/login"), 2000);
    } catch (error) {
      console.error("Password reset confirmation failed:", error);
      resetPasswordError = error?.response?.message || error?.message || "Password reset failed.";
      resetPasswordSuccess = false;
    }
  }

  function signInWithGoogle() {
    pb.collection("users").authWithOAuth2({
      provider: "google",
      redirectUrl: window.location.origin + "/profile"
    })
    .then((authData) => {
      console.log("Google auth data:", authData);
      goto("/profile");
    })
    .catch((error) => {
      console.error("Google sign-in failed:", error);
      loginError = "Google sign-in failed. Please try again.";
    });
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      resetToken = token;
      showResetPasswordForm = true;
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
  <div class="w-full max-w-md bg-gray-800/50 rounded-2xl shadow-lg p-8 text-gray-300">
    <h2 class="text-3xl font-semibold text-center text-white mb-6">{showResetPasswordForm ? "Reset Password" : showResetForm ? "Reset Password" : "Log In"}</h2>

    {#if showResetPasswordForm}
      <form on:submit|preventDefault={confirmPasswordReset}>
        <input type="password" placeholder="New Password" bind:value={newPassword} class="w-full mb-4 p-3 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
        <input type="password" placeholder="Confirm Password" bind:value={confirmPassword} class="w-full mb-4 p-3 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
        {#if resetPasswordError}<p class="text-red-500 mb-2">{resetPasswordError}</p>{/if}
        {#if resetPasswordSuccess}<p class="text-green-500 mb-2">Password reset successful! Redirecting to login...</p>{/if}
        <button type="submit" class="w-full bg-blue-500 py-3 rounded-lg hover:bg-blue-600 transition-all">Reset Password</button>
      </form>
    {:else if showResetForm}
      <form on:submit|preventDefault={requestPasswordReset}>
        <input type="email" placeholder="Enter your email" bind:value={resetEmail} class="w-full mb-4 p-3 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
        {#if resetError}<p class="text-red-500 mb-2">{resetError}</p>{/if}
        {#if resetSuccess}<p class="text-green-500 mb-2">Password reset email sent! Check your inbox.</p>{/if}
        <button type="submit" class="w-full bg-blue-500 py-3 rounded-lg hover:bg-blue-600 transition-all">Send Reset Link</button>
      </form>
    {:else}
      <form on:submit|preventDefault={handleLogin}>
        <input type="email" placeholder="Email" bind:value={email} class="w-full mb-4 p-3 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
        <input type="password" placeholder="Password" bind:value={password} class="w-full mb-4 p-3 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-950 transition-all" />
        {#if loginError}<p class="text-red-500 mb-2">{loginError}</p>{/if}
        <button type="submit" class="w-full bg-blue-500 py-3 rounded-lg hover:bg-blue-600 transition-all">Log In</button>
      </form>
      <div class="flex flex-col items-center mt-4">
        <button class="w-full bg-red-500 py-3 rounded-lg hover:bg-red-600 transition-all text-white" on:click={signInWithGoogle}>Continue with Google</button>
        <a href="javascript:void(0)" class="text-blue-400 hover:text-blue-500 mt-4" on:click|preventDefault={() => showResetForm = true}>Forgot Password?</a>
        <a href="/signup" class="text-blue-400 hover:text-blue-500 mt-2">Don't have an account? Sign up</a>
      </div>
    {/if}
  </div>
</div>
