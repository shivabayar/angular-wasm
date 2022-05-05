import * as Protobuf from 'protobufjs/minimal';
import * as Long from 'long';

// Enable Long number (e.g. timestamp in nano seconds) support in protobufjs
Protobuf.util.Long = Long;
Protobuf.configure();

declare var solace: any;

export class Parser {
  // Create solace message from binary string
  // payload: string in bytes
  // return solace.Message
  static solaceMessageFromBinary(topic : any, payload : any, deliverToOne = true) {
    const msg = solace.SolclientFactory.createMessage();
    msg.setDestination(solace.SolclientFactory.createTopic(topic));
    msg.setDeliverToOne(deliverToOne);
    msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
    msg.setBinaryAttachment(payload);
    return msg;
  }

  // Solace expect string with only uint8 values
  static binaryAttachmentFromByteArray(bytes : any) {
    let bin = '';
    for (let i = 0, l = bytes.length; i < l; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return bin;
  }

  // Solace string come with only uint8 values
  // return Array<char>: bytes
  static byteArrayFromBinaryAttachment(attachment : any) {
    const total = attachment.length;
    const ab = new ArrayBuffer(total);
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < total; i++) {
      bytes[i] = attachment.charCodeAt(i);
    }
    return bytes;
  }

  // Parse pb message to solace message attachment
  // pbMessage: pb object
  // pbType: pb object type
  static encodePbToBinaryAttachment(pbMessage : any, pbType : any) {
    try {
      const bytes = pbType.encode(pbMessage).finish();
      return this.binaryAttachmentFromByteArray(bytes);
    } catch (error) {
      throw error;
    }
  }

  // Parse solace message attachment to pb message
  // enable defaults will make default values (null, 0, false) set even they are not in wire
  // enable objects and arrays will make default array: [] and object: {},
  // which will break most existing code check against undefined value
  // see https://github.com/protobufjs/protobuf.js
  static decodeBinaryAttachmentToPb(message : any, pbType : any) {
    try {
      const attachment = message.getBinaryAttachment() || '';
      const bytes = this.byteArrayFromBinaryAttachment(attachment);
      return pbType.toObject(pbType.decode(bytes), {
        longs: String,
        defaults: false,
        oneofs: true,
      });
    } catch (error) {
      throw error;
    }
  }

  static byteArrayToHex(array : any) {
    return array.map((numByte: any) => {
      const hexByte = numByte.toString(16);
      return hexByte.length > 1 ? hexByte : '0' + hexByte;
    }).join('');
  }

  // verify if the payload attributes match the pbType message and
  // create the message
  static createPb(payload : any, pbType : any) {
    const errorMsg = pbType.verify(payload);
    if (errorMsg) {
      throw new Error(errorMsg);
    }
    return pbType.create(payload);
  }
}
