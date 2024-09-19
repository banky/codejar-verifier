// https://etherscan.io/address/0x2b68764bcfe9fcd8d5a30a281f141f69b69ae3c8#code
export const codejarAbi = [
  {
    inputs: [{ internalType: "bytes", name: "code", type: "bytes" }],
    name: "codeExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "code", type: "bytes" }],
    name: "getCodeAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "code", type: "bytes" }],
    name: "saveCode",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
