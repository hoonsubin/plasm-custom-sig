import * as polkadotUtilCrypto from '@polkadot/util-crypto';
import * as polkadotUtils from '@polkadot/util';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Call } from '@polkadot/types/interfaces';
import { getEthereumRpc, requestClientSignature, verifySignature } from './ethereumConnection';
import { Keyring } from '@polkadot/keyring';
import * as ethUtil from 'ethereumjs-util';
import ethCrypto from 'eth-crypto';

/**
 * Plasm network enum
 */
export enum PlasmNetwork {
    Local,
    Dusty,
    Main,
}

export const NETWORK_PREFIX = 42;

/**
 * generates a Plasm public address with the given ethereum public key
 * @param ethPubKey an compressed ECDSA public key. With or without the 0x prefix
 */
export function ecdsaPubKeyToPlasmAddress(publicKey: string, addressPrefix: number = NETWORK_PREFIX) {
    // converts a given hex string into Uint8Array
    const toByteArray = (hexString: string) => {
        const result = [];
        for (let i = 0; i < hexString.length; i += 2) {
            result.push(parseInt(hexString.substr(i, 2), 16));
        }
        return new Uint8Array(result);
    };
    // hash to blake2
    const plasmPubKey = polkadotUtilCrypto.blake2AsU8a(toByteArray(publicKey.replace('0x', '')), 256);
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
            Keys: 'SessionKeys4',
            GenericAddress: 'AccountId',
        },
    });

    const polkaApi = await api.isReady;

    if (!window.plasm) window.plasm = polkaApi;

    return polkaApi;
}

export const getTransferCall = async (to: string, amount: string) => {
    const api = await getPlasmInstance(PlasmNetwork.Local);

    const transaction = api.tx.balances.transfer(to, amount);
    return transaction;
};

export const signCall = async (
    senderSs58: string,
    call: Call,
    signMethod?: (signerAddress: string, message: string) => Promise<string>,
) => {
    const ethAccount = (await getEthereumRpc()).account;
    const api = await getPlasmInstance(PlasmNetwork.Local);

    // a serialized SCALE-encoded call object
    // we can remove the 0x prefix to sign it as a utf-8 or a hex string
    const encodedCall = polkadotUtils.u8aToHex(call.toU8a(), undefined, false);

    // obtain user signature
    const signature = signMethod
        ? await signMethod(ethAccount, encodedCall)
        : await requestClientSignature(ethAccount, encodedCall);

    const ecSig = ethUtil.fromRpcSig(signature);
    const msgHash = ethUtil.hashPersonalMessage(Buffer.from(encodedCall, 'hex'));

    if (!ethUtil.isValidSignature(ecSig.v, ecSig.r, ecSig.s)) {
        throw new Error('Invalid signature');
    }

    const uncompressedPubKey = ethUtil.ecrecover(msgHash, ecSig.v, ecSig.r, ecSig.s);
    const recoveredPubKey = ethUtil.addHexPrefix(ethCrypto.publicKey.compress(ethUtil.bufferToHex(uncompressedPubKey)));

    const ss58PublicKey = getSs58PubKeyHex(senderSs58, 'ecdsa');

    console.log({
        signedMessage: encodedCall,
        senderSs58,
        ss58PublicKey,
        recoveredPubKey,
        txCall: JSON.stringify(call.toHuman()),
        signature,
    });

    if (ss58PublicKey !== recoveredPubKey) {
        throw new Error('Invalid signature');
    }

    const res = await api.tx.ecdsaSignature.call(call, senderSs58, polkadotUtils.hexToU8a(signature)).send();

    return res;
};

export const sendCustomTransfer = async (to: string, from: string, amount: string) => {
    const transactionCall = await getTransferCall(to, amount);
    const txHash = await signCall(from, transactionCall as any);
    return txHash;
};
