import { generatePedersenCommitment, generateOwnershipProof, verifyOwnershipProof } from '../server/proof-service';
import { randomBytes } from 'crypto';

const SALT = randomBytes(32).toString('hex');

let savedProofHex: string;
let savedVkHex: string;
let savedCommitment: string;
const POSITIVE_SHARES = 10000;
const POSITIVE_THRESHOLD = 5000;

async function testPositiveCase() {
  console.log('=== TEST 1: 10,000 shares, threshold 5,000 → SHOULD PASS ===');

  console.log(`  Computing Pedersen commitment for shares=${POSITIVE_SHARES}, salt=0x${SALT.substring(0, 16)}...`);
  savedCommitment = await generatePedersenCommitment(POSITIVE_SHARES, SALT);
  console.log(`  Pedersen commitment: ${savedCommitment}`);

  console.log(`  Generating proof (shares=${POSITIVE_SHARES} >= threshold=${POSITIVE_THRESHOLD})...`);
  const t0 = Date.now();
  const proofOutput = await generateOwnershipProof({
    shares: POSITIVE_SHARES,
    salt: SALT,
    threshold: POSITIVE_THRESHOLD,
    commitment: savedCommitment,
  });
  const genTime = Date.now() - t0;
  console.log(`  Proof generated in ${genTime}ms`);
  console.log(`  proofHex length: ${proofOutput.proofHex.length}`);
  console.log(`  vkHex length: ${proofOutput.verificationKeyHex.length}`);

  savedProofHex = proofOutput.proofHex;
  savedVkHex = proofOutput.verificationKeyHex;

  console.log('  Verifying proof...');
  const t1 = Date.now();
  const isValid = await verifyOwnershipProof(
    proofOutput.proofHex,
    proofOutput.verificationKeyHex,
    [POSITIVE_THRESHOLD.toString(), savedCommitment],
  );
  const verifyTime = Date.now() - t1;
  console.log(`  Verification result: ${isValid} (${verifyTime}ms)`);

  if (!isValid) {
    console.error('  FAIL: Proof should have verified as TRUE');
    process.exit(1);
  }
  console.log('  PASS: Proof verified successfully\n');
}

async function testNegativeCase() {
  console.log('=== TEST 2: 3,000 shares, threshold 5,000 → SHOULD FAIL (below threshold) ===');
  const shares = 3000;
  const threshold = 5000;

  const commitment = await generatePedersenCommitment(shares, SALT);
  console.log(`  Pedersen commitment: ${commitment}`);

  console.log(`  Generating proof (shares=${shares} < threshold=${threshold}) — expecting constraint failure...`);
  try {
    await generateOwnershipProof({
      shares,
      salt: SALT,
      threshold,
      commitment,
    });
    console.error('  FAIL: Proof generation should have thrown (shares < threshold)');
    process.exit(1);
  } catch (e: any) {
    console.log(`  Caught expected error: ${e.message?.substring(0, 200)}`);
    console.log('  PASS: Circuit correctly rejected proof (shares below threshold)\n');
  }
}

async function testCommitmentMismatch() {
  console.log('=== TEST 3: Wrong commitment → SHOULD FAIL (commitment mismatch) ===');
  const shares = 10000;
  const threshold = 5000;

  const wrongCommitment = await generatePedersenCommitment(9999, SALT);
  console.log(`  Using wrong commitment (for 9999 shares) with actual shares=10000...`);

  try {
    await generateOwnershipProof({
      shares,
      salt: SALT,
      threshold,
      commitment: wrongCommitment,
    });
    console.error('  FAIL: Proof generation should have thrown (commitment mismatch)');
    process.exit(1);
  } catch (e: any) {
    console.log(`  Caught expected error: ${e.message?.substring(0, 200)}`);
    console.log('  PASS: Circuit correctly rejected mismatched commitment\n');
  }
}

async function testTamperedPublicInputs() {
  console.log('=== TEST 4: Valid proof, tampered public inputs → SHOULD FAIL verification ===');

  const fakeCommitment = await generatePedersenCommitment(99999, SALT);
  console.log(`  Verifying saved proof with tampered commitment (different holder's commitment)...`);

  const isValid = await verifyOwnershipProof(
    savedProofHex,
    savedVkHex,
    [POSITIVE_THRESHOLD.toString(), fakeCommitment],
  );

  if (isValid) {
    console.error('  FAIL: Verification should have returned FALSE with tampered public inputs');
    process.exit(1);
  }
  console.log(`  Verification result: ${isValid}`);
  console.log('  PASS: Verifier correctly rejected tampered public inputs\n');
}

async function testTamperedThreshold() {
  console.log('=== TEST 5: Valid proof, tampered threshold → SHOULD FAIL verification ===');

  console.log(`  Verifying saved proof (threshold=5000) with tampered threshold=1...`);

  const isValid = await verifyOwnershipProof(
    savedProofHex,
    savedVkHex,
    ['1', savedCommitment],
  );

  if (isValid) {
    console.error('  FAIL: Verification should have returned FALSE with tampered threshold');
    process.exit(1);
  }
  console.log(`  Verification result: ${isValid}`);
  console.log('  PASS: Verifier correctly rejected tampered threshold\n');
}

async function main() {
  console.log('NOIR Ownership Threshold Circuit — Unit Tests');
  console.log(`Salt (shared): 0x${SALT.substring(0, 16)}...`);
  console.log('');

  await testPositiveCase();
  await testNegativeCase();
  await testCommitmentMismatch();
  await testTamperedPublicInputs();
  await testTamperedThreshold();

  console.log('========================================');
  console.log('ALL 5 TESTS PASSED');
  console.log('========================================');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
