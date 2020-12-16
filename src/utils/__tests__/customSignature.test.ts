import * as utils from './..';
import Web3 from 'web3';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import * as polkadotUtil from '@polkadot/util';
import * as EthUtil from 'ethereumjs-util';
import * as EthCrypto from 'eth-crypto';
import * as EthSigUtil from 'eth-sig-util';

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
        const addrPref = plasm.registry.chainSS58 || utils.NETWORK_PREFIX;

        keyring = new Keyring({ type: 'sr25519', ss58Format: addrPref });
        console.log('Available chain methods:');
        console.log(listAllChainMethods(plasm));
    }, 1000 * 10);

    it('signs and send from an ECDSA client', async () => {
        const ecdsaSeed = '0x7e9c7ad85df5cdc88659f53e06fb2eb9bab3ebc59083a3190eaf2c730332529c';
        const { web3, plasm } = rpcConnection;

        const bobEth = web3.eth.accounts.privateKeyToAccount(ecdsaSeed.replace('0x', ''));

        const alicePlasm = keyring.addFromUri('//Alice', {
            name: 'Alice default',
        });

        // note: bob doesn't have any balance yet
        const bobPlasm = keyring.addFromSeed(polkadotUtil.hexToU8a(ecdsaSeed), undefined, 'ecdsa');

        const transaction = plasm.tx.balances.transfer(alicePlasm.address, 5000);

        //const hashed1 = EthUtil.hashPersonalMessage(EthUtil.toBuffer(transaction.toU8a()));
        //const sig1 = EthUtil.ecsign(hashed1, EthUtil.toBuffer(ecdsaSeed));

        // hash SCALE encoded transaction call
        const hashedMessage = web3.eth.accounts.hashMessage(
            polkadotUtil.u8aToBuffer(transaction.toU8a()).toString('binary'),
        );

        const sig = EthCrypto.sign(ecdsaSeed, hashedMessage);

        const fullSigObject = EthUtil.fromRpcSig(sig);

        console.log('ECDSA signature info:');
        console.log({
            message: hashedMessage,
            callObject: JSON.stringify(transaction.toHuman()),
            signature: sig,
            bobAddress: bobPlasm.address,
            aliceAddress: alicePlasm.address,
        });
        // ensure that the signer is successfully recovered
        expect(bobEth.address).toEqual(EthCrypto.recover(sig, hashedMessage));

        const ecRecovered = utils.recoverPublicKey(fullSigObject, EthUtil.toBuffer(hashedMessage));

        const ecdsaPub = utils.ecdsaPubKeyToPlasmAddress(
            polkadotUtil.u8aToHex(bobPlasm.publicKey),
            utils.NETWORK_PREFIX,
        );
        console.log(`${ecdsaPub}\n${ecRecovered}`);
        //console.log(EthCrypto.publicKeyByPrivateKey(bobEth.privateKey));

        try {
            await plasm.tx.ecdsaSignature.call(transaction, bobPlasm.addressRaw, polkadotUtil.hexToU8a(sig)).send();
        } catch (e) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(e.toString()).toMatch('1010: Invalid Transaction: Transaction has a bad signature');
        }
    });

    it('test buffer environment', () => {
        const stringBuff = Buffer.from('hello');
        expect(stringBuff instanceof Uint8Array).toBeTruthy();
    });

    afterAll(async () => {
        const { plasm } = rpcConnection;
        await plasm.disconnect();
    });
});
