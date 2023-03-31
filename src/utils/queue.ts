class QueueNode<T> {
  data: T;
  next: QueueNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export default class Queue<T> {
  private length: number;
  private head: QueueNode<T> | null;
  private tail: QueueNode<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  enqueue(data: T): void {
    const node = new QueueNode(data);
    if (this.length === 0) {
      this.head = node;
    } else {
      this.tail!.next = node;
    }
    this.tail = node;
    this.length++;
  }

  dequeue(): T | null {
    if (this.length === 0) {
      return null;
    }
    const data = this.head.data;
    this.head = this.head.next;
    this.length--;

    return data;
  }

  size(): number {
    return this.length;
  }
}
