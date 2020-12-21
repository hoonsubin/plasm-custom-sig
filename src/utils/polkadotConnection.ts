import * as polkadotUtilCrypto from '@polkadot/util-crypto';
import * as polkadotUtils from '@polkadot/util';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { getEthereumRpc, requestClientSignature } from './ethereumConnection';
import { Keyring } from '@polkadot/keyring';
import * as ethUtil from 'ethereumjs-util';
import * as ethConnections from './ethereumConnection';

/**
 * Plasm network enum
 */
export enum PlasmNetwork {
    Local,
    Dusty,
    Main,
}

export const DEFAULT_NETWORK = PlasmNetwork.Local;

export const NETWORK_PREFIX = 42;

/**
 * generates a Plasm public address with the given ethereum public key
 * @param ethPubKey a 33 bytes compressed ECDSA public key. With or without the 0x prefix
 */
export function ecdsaPubKeyToPlasmAddress(publicKey: string, addressPrefix: number = NETWORK_PREFIX) {
    // adds the 0x prefix if it wasn't added
    publicKey = ethUtil.addHexPrefix(publicKey);

    // check the input
    if (!ethUtil.isValidPublic(ethUtil.toBuffer(publicKey), true)) {
        throw new Error(`${publicKey} is not a valid ECDSA public key`);
    }

    // hash to blake2
    const plasmPubKey = polkadotUtilCrypto.blake2AsU8a(polkadotUtils.hexToU8a(publicKey), 256);
    // encode address
    const plasmAddress = polkadotUtilCrypto.encodeAddress(plasmPubKey, addressPrefix);
    return plasmAddress;
}

export function getSs58PubKeyHex(
    address: string,
    addressType: 'ed25519' | 'sr25519' | 'ecdsa',
    addressPrefix: number = NETWORK_PREFIX,
) {
    const keyRing = new Keyring({ ss58Format: addressPrefix, type: addressType });
    const chainKeyPair = keyRing.addFromAddress(address);
    // returns a compressed public key
    return polkadotUtils.u8aToHex(chainKeyPair.publicKey);
}

/**
 * establishes a connection between the client and the plasm node with the given endpoint.
 * this will default to the main net node
 * @param network end point for the client to connect to
 */
export async function getPlasmInstance(network?: PlasmNetwork) {
    if (window.plasm) return window.plasm;

    const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});
    let endpoint = '';
    switch (network) {
        case PlasmNetwork.Local:
            endpoint = 'ws://127.0.0.1:9944';
            break;
        case PlasmNetwork.Dusty:
            endpoint = 'wss://rpc.dusty.plasmnet.io/';
            break;
        case PlasmNetwork.Main: // main net endpoint will be the default value
        default:
            endpoint = 'wss://rpc.plasmnet.io';
            break;
    }

    const wsProvider = new WsProvider(endpoint, 10 * 1000);

    const api = await ApiPromise.create({
        provider: wsProvider,
        types: {
            ...types,
            // chain-specific overrides
            Address: 'GenericAddress',
            GenericAddress: 'AccountId',
        },
    });

    const polkaApi = await api.isReady;

    if (!window.plasm) window.plasm = polkaApi;

    return polkaApi;
}

export const getTransferCall = async (to: string, amount: string) => {
    const api = await getPlasmInstance(DEFAULT_NETWORK);

    const transaction = api.tx.balances.transfer(to, amount);
    return transaction;
};

export const signCall = async (
    senderSs58: string,
    call: SubmittableExtrinsic<any>,
    signMethod?: (signerAddress: string, message: string) => Promise<string>,
) => {
    const ethAccount = (await getEthereumRpc()).account;
    const api = await getPlasmInstance(DEFAULT_NETWORK);

    // a serialized SCALE-encoded call object
    // we can remove the 0x prefix to sign it as a utf-8 or a hex string
    const encodedCall = polkadotUtils.u8aToHex(call.toU8a());
    // obtain user signature
    const signature = signMethod
        ? await signMethod(ethAccount, encodedCall)
        : await requestClientSignature(ethAccount, encodedCall);

    const ecSig = ethUtil.fromRpcSig(signature);

    if (!ethUtil.isValidSignature(ecSig.v, ecSig.r, ecSig.s)) {
        throw new Error('Invalid signature returned');
    }
    const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(encodedCall));
    const recSs58 = ecdsaPubKeyToPlasmAddress(ethConnections.recoverPublicKey(ecSig, msgHash));

    console.log({
        message: encodedCall,
        messageHash: ethUtil.bufferToHex(msgHash),
        signature,
        senderSs58,
        recoveredSs58: recSs58,
        txCall: JSON.stringify(call.toHuman()),
    });

    const res = await api.tx.ecdsaSignature.call(call, senderSs58, polkadotUtils.hexToU8a(signature)).send();

    return res;
};

export const sendCustomTransfer = async (to: string, from: string, amount: string) => {
    const api = await getPlasmInstance(DEFAULT_NETWORK);

    const transaction = api.tx.balances.transfer(to, amount);
    const txHash = await signCall(from, transaction);
    return txHash;
};
