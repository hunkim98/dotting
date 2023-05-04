class StackNode<T> {
  data: T;
  next: StackNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export default class Stack<T> {
  private length: number;
  private head: StackNode<T> | null;
  private tail: StackNode<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(data: T): void {
    const node = new StackNode(data);
    if (this.length === 0) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  pop(): T | null {
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

  isEmpty(): boolean {
    return this.length === 0;
  }

  shift(): T | null {
    if (this.length === 0) {
      return null;
    }
    const data = this.tail.data;
    this.tail = this.tail.next;
    this.length--;
    return data;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
}
