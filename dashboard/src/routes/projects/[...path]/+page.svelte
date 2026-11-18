<script lang="ts">
	import { resolve } from '$app/paths';
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
	<p class="mb-6 text-sm text-neutral-500">{data.summary.root} · {data.summary.state ?? '?'}</p>

	{#if data.summary.error}
		<p class="text-red-700">{data.summary.error}</p>
	{:else if data.todo}
		<h2 class="mb-3 text-lg font-semibold">Todo</h2>
		{#each data.todo.majors as major (major.id)}
			<section class="mb-6">
				<h3 class="font-medium">
					{@render badge(major.mark)}
					{major.id} · {major.title}
				</h3>
				<p class="mb-2 text-sm text-neutral-600">Deliverable: {major.deliverable}</p>
				<ul class="space-y-2 border-l border-neutral-200 pl-4">
					{#each major.minors as minor (minor.id)}
						<li>
							<p>{@render badge(minor.mark)} {minor.id} {minor.title}</p>
							<p class="text-sm text-neutral-600">Proof: {minor.proof}</p>
							{#if minor.impl.length}
								<ul class="mt-1 list-disc pl-5 text-sm text-neutral-700">
									{#each minor.impl as detail, i (i)}
										<li>{detail}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</main>
