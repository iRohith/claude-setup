<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>wf · global</title></svelte:head>

<h1 class="text-xl font-semibold tracking-tight">Global</h1>
<p class="mt-1 text-sm text-muted-foreground">Learnings injected into every project's sessions.</p>
{#if data.learnings}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- the owner's own state files, rendered -->
	<div class="md mt-6">{@html data.learnings}</div>
{:else}
	<div class="mt-6 rounded-xl border border-dashed p-6 text-sm">
		<p class="font-medium">No global learnings yet</p>
		<p class="mt-1 text-muted-foreground">
			<code class="font-mono text-foreground">wf learn --global "…"</code> records a lesson that holds
			for every project. It appears here and in every session's context.
		</p>
	</div>
{/if}
