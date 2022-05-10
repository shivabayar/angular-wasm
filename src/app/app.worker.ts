/// <reference lib="webworker" />
import { Parser } from './parser';
import * as root from '../compiled.pb';
const ems = root["gng"].core.pb.ems;

addEventListener('message', ({ data }) => {
  // const response = `worker response to ${data}`;
  // const rust = import('../../wasm/pkg');
  // rust.then(m => postMessage(m.greet(data))).catch(console.error);
  // postMessage(fibo(data));
  const response: any = Parser.decodeBinaryAttachmentToPb(data.message, ems.Fill);
  postMessage(`${response.fillId} + ${response.sourceAppId}`);
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