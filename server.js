require('dotenv').config();
const Web3 = require('web3');
const {Operator} = require('./operator');
const {Leader} = require('./leader');
const {Db} = require('./common/db');

const ethHost = process.env.ETH_HOST || 'localhost';
const ethPort = process.env.ETH_PORT || '8545';
const networkId = process.env.NETWORK_ID || '50';
const pollingInterval = process.env.POLLING_INTERVAL || 1000;
const provider = new Web3.providers.HttpProvider('http://' + ethHost + ':' + ethPort);
const fromBlock = 0; // TODO: Save to disk to resume after shutdown
const multisigAddress = process.env.MULTISIG_ADDRESS || 'enigma12345';
const nbConfirmations = process.env.NB_CONFIRMATIONS || '12';
const user = process.env.OPERATOR_USER;
const db_url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const db = new Db(db_url, 'enigma-swap');
if (user) {
    throw new Error('OPERATOR_USER env variable required');
}

(async () => {
    await db.init();
    if (process.env.ROLE === 'operator') {
        const operator = new Operator(user, multisigAddress, db, provider, networkId, nbConfirmations, fromBlock, pollingInterval);
        await operator.run();
    } else if (process.env.ROLE === 'leader') {
        const leader = new Leader(multisigAddress, db, provider, networkId, fromBlock, pollingInterval);
        await leader.run();
    }
})().catch(async e => {
    await db.teardown();
    console.error('Fatal error', e);
});
