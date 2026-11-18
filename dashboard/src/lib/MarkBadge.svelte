<script lang="ts">
	// An item's state, in the state colours.
	import type { Mark } from 'wf';
	import { Badge } from '#lib/components/ui/badge/index.js';

	let { mark }: { mark: Mark } = $props();

	const MARK = {
		' ': { label: 'open', style: 'bg-open/40 text-muted-foreground' },
		'~': { label: 'in progress', style: 'bg-progress/15 text-progress' },
		x: { label: 'done', style: 'bg-done/15 text-done' }
	} as const;
</script>

<Badge variant="secondary" class={MARK[mark].style}>{MARK[mark].label}</Badge>
