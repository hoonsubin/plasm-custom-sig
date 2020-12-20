import * as utils from './..';
import Web3 from 'web3';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import * as testFixtures from './fixtures';
import * as polkadotUtil from '@polkadot/util';
import * as ethUtil from 'ethereumjs-util';
import * as ethCrypto from 'eth-crypto';
import * as ethSigUtil from 'eth-sig-util';

const listAllChainMethods = (plasmApi: ApiPromise) => {
    const allChainPallets = Object.keys(plasmApi.tx);

    const methods = allChainPallets.map((pallet) => {
        return {
            name: pallet,
            methods: Object.keys(plasmApi.tx[pallet]),
        };
    });

    return methods;
};

describe('ECDSA signature recovery and conversion', () => {
    // set the initial values as empty
    let rpcConnection: {
        web3: Web3;
        plasm: ApiPromise;
    } = {
        web3: {} as Web3,
        plasm: {} as ApiPromise,
    };

    let keyring: Keyring;

    beforeAll(async () => {
        // create a .env file in the root of the project with the key ETH_END_POINT and the provider url
        if (!process.env.ETH_END_POINT) throw new Error('Please setup the correct environment variables');

        const web3 = new Web3(process.env.ETH_END_POINT);

        const plasm = await utils.getPlasmInstance(utils.PlasmNetwork.Local);

        rpcConnection = {
            web3,
            plasm,
        };

        const isConnected =
            (await rpcConnection.plasm.isReady).isConnected && !!rpcConnection.web3.eth.accounts.currentProvider;

        if (!isConnected) throw new Error('Cannot connect to the blockchain');
        const addrPref = plasm.registry.chainSS58 || utils.NETWORK_PREFIX;

        keyring = new Keyring({ type: 'sr25519', ss58Format: addrPref });
        console.log('Available chain methods:');
        console.log(listAllChainMethods(plasm));
    }, 1000 * 10);

    it('sign and recover from ethereum', () => {
        const messageHash = ethUtil.hashPersonalMessage(Buffer.from(testFixtures.HUMAN_MSG, 'utf8'));
        //const ethereumAccount = web3.eth.accounts.privateKeyToAccount(testFixtures.ECDSA_PRIV);
        const rpcSig = ethCrypto.sign(testFixtures.ECDSA_PRIV, testFixtures.HUMAN_MSG);
        const sig = ethUtil.fromRpcSig(rpcSig);

        const recoveredPubKey = utils.recoverPublicKey(sig, messageHash);

        expect(recoveredPubKey).toEqual('0x023adb1c91e005bf6142615bab5b5541c7ef29fdc7467196af5678e4a6cc8642ea');
    });

    afterAll(async () => {
        const { plasm } = rpcConnection;
        await plasm.disconnect();
    });
});
