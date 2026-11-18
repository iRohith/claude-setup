<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const tab = 'shrink-0 rounded-t px-3 py-2 text-sm whitespace-nowrap';
	const current = (href: string) => page.url.pathname === href;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav aria-label="Projects" class="border-b border-neutral-200">
	<div class="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pt-2 sm:px-8">
		<a
			class="{tab} {current('/') ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}"
			href={resolve('/')}>All</a
		>
		{#each data.tabs as t (t.root)}
			{@const href = resolve('/projects/[...path]', { path: t.root.slice(1) })}
			<a
				class="{tab} {page.url.pathname === `/projects${t.root}`
					? 'bg-neutral-900 text-white'
					: 'hover:bg-neutral-100'}"
				{href}>{t.name}</a
			>
		{/each}
		<a
			class="{tab} {current('/global') ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}"
			href={resolve('/global')}>Global</a
		>
	</div>
</nav>

{@render children()}
