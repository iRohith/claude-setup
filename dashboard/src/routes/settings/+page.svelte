<script lang="ts">
	// The owner's limits for every project's agents; wf has no command for these and agents can't reach them.
	import { untrack } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import type { Settings } from 'wf';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type LimitKey = 'contextChars' | 'learningChars' | 'handoffLines';
	type CountKey = 'listedItems' | 'titleChars';

	const LIMITS: { key: LimitKey; label: string; unit: string; help: string }[] = [
		{
			key: 'contextChars',
			label: 'Session context',
			unit: 'characters',
			help: 'What each session start and compaction injects: learnings, state instructions and the handoff. Checked only for the project wf runs in.'
		},
		{
			key: 'learningChars',
			label: 'One learning',
			unit: 'characters',
			help: 'The length of a single learning.'
		},
		{
			key: 'handoffLines',
			label: 'Handoff',
			unit: 'lines',
			help: "The lines in a project's handoff."
		}
	];
	const COUNTS: { key: CountKey; label: string; unit: string; help: string; off: string }[] = [
		{
			key: 'listedItems',
			label: 'Items listed',
			unit: 'items',
			help: 'Active items wf status names in full, and steers wf show prints.',
			off: 'lists them all'
		},
		{
			key: 'titleChars',
			label: 'Titles in listings',
			unit: 'characters',
			help: 'Longer titles are cut in wf status and wf show.',
			off: 'never cuts'
		}
	];
	const SIDES = [
		{ side: 'warn', label: 'Warn above' },
		{ side: 'refuse', label: 'Refuse above' }
	] as const;

	// A local draft, so the two-second refresh never resets what is being typed.
	let draft: Settings = $state(untrack(() => structuredClone(data.settings)));
	let saved = $state(false);
	const changed = $derived(JSON.stringify(draft) !== JSON.stringify(data.settings));
	const shown = (n: number) => (n === -1 ? 'off' : n.toLocaleString('en'));

	const save: SubmitFunction = () => {
		saved = false;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				draft = structuredClone(data.settings);
				saved = true;
			}
		};
	};
</script>

<svelte:head><title>wf · settings</title></svelte:head>

<h1 class="text-xl font-semibold tracking-tight">Settings</h1>
<p class="mt-1 max-w-prose text-sm text-muted-foreground">
	Limits wf applies to every project's agents. Only you change them, here or in
	<code class="font-mono text-xs whitespace-nowrap">local/wf-settings.json</code>; agents are denied
	both.
</p>

{#if data.unreadable}
	<Alert.Root variant="destructive" class="mt-4 max-w-3xl">
		<CircleAlert />
		<Alert.Description>
			<p>
				wf can't read your settings file, so wf commands that use it fail until you save here.
				Saving replaces it with the values below.
			</p>
			<p class="mt-1 text-xs">Reason: {data.unreadable}</p>
		</Alert.Description>
	</Alert.Root>
{/if}

<form method="POST" action="?/settings" use:enhance={save} class="mt-6 grid max-w-3xl gap-6">
	<section aria-labelledby="limits" class="rounded-xl border bg-card">
		<div class="border-b px-4 py-3">
			<h2 id="limits" class="text-sm font-medium">Limits</h2>
			<p class="text-xs text-muted-foreground">
				Past the warn limit wf writes and warns; past the refuse limit it refuses the write. -1
				turns either off.
			</p>
		</div>
		<ul class="divide-y">
			{#each LIMITS as limit (limit.key)}
				{@const d = data.defaults[limit.key]}
				<li class="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
					<div>
						<h3 class="text-sm font-medium">{limit.label}</h3>
						<p class="mt-1 text-xs text-muted-foreground">{limit.help}</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Default: warn <span class="tabular-nums">{shown(d.warn)}</span>, refuse
							<span class="tabular-nums">{shown(d.refuse)}</span>
						</p>
					</div>
					<div class="grid grid-cols-[7rem_7rem_5rem] items-end gap-2">
						{#each SIDES as { side, label } (side)}
							<div class="grid gap-1">
								<Label for="{limit.key}-{side}" class="text-xs text-muted-foreground">{label}</Label
								>
								<Input
									id="{limit.key}-{side}"
									name="{limit.key}.{side}"
									type="number"
									min="-1"
									step="1"
									required
									aria-label="{limit.label}: {label.toLowerCase()}"
									bind:value={draft[limit.key][side]}
									class="w-full font-mono tabular-nums"
								/>
							</div>
						{/each}
						<span class="pb-2 text-xs text-muted-foreground">{limit.unit}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="listings" class="rounded-xl border bg-card">
		<div class="border-b px-4 py-3">
			<h2 id="listings" class="text-sm font-medium">Listings</h2>
			<p class="text-xs text-muted-foreground">How much wf status and wf show print.</p>
		</div>
		<ul class="divide-y">
			{#each COUNTS as count (count.key)}
				<li class="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
					<div>
						<h3 class="text-sm font-medium">{count.label}</h3>
						<p class="mt-1 text-xs text-muted-foreground">{count.help} -1 {count.off}.</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Default: <span class="tabular-nums">{shown(data.defaults[count.key])}</span>
							{count.unit}
						</p>
					</div>
					<div class="grid grid-cols-[7rem_7rem_5rem] items-end gap-2">
						<div class="grid gap-1">
							<Label for={count.key} class="text-xs text-muted-foreground">At most</Label>
							<Input
								id={count.key}
								name={count.key}
								type="number"
								min="-1"
								step="1"
								required
								aria-label="{count.label}: at most"
								bind:value={draft[count.key]}
								class="w-full font-mono tabular-nums"
							/>
						</div>
						<span class="pb-2 text-xs text-muted-foreground">{count.unit}</span>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	{#if form?.error}
		<Alert.Root variant="destructive">
			<CircleAlert />
			<Alert.Description>{form.error}</Alert.Description>
		</Alert.Root>
	{/if}

	<div class="flex items-center gap-3">
		<Button type="submit" disabled={!changed && !data.unreadable}>Save settings</Button>
		{#if changed}
			<Button
				type="button"
				variant="ghost"
				onclick={() => {
					draft = structuredClone(data.settings);
				}}>Discard changes</Button
			>
		{/if}
		<p class="text-sm text-muted-foreground" aria-live="polite">
			{#if saved && !changed}Saved; wf uses them from its next command.{/if}
		</p>
	</div>
</form>
