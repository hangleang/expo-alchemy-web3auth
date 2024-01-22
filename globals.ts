export interface Global {
  __dirname: any;
  __filename: any;
  btoa: any;
  atob: any;
  self: any;
  Buffer: any;
  process: any;
  location: any;
}

declare var global: Global;
if (typeof global.self === "undefined") {
  global.self = global;
}

if (typeof __dirname === "undefined") {
  global.__dirname = "/";
}
if (typeof __filename === "undefined") {
  global.__filename = "";
}

if (typeof process === "undefined") {
  global.process = require("process");
} else {
  const bProcess = require("process");
  for (var p in bProcess) {
    if (!(p in process)) {
      global.process[p] = bProcess[p];
    }
  }
}

global.process.browser = false;
if (typeof Buffer === "undefined") {
  global.Buffer = require("buffer").Buffer;
}

global.atob = function atob(str: string) {
  return global.Buffer.from(str, "base64").toString("binary");
};
global.btoa = function btoa(str: string) {
  return global.Buffer.from(str, "binary").toString("base64");
};

// Needed so that 'stream-http' chooses the right default protocol.
global.location = {
  protocol: "file:",
};

// global.process.version = "v16.0.0";
// if (!global.process.version) {
//   global.process = require("process");
//   console.log({ process: global.process });
// }
// process.browser = true;

// for uuid (& web3 if you plan to use it)
import "react-native-get-random-values";
import "@ethersproject/shims";

import "fastestsmallesttextencoderdecoder";
import "crypto";
