
const CLAIM_PROOF_OF_FUNDS={
    value: "proof_of_funds",
    text: "Proof of Funds" 
};

const CLAIM_PROOF_OF_MINIMUM_BALANCE={
    value: "proof_of_min",
    text: "Proof of Minimum Balance",
    requirement: {
        coin: "ADA",
        min: 20,
    },
};

const CLAIM_ADDRESS_OWNERSHIP={
    value: "address_ownership",
    text: "Proof of ownership" 
};

const aClaim = [
    CLAIM_PROOF_OF_FUNDS,
    CLAIM_PROOF_OF_MINIMUM_BALANCE,
    CLAIM_ADDRESS_OWNERSHIP
]

const getClaimInFull = (_type) => {
    if(_type==CLAIM_PROOF_OF_FUNDS.value) {return CLAIM_PROOF_OF_FUNDS}
    if(_type==CLAIM_PROOF_OF_MINIMUM_BALANCE.value) {return CLAIM_PROOF_OF_MINIMUM_BALANCE}
    if(_type==CLAIM_ADDRESS_OWNERSHIP.value) {return CLAIM_ADDRESS_OWNERSHIP}
    return null;
}

module.exports = {
    CLAIM_PROOF_OF_FUNDS,
    CLAIM_PROOF_OF_MINIMUM_BALANCE,
    CLAIM_ADDRESS_OWNERSHIP,
    aClaim,
    getClaimInFull
}