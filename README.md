# Reinventing Voting with Digital Identity, Trust and Anonymity

## Introduction

Current voting apps in the Cardano ecosystem lack Decentralized Identity. By storing data centrally, they put user privacy at risk, and can be exposed to fraud, manipulation, hacks, or data leaks.

Using Atala Prism on Cardano, we will offer an open-source SDK and an App to deliver secure and anonymous voting across the whole Cardano eco-system, replacing private legacy voting apps.

This project is planned to start in August 2024, and be delivered by end July 2025.

## Links to initial proposal 

 - Catalyst F12 proposal : https://cardano.ideascale.com/c/idea/119903

 - Project progression : https://milestones.projectcatalyst.io/projects/1200194


## Milestones

 M1 (30 October 2024)
 
  - 27 minutes explanation video of M1 tasks: https://youtu.be/jJQJONH4pY8

  - Identus specs, tests, and integration
    * Postman test scripts for Identus: https://github.com/incubiq/vote_with_did/blob/main/postman/atPrism.postman_collection.json
    * 30 minutes video of Identus proof of capability: https://www.youtube.com/watch?v=4DyPuZr_3PA&feature=youtu.be
    * Postman test scripts for our Digital Identity Cloud Agent: https://github.com/incubiq/vote_with_did/blob/main/postman/Identity%20Node.postman_collection.json
    * API doc of our Digital Identity Cloud Agent: https://incubiq.gitbook.io/opensourceais/identity-agent-lib 

  - Research work: 
    * dApp vs webApp: https://github.com/incubiq/vote_with_did/blob/main/specs/component%20-%20webapp.txt
    * Anonymous voting: https://github.com/incubiq/vote_with_did/blob/main/research/anonymous%20voting.txt

  - Detailed specs / requirements: 
    * specs overview: https://github.com/incubiq/vote_with_did/blob/main/specs/voting%20with%20DID.pdf
    * system overview: https://github.com/incubiq/vote_with_did/blob/main/specs/_minimal%20version.txt
    * roles: https://github.com/incubiq/vote_with_did/blob/main/specs/roles.txt
    * component Digital Identity Wallet: https://github.com/incubiq/vote_with_did/blob/main/specs/component%20-%20digital%20identity%20wallet.txt
    * component backend: https://github.com/incubiq/vote_with_did/blob/main/specs/component%20-%20backend.txt
    * component dApp: https://github.com/incubiq/vote_with_did/blob/main/specs/component%20-%20dapp.txt
    * component : webApp: https://github.com/incubiq/vote_with_did/blob/main/specs/component%20-%20webapp.txt


 M2 (19 February 2025)

  - 10min explanation video of M2: https://youtu.be/Z-IB0SwvdSg

  - Development work
    * Created a React WebApp which can be run as a browser extension to act as a Digital Identity wallet, with ability to show DIDs and VCs
    * Worked on all APIs to connect to Identus, and hosted Identus (not part of the demo, not part of the srouce code delivered in M2, as it will be delivered during M3, but was necessary to ease the implementation of some features of M2)

  - How to test it
   * cd crypto-wallet-ext
   * to run as a local app: npm run dev
   * to build the webapp (normally not required): npm run build
   * to run as a browser ext
    npm run build:extension
    // then in chrome/brave, 1/ load unpacked (select /dist dir) the first time ; or 2/ refresh the Ext ; then 3/ access the ext in browser
    // debug/dev all in webapp mode, then final test in browser ext mode

    Note: To access DIDs and VCs, the browser extension app requires another backend running in the background, which I have not included in the code here as this is part of M3.

## Support

If you are interested in this project and would like to learn more, help on testing, or give some input on requirements, you are welcome to send email to eric [at] incubiq [dot] com with title [Vote with DID].