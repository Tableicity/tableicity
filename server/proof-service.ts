import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface OwnershipProofInput {
  shares: number;
  salt: string;
  threshold: number;
  commitment: string;
}

export interface ProofOutput {
  proofHex: string;
  verificationKeyHex: string;
}

let circuitJSON: any = null;

function getCircuit() {
  if (!circuitJSON) {
    const circuitPath = resolve(process.cwd(), 'noir_circuits/ownership_threshold/target/ownership_threshold.json');
    circuitJSON = JSON.parse(readFileSync(circuitPath, 'utf-8'));
  }
  return circuitJSON;
}

let hashCircuitJSON: any = null;

function getHashCircuit() {
  if (!hashCircuitJSON) {
    const hashCircuitPath = resolve(process.cwd(), 'noir_circuits/test_hash/target/test_hash.json');
    hashCircuitJSON = JSON.parse(readFileSync(hashCircuitPath, 'utf-8'));
  }
  return hashCircuitJSON;
}

function toFieldSafeSalt(salt: string): string {
  const raw = salt.startsWith('0x') ? salt.slice(2) : salt;
  const truncated = raw.substring(0, 62);
  return '0x' + truncated;
}

export async function generatePedersenCommitment(shares: number, salt: string): Promise<string> {
  const hashCircuit = getHashCircuit();
  const noir = new Noir(hashCircuit);
  const fieldSalt = toFieldSafeSalt(salt);
  const inputs = {
    shares: shares.toString(),
    salt: fieldSalt,
  };
  const { returnValue } = await noir.execute(inputs);
  return typeof returnValue === 'string' ? returnValue : String(returnValue);
}

export async function generateOwnershipProof(input: OwnershipProofInput): Promise<ProofOutput> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);
  const noir = new Noir(circuit);

  try {
    const saltField = toFieldSafeSalt(input.salt);
    const inputs = {
      shares: input.shares.toString(),
      salt: saltField,
      threshold: input.threshold.toString(),
      commitment: input.commitment,
    };

    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);

    const proofHex = Buffer.from(proof.proof).toString('hex');

    const vk = await backend.getVerificationKey();
    const vkHex = Buffer.from(vk).toString('hex');

    return { proofHex, verificationKeyHex: vkHex };
  } finally {
    await backend.destroy();
  }
}

export async function verifyOwnershipProof(
  proofHex: string,
  vkHex: string,
  publicInputs: string[],
): Promise<boolean> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);

  try {
    const proofBytes = new Uint8Array(Buffer.from(proofHex, 'hex'));
    const proofData = {
      proof: proofBytes,
      publicInputs,
    };

    const isValid = await backend.verifyProof(proofData);
    return isValid;
  } catch (e) {
    console.error('[proof-service] Verification error:', e);
    return false;
  } finally {
    await backend.destroy();
  }
}
