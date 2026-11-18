<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import Inline from '#lib/Inline.svelte';
	import Track from '#lib/Track.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>wf · projects</title></svelte:head>

<h1 class="text-xl font-semibold tracking-tight">Projects</h1>
<p class="mt-1 text-sm text-muted-foreground">
	Each project's state, the major it is on, and what is moving.
</p>

{#if data.projects.length === 0}
	<div class="mt-6 rounded-xl border border-dashed p-6 text-sm">
		<p class="font-medium">No projects registered yet</p>
		<p class="mt-1 text-muted-foreground">
			Run <code class="font-mono text-foreground">wf init</code> inside a project folder. It shows
			up here with its todo once its <code class="font-mono text-foreground">docs/state</code> parses.
		</p>
	</div>
{:else}
	<ul class="mt-6 divide-y rounded-xl border bg-card">
		{#each data.projects as p (p.root)}
			{@const done = p.current?.marks.filter((m) => m === 'x').length ?? 0}
			<li
				class="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:gap-8 sm:p-5"
			>
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<a
							class="font-medium underline-offset-4 hover:underline"
							href={resolve('/projects/[...path]', { path: p.root.slice(1) })}>{p.name}</a
						>
						{#if p.state}<Badge variant="outline">{p.state}</Badge>{/if}
						{#if p.admin}<Badge variant="destructive">admin mode</Badge>{/if}
					</div>
					<p class="mt-0.5 truncate font-mono text-xs text-muted-foreground">{p.root}</p>
					{#if p.error}
						<p class="mt-3 text-sm text-destructive">{p.error}</p>
					{:else}
						<dl class="mt-3 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
							<dt class="text-muted-foreground">Active</dt>
							<dd class="space-y-0.5">
								{#each p.active as item (item)}
									<p><Inline text={item} /></p>
								{:else}
									<p class="text-muted-foreground">nothing in progress</p>
								{/each}
							</dd>
							<dt class="text-muted-foreground">Next</dt>
							<dd>
								{#if p.next}<Inline text={p.next} />{:else}<span class="text-muted-foreground"
										>nothing left</span
									>{/if}
							</dd>
						</dl>
					{/if}
				</div>
				{#if p.current}
					<div class="self-start">
						<p class="flex items-baseline justify-between gap-3 text-xs">
							<span class="min-w-0 truncate">
								<span class="font-mono text-muted-foreground">{p.current.id}</span>
								<Inline text={p.current.title} />
							</span>
							<span class="shrink-0 font-mono text-muted-foreground"
								>{done}/{p.current.marks.length}</span
							>
						</p>
						<Track marks={p.current.marks} class="mt-2" />
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
