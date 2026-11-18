<script lang="ts">
	// Learnings as an editable list, through the same core rules as `wf learn`.
	import { enhance, type SubmitFunction } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Pencil from '@lucide/svelte/icons/pencil';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import Inline from '#lib/Inline.svelte';

	let {
		lessons,
		context,
		budget,
		scope,
		action,
		form
	}: {
		lessons: string[];
		/** Characters the fullest affected project's session context uses now. */
		context: number;
		budget: number;
		/** Who the learnings reach, for the budget line. */
		scope: string;
		/** The form action, keeping the page's own query so the result lands on this view. */
		action: string;
		form: { error?: string; item?: string } | null | undefined;
	} = $props();

	const MAX = 200;

	/** The learning whose edit form is open. */
	let editing = $state<number | null>(null);
	let draft = $state('');

	const closeOnSuccess: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				editing = null;
				draft = '';
			}
		};

	/** "what went wrong → what to do instead", split at the first arrow. */
	const parts = (lesson: string) => {
		const at = lesson.indexOf('→');
		return at < 0 ? [lesson, ''] : [lesson.slice(0, at).trim(), lesson.slice(at + 1).trim()];
	};
</script>

{#snippet problem(item: string)}
	{#if form?.error && form.item === item}
		<Alert.Root variant="destructive" class="mt-2">
			<CircleAlert />
			<Alert.Description>{form.error}</Alert.Description>
		</Alert.Root>
	{/if}
{/snippet}

<div class="mt-6 max-w-3xl">
	<div class="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
		<span>Session context for {scope}</span>
		<span class="font-mono"
			><span class={context > budget * 0.9 ? 'text-progress' : 'text-foreground'}
				>{context.toLocaleString('en')}</span
			>
			/ {budget.toLocaleString('en')}</span
		>
	</div>
	<Progress
		value={Math.min(context, budget)}
		max={budget}
		class="mt-2"
		aria-label="Session context used"
	/>

	{#if lessons.length}
		<ol class="mt-5 divide-y rounded-xl border bg-card">
			{#each lessons as lesson, i (i)}
				{@const n = i + 1}
				{@const [wrong, instead] = parts(lesson)}
				<li class="flex gap-3 px-4 py-3">
					<span class="w-6 shrink-0 font-mono text-xs leading-6 text-muted-foreground">{n}</span>
					<div class="min-w-0 flex-1">
						{#if editing === n}
							<form method="POST" {action} use:enhance={closeOnSuccess} class="grid gap-2">
								<input type="hidden" name="n" value={n} />
								<Input name="text" value={lesson} aria-label="Learning {n}" />
								<div class="flex flex-wrap items-center gap-2">
									<Button type="submit" size="sm" name="op" value="edit">Save</Button>
									<Button size="sm" variant="ghost" onclick={() => (editing = null)}>Cancel</Button>
									<Button
										type="submit"
										size="sm"
										variant="destructive"
										name="op"
										value="remove"
										class="ml-auto">Remove</Button
									>
								</div>
							</form>
						{:else}
							<p class="leading-6">
								<span class="text-muted-foreground"><Inline text={wrong} /></span>
								{#if instead}<span class="px-1 text-muted-foreground">→</span>
									<Inline text={instead} />{/if}
							</p>
						{/if}
						{@render problem(`learning-${n}`)}
					</div>
					{#if editing !== n}
						<Button
							size="icon-xs"
							variant="ghost"
							class="text-muted-foreground"
							aria-label="Edit learning {n}"
							onclick={() => (editing = n)}><Pencil /></Button
						>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<div class="mt-5 rounded-xl border border-dashed p-6 text-sm">
			<p class="font-medium">No learnings yet</p>
			<p class="mt-1 text-muted-foreground">
				A learning is one line: what went wrong, an arrow, and what to do instead. It goes into
				every session's context from then on.
			</p>
		</div>
	{/if}

	<form
		method="POST"
		{action}
		use:enhance={closeOnSuccess}
		class="mt-5 grid gap-1.5 rounded-xl border bg-card p-4"
	>
		<Label for="new-learning" class="text-xs text-muted-foreground">New learning</Label>
		<div class="flex flex-col gap-2 sm:flex-row">
			<Input
				id="new-learning"
				name="text"
				bind:value={draft}
				placeholder="what went wrong → what to do instead"
				aria-label="New learning"
				aria-describedby="new-learning-count"
			/>
			<Button type="submit" name="op" value="add">Add learning</Button>
		</div>
		<p
			id="new-learning-count"
			class="font-mono text-xs {draft.length > MAX ? 'text-destructive' : 'text-muted-foreground'}"
		>
			{draft.length}/{MAX}{draft && !draft.includes('→') ? ' · needs the → arrow' : ''}
		</p>
		{@render problem('learning-new')}
	</form>
</div>
