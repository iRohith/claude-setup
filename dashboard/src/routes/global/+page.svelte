<script lang="ts">
	import Learnings from '#lib/Learnings.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>wf · global</title></svelte:head>

<h1 class="text-xl font-semibold tracking-tight">Global</h1>
<p class="mt-1 text-sm text-muted-foreground">
	Learnings injected into every project's sessions. Adding or editing one counts against the fullest
	project's budget.
</p>
<Learnings
	lessons={data.lessons}
	context={data.context}
	budget={data.budget}
	scope="the fullest project"
	action="?/learning"
	{form}
/>
