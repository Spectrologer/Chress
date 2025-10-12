/**
 * Animation Scheduler - Handles animation sequences using Promises instead of setTimeout chains
 * Eliminates spaghetti async coupling by providing a clean Promise-based API for animation management
 */
export class AnimationScheduler {
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
    cancelSequence(sequenceId) {
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
    completeSequence(sequenceId) {
        this.activeSequences.delete(sequenceId);
    }
}

/**
 * Animation Sequence - Handles chaining of animation steps with Promise-based flow control
 */
export class AnimationSequence {
    constructor(id, scheduler) {
        this.id = id;
        this.scheduler = scheduler;
        this.steps = [];
        this.cancelled = false;
        this.currentDelay = null;
    }

    /**
     * Add a delay step to the sequence
     * @param {number} ms - Milliseconds to wait
     * @returns {AnimationSequence} This sequence for chaining
     */
    wait(ms) {
        this.steps.push({ type: 'delay', duration: ms });
        return this;
    }

    /**
     * Add a callback execution step
     * @param {Function} callback - Function to execute
     * @returns {AnimationSequence} This sequence for chaining
     */
    then(callback) {
        this.steps.push({ type: 'callback', action: callback });
        return this;
    }

    /**
     * Execute multiple callbacks concurrently
     * @param {Array<Function>} callbacks - Functions to execute simultaneously
     * @returns {AnimationSequence} This sequence for chaining
     */
    concurrent(callbacks) {
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
    conditional(condition, thenBlock, elseBlock = null) {
        this.steps.push({
            type: 'conditional',
            condition,
            thenBlock: thenBlock instanceof AnimationSequence ? thenBlock.steps : [thenBlock],
            elseBlock: elseBlock ? (elseBlock instanceof AnimationSequence ? elseBlock.steps : [elseBlock]) : null
        });
        return this;
    }

    /**
     * Loop a sequence while condition is true
     * @param {Function} condition - Function that returns boolean
     * @param {Function|Array} loopBlock - Action or steps to repeat
     * @returns {AnimationSequence} This sequence for chaining
     */
    loop(condition, loopBlock) {
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
    }

    /**
     * Execute a single step of the sequence
     * @param {number} stepIndex - Index of step to execute
     * @returns {Promise} Promise that resolves when step completes
     */
    async executeStep(stepIndex) {
        if (this.cancelled || stepIndex >= this.steps.length) {
            return;
        }

        const step = this.steps[stepIndex];

        if (step.type === 'delay') {
            if (this.cancelled) return;
            await this.delay(step.duration);
        } else if (step.type === 'callback') {
            if (this.cancelled) return;
            await step.action();
        } else if (step.type === 'concurrent') {
            if (this.cancelled) return;
            await Promise.all(step.actions.map(action => action()));
        } else if (step.type === 'conditional') {
            if (this.cancelled) return;
            const conditionMet = await step.condition();
            const blockToExecute = conditionMet ? step.thenBlock : step.elseBlock;
            if (blockToExecute) {
                for (const subStep of blockToExecute) {
                    if (this.cancelled) return;
                    await this.executeSubStep(subStep);
                }
            }
        } else if (step.type === 'loop') {
            while (await step.condition() && !this.cancelled) {
                for (const subStep of step.loopBlock) {
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
    async executeSubStep(subStep) {
        if (typeof subStep === 'function') {
            await subStep();
        } else if (subStep.type === 'callback') {
            await subStep.action();
        } else if (subStep.type === 'delay') {
            await this.delay(subStep.duration);
        }
    }

    /**
     * Promise-based delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise((resolve, reject) => {
            if (this.cancelled) {
                reject(new Error('Sequence was cancelled'));
                return;
            }

            this.currentDelay = setTimeout(() => {
                this.currentDelay = null;
                if (!this.cancelled) {
                    resolve();
                } else {
                    reject(new Error('Sequence was cancelled'));
                }
            }, ms);
        });
    }

    /**
     * Create a sub-sequence for nested operations
     * @returns {AnimationSequence} New sequence instance
     */
    createSubSequence() {
        return new AnimationSequence(`${this.id}_sub_${Math.random()}`, this.scheduler);
    }
}
