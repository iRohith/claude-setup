<script lang="ts">
	import './layout.css';
	import { invalidateAll } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import AppSidebar from '#lib/AppSidebar.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	/**
	 * The spec's freshness rule: state is re-read every two seconds while the tab is visible. The next
	 * refresh is scheduled only after the last one finishes, so a slow server never gets a pile-up.
	 */
	const REFRESH_MS = 2000;
	$effect(() => {
		let timer: ReturnType<typeof setTimeout>;
		let stopped = false;
		const refresh = async () => {
			if (document.visibilityState === 'visible') await invalidateAll();
			if (!stopped) timer = setTimeout(refresh, REFRESH_MS);
		};
		timer = setTimeout(refresh, REFRESH_MS);
		return () => {
			stopped = true;
			clearTimeout(timer);
		};
	});
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
