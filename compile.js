const path = require('path');
const fs = require('fs');
const solc = require('solc');

const lotteryPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const rawSourceCode = fs.readFileSync(lotteryPath, 'utf8');

const compileResult = solc.compile(rawSourceCode, 1);

module.exports = (compileResult.contracts[':Lottery']);