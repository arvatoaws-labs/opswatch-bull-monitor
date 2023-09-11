import {zlib} from 'react-zlib-js';
import { promisify } from 'util';


// const zlib = require('react-zlib-js');
// const util = require('util');

const compress_things: boolean = true;

export async function serializeJSON(input: any): Promise<string> {
  if (compress_things) {
    const json_input = JSON.stringify(input);
    const compressed = (
      await promisify(zlib.brotliCompress)(json_input)
    ).toString('base64');
    if (compressed.length < json_input.length) {
      return compressed;
    } else {
      return json_input;
    }
  } else {
    return JSON.stringify(input);
  }
}

async function uncompress(input: string): Promise<any> {
  return JSON.parse(
    await promisify(zlib.brotliDecompress)(Buffer.from(input, 'base64'))
      .toString()
  );
}

async function unserializeJSONfromBuffer(input: Buffer): Promise<any> {
  if ([123, 91].includes(input.at(0)!)) {
    return JSON.parse(input.toString());
  } else {
    return await uncompress(input.toString());
  }
}

async function unserializeJSONfromString(input: string): Promise<any> {
  if (['{', '['].includes(input.at(0)!)) {
    const inputObj = JSON.parse(input.toString());
    if ('type' in inputObj && inputObj.type == 'Buffer') {
      return await unserializeJSONfromBuffer(Buffer.from(inputObj));
    } else {
      return inputObj;
    }
  } else {
    return await uncompress(input);
  }
}

export async function unserializeJSON(input: any): Promise<any> {
  if (!input) {
    return input;
  }
  try {
    if (Buffer.isBuffer(input)) {
      return await unserializeJSONfromBuffer(input);
    } else if (typeof input === 'string') {
      return await unserializeJSONfromString(input);
    } else if (
      typeof input === 'object' &&
      'type' in input &&
      input.type == 'Buffer'
    ) {
      return await unserializeJSONfromBuffer(Buffer.from(input));
    } else {
      return input; // TODO: any case this isn't right?
    }
  } catch (err: any) {
    console.log('DEBUG: unserializeJSON exception', err, input);
    return input; // TODO: differentiate type object, string vs buffer .toString();
  }
}
