<script lang="ts">
	import { LucideDot } from 'lucide-svelte';
	import OtpItem from './OtpInputBox.svelte';

	type Props = {
		disabled: boolean;
		digits: number;
	};
	let { disabled, digits }: Props = $props();

	const numOfInputs: number = digits;
	let value = $state('');

	let codes = $state([
		//	svelte-ignore state_referenced_locally
		...value.slice(0, numOfInputs).split(''),
		//	svelte-ignore state_referenced_locally
		...Array(numOfInputs <= value.length ? 0 : numOfInputs - value.length).fill('')
	]);
	let fullCode = $derived(codes.join(''));
	let inputs: (null | HTMLInputElement)[] = Array(numOfInputs).fill(null);

	$effect(() => {
		codes = [
			...value.slice(0, numOfInputs).split(''),
			...Array(numOfInputs <= value.length ? 0 : numOfInputs - value.length).fill('')
		];
	});
</script>

<div class="flex items-center gap-2">
	<div class="flex items-center">
		{#each Array(numOfInputs / 2) as _, i (i)}
			<OtpItem
				{disabled}
				bind:input={inputs[i]}
				bind:value={codes[i]}
				index={i}
				bind:codes
				{inputs}
			/>
		{/each}
	</div>
	<span>
		<LucideDot class="size-5" />
	</span>
	<div class="flex items-center">
		{#each Array(numOfInputs / 2) as _, i (i)}
			{@const index = i + numOfInputs / 2}
			<OtpItem
				{disabled}
				bind:input={inputs[index]}
				bind:value={codes[index]}
				{index}
				bind:codes
				{inputs}
			/>
		{/each}
	</div>
</div>
