type Listener = (count: number) => void;

class LoadingBusImpl {
  private count = 0;
  private listeners = new Set<Listener>();

  getCount() { return this.count; }

  inc() {
    this.count += 1;
    this.emit();
  }

  dec() {
    // guard from going negative
    if (this.count > 0) this.count -= 1;
    this.emit();
  }

  reset() {
    this.count = 0;
    this.emit();
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return { unsubscribe: () => { this.listeners.delete(cb); } };
  }

  private emit() {
    for (const cb of this.listeners) {
      try { cb(this.count); } catch { /* ignore */ }
    }
  }
}

export const LoadingBus = new LoadingBusImpl();
export default LoadingBus;
