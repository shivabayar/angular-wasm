/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const response = `worker response to ${data}`;
  const rust = import('../../wasm/pkg');
  rust.then(m => postMessage(m.greet(data))).catch(console.error);
  // postMessage(fibo(data));
});

// function fibo(n: number): number {
//   if(n <= 0) {
//         return 0;
//   } else if(n === 1) {
//         return 1;
//   } else {
//       return fibo(n-1)  + fibo(n-2);
//   }
// }