
const CLAIM_NONE={
    value: "none",
    text: "None",
    aRequirement: []
};

const CLAIM_PROOF_OF_FUNDS={
    value: "proof_of_funds",
    text: "Proof of Funds",
    aRequirement: [{
        property: "blockchain",
        value: ["Cardano"]
    }, {
        property: "coin",
        value: ["ADA"]
    }]
};

const CLAIM_PROOF_OF_MINIMUM_BALANCE={
    value: "proof_of_min",
    text: "Proof of Minimum Balance",
    aRequirement: [{
        property: "blockchain",
        value: ["Cardano"]
    }, {
        property: "coin",
        value: ["ADA"]
    }, {
        property: "minimum balance",
        value: 20
    }]
};

const CLAIM_ADDRESS_OWNERSHIP={
    value: "address_ownership",
    text: "Proof of ownership",
    aRequirement: [{
        property: "blockchain",
        value: ["Cardano"]
    }]
};

const CLAIM_PROOF_OF_VOTE={
    value: "proof_of_vote",
    text: "Proof of Vote",
    aRequirement: []
};


const aClaim = [
    CLAIM_NONE,
    CLAIM_ADDRESS_OWNERSHIP,
    CLAIM_PROOF_OF_FUNDS,
    CLAIM_PROOF_OF_MINIMUM_BALANCE,
    CLAIM_PROOF_OF_VOTE,
]

const getClaimInFull = (_type) => {
    if(_type==CLAIM_NONE.value) {return CLAIM_NONE}
    if(_type==CLAIM_PROOF_OF_FUNDS.value) {return CLAIM_PROOF_OF_FUNDS}
    if(_type==CLAIM_PROOF_OF_MINIMUM_BALANCE.value) {return CLAIM_PROOF_OF_MINIMUM_BALANCE}
    if(_type==CLAIM_PROOF_OF_VOTE.value) {return CLAIM_PROOF_OF_VOTE}
    if(_type==CLAIM_ADDRESS_OWNERSHIP.value) {return CLAIM_ADDRESS_OWNERSHIP}
    return null;
}

const async_getClaims = async () => {
    return {data: aClaim};
}

module.exports = {
    CLAIM_NONE,
    CLAIM_PROOF_OF_FUNDS,
    CLAIM_PROOF_OF_MINIMUM_BALANCE,
    CLAIM_PROOF_OF_VOTE,
    CLAIM_ADDRESS_OWNERSHIP,
    aClaim,
    getClaimInFull,
    async_getClaims
}