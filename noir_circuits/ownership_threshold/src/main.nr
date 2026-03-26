use std::hash::pedersen_hash;

fn main(
    shares: u64,
    salt: Field,
    threshold: pub u64,
    commitment: pub Field
) {
    let shares_field = shares as Field;
    let computed = pedersen_hash([shares_field, salt]);
    assert(computed == commitment, "Commitment mismatch");
    assert(shares >= threshold, "Below threshold");
}
