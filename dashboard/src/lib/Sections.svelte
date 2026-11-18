<script lang="ts">
	// A state file shown section by section; each section edits as markdown through the core.
	import { enhance, type SubmitFunction } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Pencil from '@lucide/svelte/icons/pencil';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import type { SectionsView } from '#lib/server/projects.js';

	let {
		view,
		action,
		form
	}: {
		view: SectionsView;
		/** The form action, keeping the page's own query so the result lands on this view. */
		action: string;
		form: { error?: string; item?: string } | null | undefined;
	} = $props();

	/** The section whose editor is open, and its text: held here so a refresh never resets it. */
	let editing = $state<number | null>(null);
	let draft = $state('');

	const closeOnSuccess: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') editing = null;
		};

	const rows = (text: string) => Math.min(Math.max(text.split('\n').length + 1, 4), 28);
</script>

<!-- eslint-disable svelte/no-at-html-tags -- the project's own state files, rendered -->
<div class="mt-6 max-w-[72ch]">
	<div class="md">{@html view.preamble}</div>

	{#each view.sections as section, i (i)}
		<section class="mt-8" aria-labelledby="section-{i}">
			<div class="flex items-center justify-between gap-3 border-b pb-1.5">
				<h2 id="section-{i}" class="min-w-0 text-base font-semibold">{@html section.heading}</h2>
				{#if editing !== i}
					<Button
						size="icon-xs"
						variant="ghost"
						class="shrink-0 text-muted-foreground"
						aria-label="Edit section {i + 1}"
						onclick={() => {
							draft = section.text;
							editing = i;
						}}><Pencil /></Button
					>
				{/if}
			</div>
			{#if editing === i}
				<form method="POST" {action} use:enhance={closeOnSuccess} class="mt-3 grid gap-2">
					<input type="hidden" name="file" value={view.file} />
					<input type="hidden" name="index" value={i} />
					<Textarea
						name="text"
						bind:value={draft}
						rows={rows(section.text)}
						spellcheck="false"
						aria-label="Markdown of section {i + 1}"
						class="font-mono text-[0.8125rem] leading-relaxed"
					/>
					<p class="text-xs text-muted-foreground">
						Markdown, starting with its <code class="font-mono">##</code> heading. wf checks the whole
						file before saving.
					</p>
					<div class="flex gap-2">
						<Button type="submit" size="sm">Save</Button>
						<Button size="sm" variant="ghost" onclick={() => (editing = null)}>Cancel</Button>
					</div>
				</form>
			{:else}
				<div class="md">{@html section.html}</div>
			{/if}
			{#if form?.error && form.item === `section-${i}`}
				<Alert.Root variant="destructive" class="mt-3">
					<CircleAlert />
					<Alert.Description>{form.error}</Alert.Description>
				</Alert.Root>
			{/if}
		</section>
	{:else}
		<p class="mt-4 text-sm text-muted-foreground">
			Nothing recorded yet. wf adds entries here as the work goes on.
		</p>
	{/each}
</div>
