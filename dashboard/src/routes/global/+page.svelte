<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>wf · global</title></svelte:head>

<main class="mx-auto max-w-4xl p-4 sm:p-8">
	<h1 class="mb-1 text-2xl font-semibold">Global</h1>
	<p class="mb-6 text-sm text-neutral-500">Learnings injected into every project's sessions.</p>
	{#if data.learnings}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- the owner's own state files, rendered -->
		<div class="md">{@html data.learnings}</div>
	{:else}
		<p class="text-neutral-500">No global learnings yet.</p>
	{/if}
</main>
