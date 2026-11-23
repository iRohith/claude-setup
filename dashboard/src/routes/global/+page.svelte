<script lang="ts">
	import Learnings from '#lib/Learnings.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>wf · global</title></svelte:head>

<h1 class="text-xl font-semibold tracking-tight">Global</h1>
<p class="mt-1 text-sm text-muted-foreground">
	Learnings injected into every project's sessions. The meter shows the fullest project against your
	session-context limit.
</p>
<Learnings
	lessons={data.lessons}
	context={data.context}
	budget={data.budget}
	limit={data.limit}
	scope="the fullest project"
	action="?/learning"
	{form}
/>
