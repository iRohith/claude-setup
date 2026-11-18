<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Inline from '#lib/Inline.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const MARK = {
		' ': { label: 'open', style: 'bg-neutral-100 text-neutral-600' },
		'~': { label: 'in progress', style: 'bg-amber-100 text-amber-800' },
		x: { label: 'done', style: 'bg-emerald-100 text-emerald-800' }
	} as const;
</script>

{#snippet badge(mark: keyof typeof MARK)}
	<span class="rounded px-1.5 py-0.5 align-middle text-xs font-normal {MARK[mark].style}"
		>{MARK[mark].label}</span
	>
{/snippet}

<svelte:head><title>wf · {data.summary.name}</title></svelte:head>

<main class="mx-auto max-w-4xl p-4 sm:p-8">
	<a class="text-sm text-neutral-500 hover:underline" href={resolve('/')}>← projects</a>
	<h1 class="mt-2 text-2xl font-semibold">{data.summary.name}</h1>
	<p class="text-sm text-neutral-500">
		<span class="break-all">{data.summary.root}</span> · {data.summary.state ?? '?'}
	</p>

	<form method="POST" action="?/admin" use:enhance class="mt-3 mb-6">
		<input type="hidden" name="on" value={String(!data.summary.admin)} />
		{#if data.summary.admin}
			<div
				class="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
			>
				<span><strong>Admin mode is on.</strong> No wf restriction applies to this project.</span>
				<button class="rounded bg-red-700 px-3 py-1 text-white hover:bg-red-800">Turn off</button>
			</div>
		{:else}
			<button class="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50">
				Turn admin mode on
			</button>
		{/if}
	</form>

	{#if data.summary.error}
		<p class="text-red-700">{data.summary.error}</p>
	{:else if data.todo}
		<h2 class="mb-3 text-lg font-semibold">Todo</h2>
		{#each data.todo.majors as major (major.id)}
			<!-- Finished majors fold away so the active work stays near the top. -->
			<details class="mb-6" open={major.mark !== 'x'}>
				<summary class="cursor-pointer font-medium">
					{@render badge(major.mark)}
					{major.id} · <Inline text={major.title} />
				</summary>
				<p class="mb-2 text-sm text-neutral-600">
					Deliverable: <Inline text={major.deliverable} />
				</p>
				<ul class="space-y-2 border-l border-neutral-200 pl-4">
					{#each major.minors as minor (minor.id)}
						<li>
							<p>{@render badge(minor.mark)} {minor.id} <Inline text={minor.title} /></p>
							<p class="text-sm text-neutral-600">Proof: <Inline text={minor.proof} /></p>
							{#if minor.impl.length}
								<details class="mt-1 text-sm text-neutral-700" open={minor.mark === '~'}>
									<summary class="cursor-pointer text-neutral-500">
										{minor.impl.length} implementation {minor.impl.length === 1
											? 'detail'
											: 'details'}
									</summary>
									<ul class="list-disc pl-5">
										{#each minor.impl as detail, i (i)}
											<li><Inline text={detail} /></li>
										{/each}
									</ul>
								</details>
							{/if}
						</li>
					{/each}
				</ul>
			</details>
		{/each}
	{/if}
</main>
