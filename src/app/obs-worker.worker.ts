import { DoWork, runWorker } from 'observable-webworker';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Parser } from './parser';
import * as root from '../compiled.pb';
const ems = root["gng"].core.pb.ems;

export class ObsWoker implements DoWork<string, string> {

  public work(input$: Observable<string>): Observable<string> {
    const returnMsg = (data) => {
      const response = Parser.decodeBinaryAttachmentToPb(data.message, ems.Fill);
      return `${response.fillId} + ${response.sourceAppId}`;
    };
    return input$.pipe(
      map((data:any) =>  returnMsg(data))
    );
  }

}
runWorker(ObsWoker);