import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  GATE 0: NoirJS Integration Test');
  console.log('══════════════════════════════════════════\n');

  const circuitPath = resolve(__dirname, '../noir_circuits/test_hash/target/test_hash.json');
  console.log('Step 1: Loading compiled circuit artifact...');
  const circuitJSON = JSON.parse(readFileSync(circuitPath, 'utf-8'));
  console.log('  ✓ Circuit loaded (bytecode length:', circuitJSON.bytecode?.length, 'chars)');

  console.log('\nStep 2: Initializing Noir + UltraHonkBackend...');
  const backend = new UltraHonkBackend(circuitJSON);
  const noir = new Noir(circuitJSON);
  console.log('  ✓ Backend and Noir initialized');

  console.log('\nStep 3: Generating witness...');
  console.log('  Input: x = 5 (private)');
  console.log('  Circuit computes: pedersen_hash([5])');

  const startWitness = Date.now();
  const { witness, returnValue } = await noir.execute({ x: '5' });
  const witnessMs = Date.now() - startWitness;
  console.log('  ✓ Witness generated in', witnessMs, 'ms');
  console.log('  Return value (hash):', returnValue);

  console.log('\nStep 4: Generating proof...');
  const startProof = Date.now();
  const proof = await backend.generateProof(witness);
  const proofMs = Date.now() - startProof;
  console.log('  ✓ Proof generated in', proofMs, 'ms');
  console.log('  Proof size:', proof.proof.length, 'bytes');

  console.log('\nStep 5: Verifying proof...');
  const startVerify = Date.now();
  const isValid = await backend.verifyProof(proof);
  const verifyMs = Date.now() - startVerify;
  console.log('  ✓ Verification completed in', verifyMs, 'ms');
  console.log('  Result:', isValid ? 'VALID ✅' : 'INVALID ❌');

  await backend.destroy();

  console.log('\n══════════════════════════════════════════');
  if (isValid) {
    console.log('  NoirJS Proof Generation: SUCCESS ✅');
    console.log('══════════════════════════════════════════');
    console.log('\nGate 0 Checklist:');
    console.log('  ✅ nargo compiler installed (v0.36.0)');
    console.log('  ✅ @noir-lang/noir_js installed (v0.36.0)');
    console.log('  ✅ @noir-lang/backend_barretenberg installed (v0.36.0)');
    console.log('  ✅ Test circuit compiled to ACIR artifact');
    console.log('  ✅ NoirJS generated proof from compiled artifact');
    console.log('  ✅ UltraHonkBackend verified proof');
    console.log('\nPerformance:');
    console.log('  Witness generation:', witnessMs, 'ms');
    console.log('  Proof generation:', proofMs, 'ms');
    console.log('  Verification:', verifyMs, 'ms');
  } else {
    console.log('  NoirJS Proof Generation: FAILED ❌');
    console.log('══════════════════════════════════════════');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('FATAL ERROR:', e);
  process.exit(1);
});
