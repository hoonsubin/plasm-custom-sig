import * as utils from './..';
import Web3 from 'web3';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import * as polkadotUtil from '@polkadot/util';

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

describe('Plasm custom signature tests', () => {
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

        keyring = new Keyring({ type: 'sr25519', ss58Format: 5 });
        console.log('Available chain methods:');
        console.log(listAllChainMethods(plasm));
    }, 1000 * 10);

    it('signs and send from an ECDSA client', async () => {
        expect.assertions(1);
        const { web3, plasm } = rpcConnection;

        const bobEth = web3.eth.accounts.create();

        const alicePlasm = keyring.addFromUri('//Alice', {
            name: 'Alice default',
        });

        // note: bob doesn't have any balance yet
        const bobPlasm = keyring.addFromSeed(polkadotUtil.hexToU8a(bobEth.privateKey), undefined, 'ecdsa');

        const transaction = plasm.tx.balances.transfer(alicePlasm.address, 5000);

        const bobSig = bobEth.sign(transaction.toJSON()).signature;
        console.log({
            message: transaction.toJSON(),
            callObject: transaction.toHuman(),
            signature: bobSig,
        });

        // expect(async () => {
        //     await plasm.tx.ecdsaSignature.call(transaction, bobPlasm.address, bobSig).send();
        // }).toThrow('1010: Invalid Transaction: Transaction has a bad signature');

        try {
            await plasm.tx.ecdsaSignature.call(transaction, bobPlasm.address, bobSig).send();
        } catch (e) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(e.toString()).toMatch('1010: Invalid Transaction: Transaction has a bad signature');
        }
    });

    afterAll(async () => {
        const { plasm } = rpcConnection;
        await plasm.disconnect();
    });
});
