const {BurnWatcher} = require('../common/burn_watcher');

class Operator {
    /**
     * For each LogBurn event on Ethereum, submit signature to Leader
     *
     * @param {Db} db
     * @param {string} user - The Enigma Chain operator key alias
     * @param {string} multisig - The multisig address
     * @param provider
     * @param networkId
     * @param nbConfirmation
     * @param fromBlock
     * @param pollingInterval
     */
    constructor(user, multisig, db, provider, networkId, nbConfirmation = 12,
                fromBlock = 0, pollingInterval = 30000) {
        this.user = user;
        this.multisig = multisig;
        this.burnWatcher = new BurnWatcher(provider, networkId, nbConfirmation, fromBlock, pollingInterval);
        this.db = db;
    }

    async run() {
        for await (let logBurn of this.burnWatcher.watchBurnLog()) {
            console.log('Operator', this.user, 'found LogBurn event', logBurn);
            const {transactionHash} = logBurn;
            let unsignedTx = null;
            try {
                unsignedTx = await this.db.fetchUnsignedTx(transactionHash);
                console.log('Found unsigned tx to sign', unsignedTx);
            } catch (e) {
                // If this happens, skipped LogBurn will have to be re-processed either by resetting fromBlock or manually
                console.error('The operator found a LogBurn event unregistered by the Leader. Is the leader running.')
            }
            if (unsignedTx) {
                try {
                    // Sign unsigned tx like this:
                    // gaiacli tx sign \
                    //   unsignedTx.json \
                    //   --multisig=<multisig_address> \
                    //   --from=p1 \
                    //   --output-document=p1signature.json
                    // TODO: This is a mock but the actual signature should be unique as well
                    const signature = `{\"signature\": \"${this.user}${transactionHash}\"}`;
                    await this.db.insertSignature(this.user, transactionHash, signature);
                } catch (e) {
                    console.error('Cannot sign unsigned tx', unsignedTx, logBurn, e);
                }
            }
        }
    }
}

module.exports = {Operator};
