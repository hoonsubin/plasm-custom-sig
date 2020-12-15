import * as polkadotUtilCrypto from '@polkadot/util-crypto';
import * as polkadotUtils from '@polkadot/util';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Call } from '@polkadot/types/interfaces';
import { getEthereumRpc, requestClientSignature } from './ethereumConnection';

/**
 * Plasm network enum
 */
export enum PlasmNetwork {
    Local,
    Dusty,
    Main,
}

/**
 * generates a Plasm public address with the given ethereum public key
 * @param ethPubKey an compressed ECDSA public key. With or without the 0x prefix
 */
export function ecdsaPubKeyToPlasmAddress(publicKey: string, addressPrefix: number = 5) {
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

export const signCall = async (senderSs58: string, call: Call) => {
    const { account } = await getEthereumRpc();
    const api = await getPlasmInstance(PlasmNetwork.Local);

    const sig = polkadotUtils.hexToU8a(await requestClientSignature(account, call.toHex()));
    console.log({ txCall: JSON.stringify(call), signature: polkadotUtils.u8aToHex(sig) });
    const res = await api.tx.ecdsaSignature.call(call.toJSON(), senderSs58, sig).send();

    return res;
};

export const sendCustomTransfer = async (to: string, from: string, amount: string) => {
    const transactionCall = await getTransferCall(to, amount);
    const txHash = await signCall(from, transactionCall as any);
    return txHash;
};
