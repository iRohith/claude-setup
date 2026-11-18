<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>wf · projects</title></svelte:head>

<main class="mx-auto max-w-4xl p-4 sm:p-8">
	<h1 class="mb-6 text-2xl font-semibold">Projects</h1>
	{#if data.projects.length === 0}
		<p class="text-neutral-500">No projects yet. Run <code>wf init</code> in a project.</p>
	{:else}
		<ul class="space-y-3">
			{#each data.projects as p (p.root)}
				<li class="rounded-lg border border-neutral-200 p-4">
					<a
						class="font-medium hover:underline"
						href={resolve('/projects/[...path]', { path: p.root.slice(1) })}>{p.name}</a
					>
					<span class="ml-2 text-xs text-neutral-500">{p.root}</span>
					{#if p.error}
						<p class="mt-2 text-sm text-red-700">{p.error}</p>
					{:else}
						<dl class="mt-2 grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
							<dt class="text-neutral-500">state</dt>
							<dd>{p.state}</dd>
							<dt class="text-neutral-500">active</dt>
							<dd>{p.active.length ? p.active.join('; ') : '—'}</dd>
							<dt class="text-neutral-500">next</dt>
							<dd>{p.next ?? '—'}</dd>
						</dl>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
