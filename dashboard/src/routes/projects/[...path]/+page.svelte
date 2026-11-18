<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import ShieldAlert from '@lucide/svelte/icons/shield-alert';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import Inline from '#lib/Inline.svelte';
	import MarkBadge from '#lib/MarkBadge.svelte';
	import Track from '#lib/Track.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const here = $derived(resolve('/projects/[...path]', { path: data.summary.root.slice(1) }));
	const STATES = ['setup', 'discuss', 'build'] as const;

	/** The state picked in the switch, until it is applied. */
	let picked = $state<string>();
	const chosen = $derived(picked ?? data.summary.state ?? 'setup');

	/** The one item whose edit form is open. */
	let editing = $state<string | null>(null);
	const closeOnSave: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') editing = null;
		};

	/** The done checkbox submits its row's form: check when ticked, reopen when cleared. */
	const doneForms: Record<string, HTMLFormElement> = {};

	const counts = $derived.by(() => {
		const majors = data.todo?.majors ?? [];
		return {
			done: majors.filter((m) => m.mark === 'x').length,
			total: majors.length,
			going: majors.flatMap((m) => m.minors).filter((n) => n.mark === '~').length
		};
	});
</script>

{#snippet problem(id: string)}
	{#if form?.error && form.item === id}
		<Alert.Root variant="destructive" class="mt-3">
			<CircleAlert />
			<Alert.Description>{form.error}</Alert.Description>
		</Alert.Root>
	{/if}
{/snippet}

{#snippet act(action: string, id: string, label: string, variant: 'outline' | 'ghost')}
	<form method="POST" action="?/{action}" use:enhance>
		<input type="hidden" name="id" value={id} />
		<Button
			type="submit"
			size="xs"
			{variant}
			class={variant === 'ghost' ? 'text-muted-foreground' : ''}
			aria-label="{label} {id}">{label}</Button
		>
	</form>
{/snippet}

{#snippet field(id: string, name: string, label: string, value: string, aria: string)}
	<div class="grid gap-1.5">
		<Label for={id} class="text-xs text-muted-foreground">{label}</Label>
		<Input {id} {name} {value} aria-label={aria} />
	</div>
{/snippet}

<svelte:head><title>wf · {data.summary.name}</title></svelte:head>

<header class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
	<div class="min-w-0">
		<h1 class="text-xl font-semibold tracking-tight">{data.summary.name}</h1>
		<p class="mt-0.5 font-mono text-xs break-all text-muted-foreground">{data.summary.root}</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<form method="POST" action="?/state" use:enhance class="flex items-center gap-2">
			<Label for="state" class="text-sm text-muted-foreground">State</Label>
			<Select.Root type="single" name="state" bind:value={() => chosen, (v) => (picked = v)}>
				<Select.Trigger id="state" aria-label="State" class="w-28">{chosen}</Select.Trigger>
				<Select.Content>
					{#each STATES as s (s)}
						<Select.Item value={s} label={s} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Button type="submit" variant="outline" disabled={chosen === data.summary.state}
				>Switch</Button
			>
		</form>
		{#if !data.summary.admin}
			<form method="POST" action="?/admin" use:enhance>
				<input type="hidden" name="on" value="true" />
				<Button type="submit" variant="ghost" class="text-muted-foreground">
					Turn admin mode on
				</Button>
			</form>
		{/if}
	</div>
</header>
{@render problem('state')}

{#if data.summary.admin}
	<form method="POST" action="?/admin" use:enhance class="mt-4">
		<input type="hidden" name="on" value="false" />
		<Alert.Root variant="destructive" role="status">
			<ShieldAlert />
			<Alert.Title>Admin mode is on.</Alert.Title>
			<Alert.Description>No wf restriction applies to this project.</Alert.Description>
			<Alert.Action>
				<Button type="submit" size="sm" variant="destructive">Turn off</Button>
			</Alert.Action>
		</Alert.Root>
	</form>
{/if}

<nav aria-label="Views" class="mt-6 flex gap-1 overflow-x-auto border-b">
	{#each data.views as v (v)}
		<a
			href="{here}?view={v}"
			aria-current={data.view === v ? 'page' : undefined}
			class="-mb-px inline-flex h-9 shrink-0 items-center border-b-2 px-3 text-sm capitalize transition-colors {data.view ===
			v
				? 'border-primary font-medium text-foreground'
				: 'border-transparent text-muted-foreground hover:text-foreground'}">{v}</a
		>
	{/each}
</nav>

{#if data.summary.error}
	<Alert.Root variant="destructive" class="mt-6">
		<CircleAlert />
		<Alert.Title>This project's state doesn't parse</Alert.Title>
		<Alert.Description>{data.summary.error}</Alert.Description>
	</Alert.Root>
{:else if data.view !== 'todo'}
	{#if data.view === 'docs'}
		<div class="mt-4 flex flex-wrap gap-1">
			{#each data.docs as d (d)}
				<Button
					href="{here}?view=docs&doc={d}"
					size="sm"
					variant={data.doc === d ? 'secondary' : 'ghost'}
					aria-current={data.doc === d ? 'page' : undefined}>{d}</Button
				>
			{/each}
		</div>
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- the project's own state files, rendered -->
	<div class="md mt-6">{@html data.html}</div>
{:else if data.todo}
	<Collapsible.Root>
		<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm text-muted-foreground">
				<span class="font-mono text-foreground">{counts.done}</span> of
				<span class="font-mono text-foreground">{counts.total}</span> majors done ·
				<span class="font-mono text-foreground">{counts.going}</span> minors in progress
			</p>
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
				<Plus />Add a major
			</Collapsible.Trigger>
		</div>
		<Collapsible.Content>
			<form
				method="POST"
				action="?/addMajor"
				use:enhance
				class="mt-3 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
			>
				<input type="hidden" name="id" value="new" />
				{@render field('new-title', 'title', 'Title', '', 'New major title')}
				{@render field(
					'new-deliverable',
					'deliverable',
					'Deliverable the owner can inspect',
					'',
					'New major deliverable'
				)}
				<Button type="submit">Add major</Button>
			</form>
			{@render problem('new')}
		</Collapsible.Content>
	</Collapsible.Root>

	{#if data.todo.majors.length === 0}
		<div class="mt-4 rounded-xl border border-dashed p-6 text-sm">
			<p class="font-medium">No majors yet</p>
			<p class="mt-1 text-muted-foreground">
				The first major is a crude end-to-end version of what the project is for. Add it above, or
				write the plan with <code class="font-mono text-foreground">wf batch</code>.
			</p>
		</div>
	{/if}

	<div class="mt-4 space-y-4">
		{#each data.todo.majors as major (major.id)}
			{@const done = major.minors.filter((n) => n.mark === 'x').length}
			<section aria-labelledby="major-{major.id}" class="rounded-xl border bg-card">
				<!-- Finished majors fold away so the active work stays near the top. -->
				<Collapsible.Root open={major.mark !== 'x'}>
					<div class="flex items-start gap-2 p-3 pr-4 sm:gap-3 sm:p-4">
						<Collapsible.Trigger
							class="{buttonVariants({
								variant: 'ghost',
								size: 'icon-sm'
							})} group/fold -my-0.5 shrink-0 text-muted-foreground"
							aria-label="Fold {major.id}"
						>
							<ChevronRight class="transition-transform group-data-[state=open]/fold:rotate-90" />
						</Collapsible.Trigger>
						<div class="min-w-0 flex-1">
							<!-- The title keeps at least 15rem; the status drops to its own line when it would not fit. -->
							<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
								<h2
									id="major-{major.id}"
									class="flex min-w-0 grow basis-60 items-baseline gap-2 font-medium"
								>
									<span class="font-mono text-sm text-muted-foreground">{major.id}</span>
									<span class="min-w-0"><Inline text={major.title} /></span>
								</h2>
								<div class="flex shrink-0 items-center gap-3">
									<MarkBadge mark={major.mark} />
									<span class="font-mono text-xs text-muted-foreground"
										>{done}/{major.minors.length}</span
									>
									<Track marks={major.minors.map((n) => n.mark)} class="w-24 sm:w-32" />
									<div class="flex items-center gap-1">
										{#if major.mark === 'x'}
											{@render act('reopen', major.id, 'Reopen', 'ghost')}
										{:else if major.minors.length && done === major.minors.length}
											{@render act('check', major.id, 'Mark done', 'outline')}
										{/if}
										<Button
											size="icon-xs"
											variant="ghost"
											class="text-muted-foreground"
											aria-label="Edit {major.id}"
											onclick={() => (editing = editing === major.id ? null : major.id)}
											><Pencil /></Button
										>
									</div>
								</div>
							</div>
							<p class="mt-2 text-sm text-muted-foreground">
								Deliverable: <span class="text-foreground/85"
									><Inline text={major.deliverable} /></span
								>
							</p>
							{#if editing === major.id}
								<form
									method="POST"
									action="?/edit"
									use:enhance={closeOnSave}
									class="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-end"
								>
									<input type="hidden" name="id" value={major.id} />
									{@render field(
										`title-${major.id}`,
										'title',
										'Title',
										major.title,
										`Title of ${major.id}`
									)}
									{@render field(
										`deliverable-${major.id}`,
										'deliverable',
										'Deliverable',
										major.deliverable,
										`Deliverable of ${major.id}`
									)}
									<Button type="submit">Save</Button>
									<Button variant="ghost" onclick={() => (editing = null)}>Cancel</Button>
								</form>
							{/if}
							{@render problem(major.id)}
						</div>
					</div>

					<Collapsible.Content>
						<ul class="divide-y border-t">
							{#each major.minors as minor (minor.id)}
								<li class="flex gap-3 px-4 py-3 sm:pl-14">
									<form
										method="POST"
										action={minor.mark === 'x' ? '?/reopen' : '?/check'}
										use:enhance
										bind:this={doneForms[minor.id]}
										class="pt-1"
									>
										<input type="hidden" name="id" value={minor.id} />
										<Checkbox
											aria-label="Done {minor.id}"
											bind:checked={
												() => minor.mark === 'x', () => doneForms[minor.id]?.requestSubmit()
											}
											class="data-checked:border-done data-checked:bg-done dark:data-checked:bg-done"
										/>
									</form>
									<!-- The id keeps its own column so long titles wrap under the title. -->
									<span class="w-9 shrink-0 font-mono text-xs leading-6 text-muted-foreground"
										>{minor.id}</span
									>
									<div class="min-w-0 flex-1">
										<p class="leading-6 {minor.mark === 'x' ? 'text-muted-foreground' : ''}">
											<Inline text={minor.title} />
											{#if minor.mark === '~'}<span class="ml-1.5 inline-flex align-[1px]"
													><MarkBadge mark={minor.mark} /></span
												>{/if}
										</p>
										<p class="mt-0.5 text-sm text-muted-foreground">
											Proof: <Inline text={minor.proof} />
										</p>
										{#if minor.impl.length}
											<Collapsible.Root open={minor.mark === '~'}>
												<Collapsible.Trigger
													class="group/impl mt-1 inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground"
												>
													<ChevronRight
														class="size-3.5 transition-transform group-data-[state=open]/impl:rotate-90"
													/>
													{minor.impl.length} implementation {minor.impl.length === 1
														? 'detail'
														: 'details'}
												</Collapsible.Trigger>
												<Collapsible.Content>
													<ul
														class="mt-1.5 list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground"
													>
														{#each minor.impl as detail, i (i)}
															<li><Inline text={detail} /></li>
														{/each}
													</ul>
												</Collapsible.Content>
											</Collapsible.Root>
										{/if}
										{#if editing === minor.id}
											<form
												method="POST"
												action="?/edit"
												use:enhance={closeOnSave}
												class="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-end"
											>
												<input type="hidden" name="id" value={minor.id} />
												{@render field(
													`title-${minor.id}`,
													'title',
													'Title',
													minor.title,
													`Title of ${minor.id}`
												)}
												{@render field(
													`proof-${minor.id}`,
													'proof',
													'Proof',
													minor.proof,
													`Proof of ${minor.id}`
												)}
												<Button type="submit">Save</Button>
												<Button variant="ghost" onclick={() => (editing = null)}>Cancel</Button>
											</form>
										{/if}
										{@render problem(minor.id)}
									</div>
									<div class="flex shrink-0 items-start gap-1">
										{#if minor.mark === ' '}
											{@render act('start', minor.id, 'Start', 'outline')}
										{:else if minor.mark === '~'}
											{@render act('reopen', minor.id, 'Reopen', 'ghost')}
										{/if}
										<Button
											size="icon-xs"
											variant="ghost"
											class="text-muted-foreground"
											aria-label="Edit {minor.id}"
											onclick={() => (editing = editing === minor.id ? null : minor.id)}
											><Pencil /></Button
										>
									</div>
								</li>
							{/each}
						</ul>

						{#if major.mark !== 'x'}
							<Collapsible.Root class="border-t px-4 py-3 sm:pl-14">
								<Collapsible.Trigger
									class="{buttonVariants({
										variant: 'ghost',
										size: 'sm'
									})} -ml-2.5 text-muted-foreground"
								>
									<Plus />Add a minor to {major.id}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<form
										method="POST"
										action="?/addMinor"
										use:enhance
										class="mt-2 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
									>
										<input type="hidden" name="id" value={major.id} />
										<input type="hidden" name="item" value="new-{major.id}" />
										{@render field(
											`new-minor-title-${major.id}`,
											'title',
											'Title',
											'',
											`New minor title for ${major.id}`
										)}
										{@render field(
											`new-minor-proof-${major.id}`,
											'proof',
											'Tangible, verifiable proof',
											'',
											`New minor proof for ${major.id}`
										)}
										<Button type="submit">Add minor</Button>
									</form>
									{@render problem(`new-${major.id}`)}
								</Collapsible.Content>
							</Collapsible.Root>
						{/if}
					</Collapsible.Content>
				</Collapsible.Root>
			</section>
		{/each}
	</div>
{/if}
