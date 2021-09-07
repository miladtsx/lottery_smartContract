require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');

const provider = new HDWalletProvider(
    //account responsible to pay
    process.env.YOUR_MNEMONIC,
    // the network
    process.env.ETHEREUM_GATEWAY
)

const web3 = new Web3(provider);

(async () => {

    try {
        const accounts = await web3.eth.getAccounts();
        console.log(`Deploying using ${accounts} account`);

        const contract = await new web3.eth
            .Contract(JSON.parse(interface))
            .deploy({ data: bytecode });

        const newContractInstance = await contract.send({ gas: '1000000', from: accounts[0] });

        console.log('Contract Deployed to ', newContractInstance.options.address);

    } catch (error) {
        console.error(error);
    }
})();