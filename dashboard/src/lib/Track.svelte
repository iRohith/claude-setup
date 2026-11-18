<script lang="ts">
	// A major's progress: one segment per minor, coloured by its state.
	import type { Mark } from 'wf';

	let { marks, class: className = '' }: { marks: Mark[]; class?: string } = $props();

	const COLOUR = { x: 'bg-done', '~': 'bg-progress', ' ': 'bg-open' } as const;
	const done = $derived(marks.filter((m) => m === 'x').length);
	const going = $derived(marks.filter((m) => m === '~').length);
	const label = $derived(
		marks.length
			? `${done} of ${marks.length} done${going ? `, ${going} in progress` : ''}`
			: 'no minors yet'
	);
</script>

<div role="img" aria-label={label} class="flex h-1.5 gap-0.5 {className}">
	{#each marks as mark, i (i)}
		<span class="min-w-1 flex-1 rounded-full {COLOUR[mark]}"></span>
	{:else}
		<span class="flex-1 rounded-full border border-dashed border-open"></span>
	{/each}
</div>
