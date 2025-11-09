/**
 * Animation Scheduler - Handles animation sequences using Promises with requestAnimationFrame
 * Provides better performance than setTimeout by syncing with browser's repaint cycle
 * Eliminates spaghetti async coupling by providing a clean Promise-based API for animation management
 */
export class AnimationScheduler {
    private activeSequences: Map<number, AnimationSequence>;
    private nextSequenceId: number;

    constructor() {
        this.activeSequences = new Map();
        this.nextSequenceId = 0;
    }

    /**
     * Create a new animation sequence
     * @returns {AnimationSequence} A sequence object with methods for chaining animations
     */
    createSequence() {
        const sequenceId = this.nextSequenceId++;
        const sequence = new AnimationSequence(sequenceId, this);
        this.activeSequences.set(sequenceId, sequence);
        return sequence;
    }

    /**
     * Cancel an active animation sequence
     * @param {number} sequenceId - The ID of the sequence to cancel
     */
    cancelSequence(sequenceId: number): void {
        const sequence = this.activeSequences.get(sequenceId);
        if (sequence) {
            sequence.cancel();
            this.activeSequences.delete(sequenceId);
        }
    }

    /**
     * Clean up completed sequence
     * @param {number} sequenceId - The ID of the completed sequence
     */
    completeSequence(sequenceId: number): void {
        this.activeSequences.delete(sequenceId);
    }
}

/**
 * Animation Sequence - Handles chaining of animation steps with Promise-based flow control
 */
interface AnimationStep {
    type: string;
    duration?: number;
    action?: Function;
    actions?: Function[];
    condition?: () => boolean;
    thenBlock?: (AnimationStep | Function)[];
    elseBlock?: (AnimationStep | Function)[];
    loopBlock?: (AnimationStep | Function)[];
}

export class AnimationSequence {
    private id: number;
    private scheduler: AnimationScheduler;
    private steps: AnimationStep[];
    private cancelled: boolean;
    private currentDelay: NodeJS.Timeout | null;
    private currentRafId: number | null;

    constructor(id: number, scheduler: AnimationScheduler) {
        this.id = id;
        this.scheduler = scheduler;
        this.steps = [];
        this.cancelled = false;
        this.currentDelay = null;
        this.currentRafId = null;
    }

    /**
     * Get the sequence ID
     */
    getId(): number {
        return this.id;
    }

    /**
     * Add a delay step to the sequence
     * @param {number} ms - Milliseconds to wait
     * @returns {AnimationSequence} This sequence for chaining
     */
    wait(ms: number): AnimationSequence {
        this.steps.push({ type: 'delay', duration: ms });
        return this;
    }

    /**
     * Add a callback execution step
     * @param {Function} callback - Function to execute
     * @returns {AnimationSequence} This sequence for chaining
     */
    then(callback: Function): AnimationSequence {
        this.steps.push({ type: 'callback', action: callback });
        return this;
    }

    /**
     * Execute multiple callbacks concurrently
     * @param {Array<Function>} callbacks - Functions to execute simultaneously
     * @returns {AnimationSequence} This sequence for chaining
     */
    concurrent(callbacks: Function[]): AnimationSequence {
        this.steps.push({ type: 'concurrent', actions: callbacks });
        return this;
    }

    /**
     * Add a conditional step
     * @param {Function} condition - Function that returns boolean, if true executes thenBlock
     * @param {Function|AnimationSequence} thenBlock - Action or sequence to execute if condition is true
     * @param {Function|AnimationSequence} elseBlock - Optional action or sequence to execute if condition is false
     * @returns {AnimationSequence} This sequence for chaining
     */
    conditional(condition: () => boolean, thenBlock: Function | AnimationSequence, elseBlock: Function | AnimationSequence | null = null) {
        this.steps.push({
            type: 'conditional',
            condition,
            thenBlock: thenBlock instanceof AnimationSequence ? thenBlock.steps : [thenBlock],
            elseBlock: elseBlock ? (elseBlock instanceof AnimationSequence ? elseBlock.steps : [elseBlock]) : undefined
        });
        return this;
    }

    /**
     * Loop a sequence while condition is true
     * @param {Function} condition - Function that returns boolean
     * @param {Function|Array} loopBlock - Action or steps to repeat
     * @returns {AnimationSequence} This sequence for chaining
     */
    loop(condition: () => boolean, loopBlock: Function | Function[]): AnimationSequence {
        const loopSteps = Array.isArray(loopBlock) ? loopBlock : [loopBlock];
        this.steps.push({ type: 'loop', condition, loopBlock: loopSteps });
        return this;
    }

    /**
     * Start execution of the sequence
     * @returns {Promise} Promise that resolves when sequence completes or rejects if cancelled
     */
    async start() {
        if (this.cancelled) {
            return Promise.reject(new Error('Sequence was cancelled'));
        }

        try {
            await this.executeStep(0);
            this.scheduler.completeSequence(this.id);
            return Promise.resolve();
        } catch (error) {
            this.scheduler.completeSequence(this.id);
            return Promise.reject(error);
        }
    }

    /**
     * Cancel this sequence
     */
    cancel() {
        this.cancelled = true;
        if (this.currentDelay) {
            clearTimeout(this.currentDelay);
            this.currentDelay = null;
        }
        if (this.currentRafId !== null) {
            cancelAnimationFrame(this.currentRafId);
            this.currentRafId = null;
        }
    }

    /**
     * Execute a single step of the sequence
     * @param {number} stepIndex - Index of step to execute
     * @returns {Promise} Promise that resolves when step completes
     */
    async executeStep(stepIndex: number): Promise<void> {
        if (this.cancelled || stepIndex >= this.steps.length) {
            return;
        }

        const step = this.steps[stepIndex];
        if (!step) return;

        if (step.type === 'delay') {
            if (this.cancelled) return;
            await this.delay(step.duration!);
        } else if (step.type === 'callback') {
            if (this.cancelled) return;
            await step.action!();
        } else if (step.type === 'concurrent') {
            if (this.cancelled) return;
            await Promise.all(step.actions!.map(action => action()));
        } else if (step.type === 'conditional') {
            if (this.cancelled) return;
            const conditionMet = await step.condition!();
            const blockToExecute = conditionMet ? step.thenBlock : step.elseBlock;
            if (blockToExecute) {
                for (const subStep of blockToExecute) {
                    if (this.cancelled) return;
                    await this.executeSubStep(subStep);
                }
            }
        } else if (step.type === 'loop') {
            while (await step.condition!() && !this.cancelled) {
                for (const subStep of step.loopBlock!) {
                    if (this.cancelled) return;
                    await this.executeSubStep(subStep);
                }
            }
        }

        // Execute next step
        await this.executeStep(stepIndex + 1);
    }

    /**
     * Execute a sub-step within conditional or loop blocks
     * @param {Object|Function} subStep - Step object or function to execute
     */
    async executeSubStep(subStep: AnimationStep | Function): Promise<void> {
        if (typeof subStep === 'function') {
            await subStep();
        } else if (subStep.type === 'callback') {
            await subStep.action!();
        } else if (subStep.type === 'delay') {
            await this.delay(subStep.duration!);
        }
    }

    /**
     * Promise-based delay using requestAnimationFrame for better performance
     * Falls back to setTimeout for delays > 50ms to avoid excessive RAF calls
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.cancelled) {
                reject(new Error('Sequence was cancelled'));
                return;
            }

            // For very short delays (≤50ms), use RAF for smoother animations
            // For longer delays, use setTimeout to avoid excessive RAF polling
            if (ms <= 50) {
                this.delayWithRAF(ms, resolve, reject);
            } else {
                this.currentDelay = setTimeout(() => {
                    this.currentDelay = null;
                    if (!this.cancelled) {
                        resolve(undefined);
                    } else {
                        reject(new Error('Sequence was cancelled'));
                    }
                }, ms);
            }
        });
    }

    /**
     * Delay using requestAnimationFrame for frame-accurate timing
     * @param {number} ms - Target delay in milliseconds
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     */
    private delayWithRAF(ms: number, resolve: (value: unknown) => void, reject: (reason?: unknown) => void) {
        const startTime = performance.now();
        const targetTime = startTime + ms;

        const tick = (currentTime: number) => {
            if (this.cancelled) {
                this.currentRafId = null;
                reject(new Error('Sequence was cancelled'));
                return;
            }

            if (currentTime >= targetTime) {
                this.currentRafId = null;
                resolve(undefined);
            } else {
                this.currentRafId = requestAnimationFrame(tick);
            }
        };

        this.currentRafId = requestAnimationFrame(tick);
    }

    /**
     * Create a sub-sequence for nested operations
     * @returns {AnimationSequence} New sequence instance
     */
    createSubSequence() {
        return new AnimationSequence(Math.floor(Math.random() * 1000000), this.scheduler);
    }
}
