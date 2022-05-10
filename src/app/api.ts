import * as root from '../compiled.pb';
import { Parser } from './parser';
import { Injectable } from '@angular/core';

const ems = root["gng"].core.pb.ems;

declare var solace: any;

@Injectable({
  providedIn: 'root'
})
export class Api {
  session: any;
  subscribed = false;

  constructor() {
    var factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);

    let session = solace.SolclientFactory.createSession({
        "url": "http://csqprod-sol01.grass.corp/smf/ignore",
        "password": "test",
        "userName": "js_client",
        "vpnName": "testing",
        "connectTimeoutInMsecs": 30000,
        "readTimeoutInMsecs": 10000,
        "sendBufferMaxSize": 3145728,
        "maxWebPayload": 5242880,
        "bufferedAmountQueryIntervalInMsecs": 100,
        "generateSendTimestamps": false,
        "generateReceiveTimestamps": false,
        "includeSenderId": false,
        "keepAliveIntervalInMsecs": 3000,
        "keepAliveIntervalsLimit": 10,
        "generateSequenceNumber": false,
        "subscriberLocalPriority": 1,
        "subscriberNetworkPriority": 1,
        "ignoreDuplicateSubscriptionError": true,
        "ignoreSubscriptionNotFoundError": true,
        "reapplySubscriptions": true,
        "noLocal": false,
        "transportDowngradeTimeoutInMsecs": 10000,
        "transportContentType": "text/plain"
      },
      new solace.MessageRxCBInfo(this.messageRxCb.bind(this))
    );
    this.session = session;
  }

  ngOnInit() {
    this.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent: any) {
      console.log('=== Successfully connected and ready to subscribe. ===');
    });
    this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent: any) {
      console.log('Connection failed to the message router: ' + sessionEvent.infoStr +
          ' - check correct parameter values and connectivity!');
    });
    this.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent: any) =>{
      console.log('Disconnected.');
      this.subscribed = false;
      if (this.session !== null) {
          this.session.dispose();
          this.session = null;
      }
    });
    this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, (sessionEvent: any) => {
      console.log('Cannot subscribe to topic: ' + sessionEvent.correlationKey);
    });
    this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, (sessionEvent: any) => {
      if (this.subscribed) {
        this.subscribed = false;
        console.log('Successfully unsubscribed from topic: ' + sessionEvent.correlationKey);
      } else {
        this.subscribed = true;
        console.log('Successfully subscribed to topic: ' + sessionEvent.correlationKey);
        console.log('=== Ready to receive messages. ===');
      }
    });

    this.connectToSolace();
    setTimeout(this.subscribe.bind(this, "test_ems/v0/pb/pub/SG/csqstage-ems04.grass.corp/fill_bomber_tool/fill"), 5000);
  }

  private messageRxCb(session: any, message: any) {
    // console.log('========Message received', message.getBinaryAttachment());
    const response: any = Parser.decodeBinaryAttachmentToPb(message, ems.Fill);
    console.log("Response", response);
    //RespMissingFill
  }

  private connectToSolace() {
    try {
      this.session.connect();
    } catch (error) {
      console.error(error);
    }
  }

  async subscribe(topic: string) {
    if (this.session.session !== null) {
      if (this.session.subscribed) {
        this.session.log('Already subscribed to "' + topic
              + '" and ready to receive messages.');
      } else {
        console.log('Subscribing to topic: ' + topic);

        try {
          const solTopic = solace.SolclientFactory.createTopic(topic);
          await this.session.subscribe(
            solTopic,
            true, // generate confirmation when subscription is added successfully
            5, // use topic name as correlation key
            300000 // 30 seconds timeout for this operation
          );
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      console.error('Cannot subscribe because not connected to Solace message router.');
    }
  }

}