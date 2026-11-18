<script lang="ts">
	// State text is markdown; the only inline markup it uses is `code`.
	let { text }: { text: string } = $props();
	const parts = $derived(text.split('`'));
</script>

{#each parts as part, i (i)}{#if i % 2}<code class="rounded bg-neutral-100 px-1 text-[0.9em]"
			>{part}</code
		>{:else}{part}{/if}{/each}
