export class Observable<T> {
  private observers: Observer[] = [];

  public subscribe(observer: Observer) {
    this.observers.push(observer);
  }

  public unsubscribe(observer: Observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  public notify(data: T) {
    this.observers.forEach(observer => observer.update(data));
  }
}

class Observer {
  public update(data: any) {
    console.log(data);
  }
}
