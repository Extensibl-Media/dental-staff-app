// ProfileImageUpload.svelte
<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Upload } from "lucide-svelte";

  export let currentImage: string | null = null;
  export let onImageChange: (file: File) => void;
  export let size: "sm" | "md" | "lg" = "md";
  export let label: string | null = null;
  export let fallbackText: string = "?";
  export let buttonText: string | null = null;

  let fileInput: HTMLInputElement;
  let previewUrl: string | null = null;

  $: sizeClass = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  }[size];

  $: uploadButtonText = buttonText ||
    (currentImage || previewUrl ? 'Change Image' : 'Upload Image');

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      onImageChange(file);
      // Create preview URL
      previewUrl = URL.createObjectURL(file);

      // Cleanup previous preview URL
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }
  }

  function handleButtonClick() {
    fileInput?.click();
  }
</script>

<div class="flex items-center gap-4">
  {#if label}
    <Label>{label}</Label>
  {/if}

  <Avatar.Root class={sizeClass}>
    <Avatar.Image
      src={previewUrl || currentImage || ""}
      alt="Profile image"
    />
    <Avatar.Fallback class="bg-muted">
      {#if currentImage || previewUrl}
        <img
          src={previewUrl || currentImage}
          alt="Preview"
          class="w-full h-full object-cover"
        />
      {:else}
        <span class="text-2xl">{fallbackText}</span>
      {/if}
    </Avatar.Fallback>
  </Avatar.Root>

  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    class="hidden"
    on:change={handleFileSelect}
  />

  <Button
    type="button"
    variant="outline"
    class="flex gap-2"
    on:click={handleButtonClick}
  >
    <Upload class="w-4 h-4" />
    {uploadButtonText}
  </Button>
</div>
