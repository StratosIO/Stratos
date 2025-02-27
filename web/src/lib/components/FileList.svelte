<!-- lib/components/FileList.svelte -->
<script lang="ts">
  import { files, fileSelected, endpoint } from '$lib/stores'
  import { get } from 'svelte/store'

  async function deleteFileFromServer(id: string): Promise<void> {
    const token = 'AUTH_TOKEN_PLACEHOLDER'
    const path = `${get(endpoint)}/uploads/${id}`
    try {
      const response = await fetch(path, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (!response.ok) {
        console.error('File deletion failed:', result)
      } else {
        console.log('File deleted successfully:', result)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  function selectFile(index: number): void {
    fileSelected.set(index)
  }

  function deleteFile(index: number, e: Event): void {
    e.stopPropagation()
    const currentFiles = get(files)
    const fileToDelete = currentFiles[index]
    if (fileToDelete.xhr && typeof fileToDelete.xhr.abort === 'function') {
      fileToDelete.xhr.abort()
    }
    if (fileToDelete.uploaded) {
      deleteFileFromServer(fileToDelete.id)
    }
    files.update((current) => {
      const filesNew = [...current]
      filesNew.splice(index, 1)
      return filesNew
    })
    fileSelected.update((currentIndex) => {
      if (currentIndex === index) {
        return get(files).length ? 0 : -1
      } else if (currentIndex > index) {
        return currentIndex - 1
      }
      return currentIndex
    })
  }
</script>

<div>
  <h2 class="mb-4 text-xl font-bold md:text-2xl">File List</h2>
  {#if $files.length === 0}
    <p class="text-dark/70">No files uploaded yet.</p>
  {:else}
    <ul>
      {#each $files as file, index (file.id)}
        <li class="group relative mb-2 flex items-center">
          <button
            type="button"
            class="group-hover:bg-pale relative min-w-0 flex-1 cursor-pointer rounded-lg p-2 transition-colors duration-200"
            class:bg-pale={$fileSelected === index}
            class:animate-pulse={!file.uploaded && file.progress === 0}
            on:click={() => selectFile(index)}
          >
            {#if file.progress > 0}
              <div
                class="bg-primary/20 absolute inset-0 h-full rounded-lg transition-all duration-200"
                style="width: {file.progress}%;"
                class:opacity-100={!file.uploaded}
                class:opacity-0={file.uploaded}
              ></div>
            {/if}
            <div class="relative flex items-center">
              <div
                class="mr-3 flex h-9 w-12 shrink-0 items-center justify-center rounded-sm"
                class:bg-pale={!file.thumb}
                style={file.thumb && `background-image: url(${file.thumb}); background-size: cover; background-position: center;`}
              >
                <span class="material-icons text-dark/50 text-3xl">{file.icon}</span>
              </div>
              <span class="text-dark relative truncate">{file.file.name}</span>
            </div>
          </button>
          <button
            on:click={(e) => deleteFile(index, e)}
            class="material-icons text-dark/0 hover:text-danger group-hover:text-dark/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
          >
            delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
