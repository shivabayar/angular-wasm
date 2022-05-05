import { Component } from '@angular/core';
import * as root from '../compiled.pb';
import { Parser } from './parser';

const ems = root["gng"].core.pb.ems;
console.log(root);

const SESSION_PROPERITY = {
  requestTimeout: 10000,
  operationTimeout: 30000,
  maxWebPayload: 5242880, // default 1048576 (1MB), change to 5MB
  sendBufferMaxSize: 3145728, // default 65536 (64KB), change to 3MB
};
declare var solace: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-wasm';
  session: any;
  subscribed = false;


  async ngOnInit() {
    await this.initSolace();
    setTimeout(this.initWasmWebworker.bind(this), 0);
  }

  initWasmWebworker() {
    const rust = import('../../wasm/pkg');

    if (typeof Worker !== 'undefined') {
      // Create a new
      const worker = new Worker(new URL('./app.worker', import.meta.url));
      worker.onmessage = ({ data }) => {
        alert(`page got message: ${data}`);
      };
      worker.postMessage(10);
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
      console.error("Web worker not supported in this browser!!!")
    }
  }

  private messageRxCb(session: any, message: any) {
    // console.log('========Message received', message.getBinaryAttachment());
    const response: any = Parser.decodeBinaryAttachmentToPb(message, ems.Fill);
    console.log("Response", response);
    //RespMissingFill
  }

  async initSolace() {
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

    // session.on(solace.SessionEventCode.MESSAGE, (message : any) => {
    //   console.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' + message.dump());
    // });

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
    // define message event listener
    // this.session.on(solace.SessionEventCode.MESSAGE, function (message: any) {
    //   console.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' +
    //       message.dump());
    // });

    this.connectToSolace();
    // setTimeout(this.subscribe.bind(this, "ems/v0/pb/pub/KDH/kdhstage-ems03/bobnxses-tne01/order_notify/FUTURE|XSES-T|NKN22|2207/shivraj.uat.rudy.ne"), 5000);
    // setTimeout(this.subscribe.bind(this, "tutorial/topic"), 5000);
    setTimeout(this.subscribe.bind(this, "test_ems/v0/pb/pub/SG/csqstage-ems04.grass.corp/fill_bomber_tool/fill"), 5000);
  }

  connectToSolace() {
    try {
      this.session.connect();
    } catch (error) {
      console.error(error);
    }
  };

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