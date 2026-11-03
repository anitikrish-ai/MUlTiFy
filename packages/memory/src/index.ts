/**
 * @mbuf/memory
 * High-performance indexed memory engine with generational validation,
 * version tracking, and zero-allocation slot recycling.
 */

export interface MemoryCellHandle<T = any> {
  readonly id: number; // 32-bit unsigned: (index << 16) | generation
  get(): T;
  peek(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  version(): number;
  dispose(): void;
  isAlive(): boolean;
}

export interface MemoryStats {
  capacity: number;
  allocated: number;
  freeSlots: number;
  totalWrites: number;
}

export class MemoryEngine {
  private capacity: number;
  // Generation counter prevents use-after-free when a slot index is recycled.
  private generations: Uint16Array;
  // Version increments on every valid state mutation.
  private versions: Uint32Array;
  // State values: kept in JS array to hold arbitrary references and primitives.
  private values: any[];
  // Reusable slot indices stack for O(1) recycling without GC.
  private freeIndices: number[] = [];
  private allocatedCount = 0;
  private writeCount = 0;

  // Global hooks for reactive dependency notification
  public onCellRead?: (cellId: number) => void;
  public onCellWritten?: (cellId: number, version: number) => void;

  constructor(initialCapacity = 1024) {
    this.capacity = initialCapacity;
    this.generations = new Uint16Array(initialCapacity);
    this.versions = new Uint32Array(initialCapacity);
    this.values = new Array(initialCapacity);

    for (let i = initialCapacity - 1; i >= 0; i--) {
      this.freeIndices.push(i);
      this.generations[i] = 1; // start generation at 1 so 0 is reserved as invalid
    }
  }

  // Grows capacity when freelist is depleted.
  private grow(): void {
    const oldCapacity = this.capacity;
    const newCapacity = oldCapacity * 2;
    // shortcut: max capacity 65535 due to 16-bit slot packing; upgrade to 64-bit BigInt if >64k cells needed.
    if (newCapacity > 0xffff) {
      throw new Error(`Memory capacity limit exceeded (max 65535 concurrent cells).`);
    }

    const nextGen = new Uint16Array(newCapacity);
    const nextVer = new Uint32Array(newCapacity);
    nextGen.set(this.generations);
    nextVer.set(this.versions);

    this.generations = nextGen;
    this.versions = nextVer;
    this.values.length = newCapacity;
    this.capacity = newCapacity;

    for (let i = newCapacity - 1; i >= oldCapacity; i--) {
      this.freeIndices.push(i);
      this.generations[i] = 1;
    }
  }

  public allocate<T>(initialValue: T): MemoryCellHandle<T> {
    if (this.freeIndices.length === 0) {
      this.grow();
    }

    const index = this.freeIndices.pop()!;
    const gen = this.generations[index];
    // Unsigned 32-bit packing guarantees positive integer IDs
    const cellId = ((index << 16) | (gen & 0xffff)) >>> 0;

    this.values[index] = initialValue;
    this.versions[index] = 1;
    this.allocatedCount++;

    const engine = this;

    return {
      id: cellId,
      get(): T {
        return engine.read<T>(cellId);
      },
      peek(): T {
        return engine.peek<T>(cellId);
      },
      set(val: T): void {
        engine.write<T>(cellId, val);
      },
      update(fn: (prev: T) => T): void {
        const prev = engine.peek<T>(cellId);
        engine.write<T>(cellId, fn(prev));
      },
      version(): number {
        return engine.getVersion(cellId);
      },
      dispose(): void {
        engine.free(cellId);
      },
      isAlive(): boolean {
        return engine.isValid(cellId);
      }
    };
  }

  private unpack(cellId: number): { index: number; generation: number } {
    const index = (cellId >>> 16) & 0xffff;
    const generation = cellId & 0xffff;
    return { index, generation };
  }

  public isValid(cellId: number): boolean {
    const { index, generation } = this.unpack(cellId);
    return index < this.capacity && this.generations[index] === generation && generation !== 0;
  }

  public read<T>(cellId: number): T {
    const { index, generation } = this.unpack(cellId);
    if (index >= this.capacity || this.generations[index] !== generation) {
      throw new Error(`Invalid or stale memory cell read: id=${cellId} (slot=${index})`);
    }

    // Notify dependency system of active read
    if (this.onCellRead) {
      this.onCellRead(cellId);
    }

    return this.values[index];
  }

  /**
   * Reads cell value without triggering dependency tracking.
   */
  public peek<T>(cellId: number): T {
    const { index, generation } = this.unpack(cellId);
    if (index >= this.capacity || this.generations[index] !== generation) {
      throw new Error(`Invalid or stale memory cell peek: id=${cellId} (slot=${index})`);
    }
    return this.values[index];
  }

  public write<T>(cellId: number, nextValue: T): void {
    const { index, generation } = this.unpack(cellId);
    if (index >= this.capacity || this.generations[index] !== generation) {
      throw new Error(`Invalid or stale memory cell write: id=${cellId} (slot=${index})`);
    }

    const prevValue = this.values[index];
    if (Object.is(prevValue, nextValue)) {
      return; // Deduplicate writes with identical value
    }

    this.values[index] = nextValue;
    const nextVer = ++this.versions[index];
    this.writeCount++;

    if (this.onCellWritten) {
      this.onCellWritten(cellId, nextVer);
    }
  }

  public getVersion(cellId: number): number {
    const { index, generation } = this.unpack(cellId);
    if (index >= this.capacity || this.generations[index] !== generation) return 0;
    return this.versions[index];
  }

  public free(cellId: number): void {
    const { index, generation } = this.unpack(cellId);
    if (index >= this.capacity || this.generations[index] !== generation) {
      return; // Already freed or stale handle
    }

    // Clear value reference for garbage collector
    this.values[index] = undefined;
    // Increment generation to invalidate existing handles; avoid 0
    this.generations[index] = ((generation + 1) & 0xffff) || 1;
    this.versions[index] = 0;
    this.freeIndices.push(index);
    this.allocatedCount--;
  }

  public stats(): MemoryStats {
    return {
      capacity: this.capacity,
      allocated: this.allocatedCount,
      freeSlots: this.freeIndices.length,
      totalWrites: this.writeCount
    };
  }
}

// Global default memory engine instance
export const defaultMemoryEngine = new MemoryEngine();

// Convenience shorthand
export function cell<T>(initialValue: T): MemoryCellHandle<T> {
  return defaultMemoryEngine.allocate(initialValue);
}
