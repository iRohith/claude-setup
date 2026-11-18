<script lang="ts">
	// Every registered project with its state and current major, plus the global records.
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Globe from '@lucide/svelte/icons/globe';
	import LayoutList from '@lucide/svelte/icons/layout-list';
	import favicon from '#lib/assets/favicon.svg';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { ProjectTab } from '#lib/server/projects.js';
	import Track from '#lib/Track.svelte';

	let { tabs }: { tabs: ProjectTab[] } = $props();

	const sidebar = Sidebar.useSidebar();
	afterNavigate(() => sidebar.setOpenMobile(false));

	const path = $derived(page.url.pathname);
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<a href={resolve('/')} class="flex items-center gap-2 px-2 py-1.5">
			<img src={favicon} alt="" class="size-5" />
			<span class="font-semibold tracking-tight">wf</span>
			<span class="text-xs text-muted-foreground">state of every project</span>
		</a>
	</Sidebar.Header>
	<Sidebar.Content>
		<nav aria-label="Projects" class="flex min-h-0 flex-1 flex-col">
			<Sidebar.Group>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={path === '/'}>
							{#snippet child({ props })}
								<a href={resolve('/')} {...props}><LayoutList /><span>All projects</span></a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Group>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Projects</Sidebar.GroupLabel>
				<Sidebar.Menu class="gap-1">
					{#each tabs as tab (tab.root)}
						{@const href = resolve('/projects/[...path]', { path: tab.root.slice(1) })}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton size="lg" isActive={path === `/projects${tab.root}`}>
								{#snippet child({ props })}
									<a {href} {...props}>
										<span class="flex min-w-0 flex-1 flex-col gap-1.5">
											<span class="flex items-baseline justify-between gap-2">
												<span class="truncate">{tab.name}</span>
												<span class="text-xs font-normal text-muted-foreground">
													{tab.admin ? 'admin' : (tab.state ?? 'unreadable')}
												</span>
											</span>
											{#if tab.current}
												<Track marks={tab.current.marks} />
											{/if}
										</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{:else}
						<p class="px-2 text-xs text-muted-foreground">
							None yet. <code class="font-mono">wf init</code> in a project registers it.
						</p>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
			<Sidebar.Group class="mt-auto">
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={path === '/global'}>
							{#snippet child({ props })}
								<a href={resolve('/global')} {...props}><Globe /><span>Global</span></a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Group>
		</nav>
	</Sidebar.Content>
</Sidebar.Root>
