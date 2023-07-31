export class Observable<T> {
  private observers: Observer<T>[] = [];

  public subscribe(observer: Observer<T>) {
    this.observers.push(observer);
  }

  public unsubscribe(observer: Observer<T>) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  public notify(data: T) {
    this.observers.forEach(observer => observer.update(data));
  }
}

class Observer<T> {
  private callback: (data: T) => void;
  constructor(callback: (data: T) => void) {
    this.callback = callback;
  }
  public update(data: T) {
    this.callback(data);
  }
}
