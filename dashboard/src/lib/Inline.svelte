<script lang="ts">
	// State text is markdown; the only inline markup it uses is `code`.
	let { text }: { text: string } = $props();
	const parts = $derived(text.split('`'));
</script>

{#each parts as part, i (i)}{#if i % 2}<code
			class="rounded bg-muted px-1 py-px font-mono text-[0.85em] text-foreground">{part}</code
		>{:else}{part}{/if}{/each}
