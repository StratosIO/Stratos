<!-- lib/components/FileList.svelte -->
<script lang="ts">
  import { files, fileSelected } from '$lib/stores'
  import { get } from 'svelte/store'

  function selectFile(index: number) {
    fileSelected.set(index)
  }

  function deleteFile(index: number, e: Event) {
    e.stopPropagation()
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
    <p class="text-gray-500">No files uploaded yet.</p>
  {:else}
    <ul>
      {#each $files as file, index (file.id)}
        <li class="group relative mb-2 flex items-center">
          <button
            type="button"
            class="min-w-0 flex-1 cursor-pointer rounded-lg p-2 transition-colors duration-200 group-hover:bg-gray-100 {$fileSelected ===
            index
              ? 'bg-gray-100'
              : ''}"
            on:click={() => selectFile(index)}
          >
            <div class="flex items-center">
              <div
                class="mr-3 flex h-9 w-12 flex-shrink-0 justify-center rounded"
                style={file.thumb
                  ? `background-image: url(${file.thumb}); background-size: cover; background-position: center;`
                  : 'background-color: #f3f4f6'}
              >
                <span class="material-icons text-3xl text-dark/50">{file.icon}</span>
              </div>
              <span class="truncate text-dark">{file.file.name}</span>
            </div>
          </button>
          <button
          on:click={(e) => deleteFile(index, e)}
          class="material-icons absolute right-2 top-1/2 text-dark/50 opacity-0 group-hover:opacity-100 
                 transition-color duration-200 hover:text-danger -translate-y-1/2"
        >
          delete
        </button>            
        </li>
      {/each}
    </ul>
  {/if}
</div>
