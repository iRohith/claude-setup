<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import AppSidebar from '#lib/AppSidebar.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider>
	<AppSidebar tabs={data.tabs} />
	<Sidebar.Inset class="min-w-0">
		<header class="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/95 px-3">
			<Sidebar.Trigger />
			<span class="text-sm text-muted-foreground md:hidden">wf</span>
		</header>
		<div class="w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
