const assert = require('assert');
const ganache = require('ganache-cli');
const provider = ganache.provider();

const Web3 = require('web3');
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

let managerAccount;
let nonManagerAccount;


before(async () => {
    accounts = await web3.eth.getAccounts();
    managerAccount = accounts[0];
    nonManagerAccount = accounts[1];

    const lotteryContract = await new web3.eth
        .Contract(JSON.parse(interface))
        .deploy({ data: bytecode });

    lottery = await lotteryContract.send({ from: managerAccount, gas: '1000000' });
});

describe('Lottery Contract', () => {

    it('contract deployed', async () => {
        assert.ok(lottery.options.address);
    });

    it('The manager is whome deploys', async () => {
        const registeredManagerAccount = await lottery.methods.manager().call();
        assert.equal(managerAccount, registeredManagerAccount);
    });

    it('Single account enters to the lottery', async () => {

        const someAccount = accounts[1];

        await lottery.methods
            .enter()
            .send({
                from: someAccount,
                value: web3.utils.toWei('0.02', 'ether') //'10000000000000000'
            });

        const players = await lottery.methods
            .getPlayers()
            .call({ from: someAccount });

        assert.equal(someAccount, players[0]);
        assert.equal(1, players.length);
    });

    it('Multiple accounts enter to the lottery', async () => {
        const someAccount2 = accounts[2];
        const someAccount3 = accounts[3];

        await lottery.methods
            .enter()
            .send({
                from: someAccount2,
                value: web3.utils.toWei('0.02', 'ether')
            });

        await lottery.methods
            .enter()
            .send({
                from: someAccount3,
                value: web3.utils.toWei('0.02', 'ether')
            });

        const players = await lottery.methods
            .getPlayers()
            .call({ from: someAccount2 }); // doesn't matter who calls it

        assert.equal(someAccount2, players[1]);
        assert.equal(someAccount3, players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minimum amount of ether', async () => {
        try {
            await lottery.methods.enter().call({
                from: managerAccount,
                value: 0
            });

            // if no error happened, which is expected, fail the test.
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({ from: nonManagerAccount });
            assert(false);
        } catch (error) {
            assert(error);
            await lottery.methods.pickWinner().send({ from: managerAccount });
        }
    });

    it('Integration Test', async () => {

        await lottery.methods.enter().send({
            from: managerAccount,
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(managerAccount);
        await lottery.methods.pickWinner().send({ from: managerAccount });
        const finalBalance = await web3.eth.getBalance(managerAccount);

        const differenceOfBalance = finalBalance - initialBalance;
        assert(differenceOfBalance > web3.utils.toWei('1.8', 'ether'));

        const playersList = await lottery.methods.getPlayers().call({ from: managerAccount });
        assert.equal(playersList, 0);

        assert.equal(await web3.eth.getBalance(lottery.options.address), 0);
    });
})