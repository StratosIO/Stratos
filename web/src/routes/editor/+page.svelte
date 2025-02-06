<script lang="ts">
  // Initialize state with percentage values
  let state = {
    leftPct: 25, // Left panel width (% of container width)
    rightPct: 25, // Right panel width (% of container width)
    timelinePct: 37.5, // Timeline height (% of viewport height)
    containerWidth: 0, // Container width in pixels (bound via clientWidth)
  }

  // Minimum sizes for panels in pixels
  const minSizes = {
    left: 200,
    right: 200,
    middle: 200,
    top: 200,
    bottom: 200,
  }

  /**
   * Clamp a value between a minimum and maximum.
   * @param val The value to clamp.
   * @param min The minimum allowed value.
   * @param max The maximum allowed value.
   * @returns The clamped value.
   */
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

  /**
   * Generic drag handler.
   * @param e Pointer event that starts the drag.
   * @param cb Callback receiving delta x and y.
   */
  const drag = (e: PointerEvent, cb: (dx: number, dy: number) => void) => {
    const startX = e.clientX,
      startY = e.clientY
    const onMove = (ev: PointerEvent) => {
      cb(ev.clientX - startX, ev.clientY - startY)
      // Update state to trigger Svelte reactivity
      state = { ...state }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  /**
   * Handle left or right divider dragging.
   * @param side "left" or "right".
   * @param e Pointer event.
   */
  const dragSide = (side: 'left' | 'right', e: PointerEvent) => {
    const key = side === 'left' ? 'leftPct' : 'rightPct'
    const otherKey = side === 'left' ? 'rightPct' : 'leftPct'
    const initialPx = (state.containerWidth * state[key]) / 100
    drag(e, (dx) => {
      // For left, increase width; for right, decrease width
      let newPx = side === 'left' ? initialPx + dx : initialPx - dx
      const otherPx = (state.containerWidth * state[otherKey]) / 100
      // Ensure the middle panel doesn't shrink below its minimum
      const maxPx = state.containerWidth - otherPx - 8 - minSizes.middle
      newPx = clamp(newPx, minSizes[side], maxPx)
      state[key] = (newPx / state.containerWidth) * 100
    })
  }

  /**
   * Unified pointer down handler for dividers.
   * @param e Pointer event.
   * @param type Divider type: "left", "right", or "horiz".
   */
  const onDividerDown = (e: PointerEvent, type: 'left' | 'right' | 'horiz') => {
    if (type === 'left' || type === 'right') {
      dragSide(type, e)
    } else if (type === 'horiz') {
      // Timeline drag: using viewport height for calculations
      const vh = window.innerHeight
      const initialPx = (vh * state.timelinePct) / 100
      drag(e, (_, dy) => {
        let newPx = initialPx - dy
        const maxPx = vh - minSizes.top
        newPx = clamp(newPx, minSizes.bottom, maxPx)
        state.timelinePct = (newPx / vh) * 100
      })
    }
  }
</script>

<div class="flex h-screen select-none flex-col">
  <!-- Upper area -->
  <div bind:clientWidth={state.containerWidth} class="flex flex-1 flex-col">
    <div class="flex flex-1">
      <!-- Function Panel -->
      <div class="flex items-center justify-center bg-blue-100 p-2" style="width: {state.leftPct}%">
        Function Panel
      </div>
      <!-- Left Divider -->
      <div
        class="cursor-col-resize bg-gray-300"
        style="width: 4px"
        on:pointerdown={(e) => onDividerDown(e, 'left')}
      ></div>
      <!-- Video Preview -->
      <div class="flex flex-1 items-center justify-center bg-green-100 p-2">Video Preview</div>
      <!-- Right Divider -->
      <div
        class="cursor-col-resize bg-gray-300"
        style="width: 4px"
        on:pointerdown={(e) => onDividerDown(e, 'right')}
      ></div>
      <!-- Properties Panel -->
      <div
        class="flex items-center justify-center bg-yellow-100 p-2"
        style="width: {state.rightPct}%"
      >
        Properties Panel
      </div>
    </div>
    <!-- Horizontal Divider -->
    <div
      class="cursor-row-resize bg-gray-300"
      style="height: 4px"
      on:pointerdown={(e) => onDividerDown(e, 'horiz')}
    ></div>
  </div>
  <!-- Timeline Area -->
  <div
    class="flex items-center justify-center bg-purple-100 p-2"
    style="height: {state.timelinePct}vh"
  >
    Timeline
  </div>
</div>
