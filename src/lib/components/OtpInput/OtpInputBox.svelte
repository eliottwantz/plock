<script lang="ts">
	type Props = {
		input: null | HTMLInputElement;
		index: number;
		value: string;
		codes: string[];
		inputs: (null | HTMLInputElement)[];
	};
	let {
		input = $bindable(),
		index,
		value = $bindable(),
		codes = $bindable(),
		inputs
	}: Props = $props();
	let num = true;
	let key: string;

	function shiftFocus(key: string) {
		if (
			(!/[0-9]/.test(key) && num && key) ||
			key === 'ArrowRight' ||
			key === 'ArrowLeft' ||
			key === 'Backspace'
		)
			return;
		if (value === ' ') {
			value = '';
			return;
		}
		if (index !== inputs.length - 1) (inputs[index + 1] as HTMLInputElement).focus();
	}

	function keyDownHandler(e: KeyboardEvent) {
		console.log(e);
		if (e.ctrlKey && e.key === 'z') {
			e.preventDefault();
		}
		key = e.key;
		if (value.length >= 1 && !e.ctrlKey) shiftFocus(key);
	}

	function typeHandler(e: KeyboardEvent) {
		console.log(value);
		if (value.length >= 1 || (!/[0-9]/.test(e.key) && num)) {
			e.preventDefault();
		}
	}

	function changeHandler(e: Event) {
		console.log('CHANGE');
		const val = (e.target as HTMLInputElement).value;
		if (/[0-9]/.test(val) || !num || !val) {
			codes = codes.map((c, i) => {
				if (i < index) {
					return c === '' ? ' ' : c;
				} else if (i === index) {
					return val[0];
				}
				return c;
			});
			if (!val) {
				const len = codes.length;
				const filtered = codes.filter((_, i) => i !== index);
				codes = [...filtered, ...Array(len - filtered.length).fill('')];
			}
		}
	}

	function keyUpHandler(e: KeyboardEvent) {
		console.log('KEYUP');
		if (e.key !== 'Backspace') {
			shiftFocus(key);
			return;
		}
		if (index === 0) return;

		inputs[index - 1]?.focus();
	}

	function pasteHandler(e: ClipboardEvent) {
		e.preventDefault();
		const paste = e.clipboardData?.getData('text');
		if (!paste) return;
		let pasteValue = paste.replace(num ? /[^0-9]/g : '', '').slice(0, codes.length - index);
		const newCodes = [
			...codes.slice(0, index),
			...pasteValue.split(''),
			...codes.slice(index + pasteValue.length)
		];
		codes = newCodes;
	}
</script>

<input
	name="code-{index}"
	required
	class="h-10 w-10 border border-r-0 border-foreground/10 text-center first:rounded-l-lg last:rounded-r-lg last:border-r"
	bind:this={input}
	onkeydown={keyDownHandler}
	onkeyup={keyUpHandler}
	onkeypress={typeHandler}
	oninput={changeHandler}
	onpaste={pasteHandler}
	{value}
/>
