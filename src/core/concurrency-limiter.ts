/**
 * Minimal semaphore-style concurrency limiter. No dependency added — this is
 * small enough that pulling in p-limit for one call site isn't worth it.
 *
 * Usage: const limiter = createConcurrencyLimiter(8); await limiter(() => doWork());
 */
export function createConcurrencyLimiter(maxConcurrent: number) {
	let activeCount = 0;
	const waitingQueue: (() => void)[] = [];

	const runNext = () => {
		if (waitingQueue.length === 0 || activeCount >= maxConcurrent) return;
		activeCount += 1;
		const nextTask = waitingQueue.shift();
		nextTask?.();
	};

	return function runWithLimit<TaskResult>(task: () => Promise<TaskResult>): Promise<TaskResult> {
		return new Promise((resolve, reject) => {
			const executeTask = () => {
				task()
					.then(resolve, reject)
					.finally(() => {
						activeCount -= 1;
						runNext();
					});
			};

			waitingQueue.push(executeTask);
			runNext();
		});
	};
}
