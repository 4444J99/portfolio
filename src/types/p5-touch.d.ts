import 'p5';

declare module 'p5' {
  interface p5 {
    touchStarted?: () => boolean | void;
  }
}
