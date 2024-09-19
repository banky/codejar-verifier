import { createPublicClient, getContract, http } from "viem";
import { Glob } from "bun";

import { codejarAbi } from "./codejar-abi";
import { mainnet } from "viem/chains";

if (Bun.env.RPC_URL === undefined) {
  throw new Error("RPC_URL is not set");
}

if (Bun.env.ETHERSCAN_API_KEY === undefined) {
  throw new Error("ETHERSCAN_API_KEY is not set");
}

// console.log("Building contract artifacts...");
// const proc = Bun.spawnSync(["forge", "build"], {
//   cwd: "../quark-scripts",
//   env: { ...Bun.env, FOUNDRY_PROFILE: "ir" },
// });
// console.log(proc.stdout.toString());

const fileGlob = new Glob("../quark-scripts/src/*.sol");

const bytecodes: Record<string, string> = {};

for (const file of fileGlob.scanSync(".")) {
  const fileName = file.replace("../quark-scripts/src/", "");

  const outFileGlob = new Glob(`../quark-scripts/out/${fileName}/*.json`);
  for (const outFile of outFileGlob.scanSync(".")) {
    const fileHandle = Bun.file(outFile);
    const contents = await fileHandle.json();

    const bytecode = contents.bytecode.object;
    bytecodes[outFile] = bytecode;
  }
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(Bun.env.RPC_URL),
});

const CODEJAR_ADDRESS = "0x2b68764bcfe9fcd8d5a30a281f141f69b69ae3c8";
const codejar = getContract({
  address: CODEJAR_ADDRESS,
  abi: codejarAbi,
  client: publicClient,
});

for (const [fileName, bytecode] of Object.entries(bytecodes)) {
  const exists = await codejar.read.codeExists([bytecode as `0x${string}`]);
  if (!exists) {
    continue;
  }

  const address = await codejar.read.getCodeAddress([
    bytecode as `0x${string}`,
  ]);
  const verified = await checkVerification(address);
  if (verified) {
    continue;
  }

  let contractName = fileName
    .replace(/\/$/, "")
    .split("/")
    .pop()
    ?.replace(".json", "");

  if (contractName === undefined) {
    continue;
  }

  console.log(`Verifying ${contractName} at ${address}`);

  const proc = Bun.spawnSync(
    ["forge", "verify-contract", address, contractName, "--watch"],
    {
      cwd: "../quark-scripts",
      env: { ...Bun.env, FOUNDRY_PROFILE: "ir" },
    }
  );

  console.log("Success? ", proc.success);
  console.log(proc.stdout.toString());
  console.error(proc.stderr.toString());
}

async function checkVerification(address: string) {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&apikey=${Bun.env.ETHERSCAN_API_KEY}&address=${address}`;
  const response = await fetch(url);
  const data = (await response.json()) as any;
  return data.status === "1";
}
