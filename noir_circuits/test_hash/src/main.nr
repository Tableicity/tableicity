use std::hash::pedersen_hash;

fn main(shares: u64, salt: Field) -> pub Field {
    let shares_field = shares as Field;
    pedersen_hash([shares_field, salt])
}
