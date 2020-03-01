const {BurnWatcher} = require('../common/burn_watcher');

/**
 * @typedef {Object} Swap
 * @property {string} _id - Database identifier (equal to tx hash)
 * @property {BigNumber} amount - The funds amount in ENG "grains"
 * @property {string} from - The account who locked the funds
 * @property {string} to - The target Cosmos address
 * @property {BigNumber} nonce - The lock nonce
 * @property {string} transactionHash - The transaction hash associated with the receipt
 * @property {string | null} mintTransactionHash - The Enigma Chain mint transaction hash
 * @property {string} unsignedTx - The unsigned transaction encoded in JSON
 * @property {number} status - 0=Unsigned; 1=Signed; 2=Submitted; 3=Confirmed
 */

/**
 * @typedef {Object} AboveThresholdUnsignedSwap
 * @property {string} transactionHash - The transaction hash associated with the receipt
 * @property {string} unsignedTx - The unsigned transaction encoded in JSON
 * @property {number} status - 0=Unsigned; 1=Signed; 2=Submitted; 3=Confirmed
 * @property {Array<string>} signatures - The signatures required to generate a multisig tx
 */

class Leader {
    /**
     * Responsible for populating the database with LogBurn events and submitting multisig messages on chain
     * when all M-of-N operators have signed
     *
     * Prerequisite: A multisig key must be generated offline generated offline:
     * `enigmacli keys add --multisig=name1,name2,name3[...] --multisig-threshold=K new_key_name`
     *
     * @param {string} multisig - The multisig address
     * @param {Db} db
     * @param provider
     * @param networkId
     * @param fromBlock
     * @param pollingInterval
     */
    constructor(multisig, db, provider, networkId, fromBlock = 0, pollingInterval = 30000) {
        this.multisig = multisig;
        this.burnWatcher = new BurnWatcher(provider, networkId, 0, fromBlock, pollingInterval);
        this.db = db;
    }

    async run() {
        for await (let logBurn of this.burnWatcher.watchBurnLog()) {
            try {
                // Generate unsigned tx like this:
                // `gaiacli tx send cosmos1570v2fq3twt0f0x02vhxpuzc9jc4yl30q2qned 1000000uatom \
                //   --from=<multisig_address> \
                //   --generate-only > unsignedTx.json`
                const unsignedTx = '{\"unsigned-tx\": \"dummy\"}';
                /** @type Swap */
                const unsignedSwap = {
                    ...logBurn,
                    _id: logBurn.transactionHash,
                    mintTransactionHash: null,
                    unsignedTx,
                    status: 0,
                };
                console.log('Storing unsigned swap', logBurn);
                await this.db.insertUnsignedSwap(unsignedSwap);
            } catch (e) {
                console.error('Cannot create unsigned tx', logBurn, e);
            }
            // TODO: Sign as the leader
        }
    }
}

module.exports = {Leader};
