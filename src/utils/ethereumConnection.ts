import Web3 from 'web3';
import { provider } from 'web3-core';
import * as ethUtil from 'ethereumjs-util';
import ethCrypto from 'eth-crypto';

export const isDappInjected = () => {
    return typeof (window as any).ethereum !== 'undefined';
};

/**
 * Requests the client ethereum provider (i.e. browser extensions) to allow this application to access its RPC
 * and assign the wrapped web3 instance to the window global variable.
 * If the client has granted access, this function will return an existing instance of web3.
 */
export const getEthereumRpc = async (endpoint?: provider) => {
    if (window.ethApi) return window.ethApi;

    if (isDappInjected()) {
        console.log('Dapp browser detected');
        const { ethereum } = window as any;
        // Request account access if needed
        const accountId = (await ethereum.request({ method: 'eth_requestAccounts' }))[0] as string;

        const web3 = new Web3(ethereum);
        const api = {
            web3,
            account: accountId,
        };
        window.ethApi = api;
        // Accounts now exposed
        return api;
    }
    // Fallback to localhost; use dev console port by default...
    else {
        const web3 = new Web3(endpoint || 'http://127.0.0.1:8545');
        const accountId = (await web3.eth.getAccounts())[0];
        console.log('No web3 instance injected, using Local web3.');
        const api = {
            web3,
            account: accountId,
        };
        window.ethApi = api;
        // Accounts now exposed
        return api;
    }
};

export const recoverFromSig = (account: string, msgString: string, signature: ethUtil.ECDSASignature) => {
    const encodingType = ethUtil.isHexPrefixed(msgString) ? 'hex' : 'utf8';
    const msgHash = ethUtil.hashPersonalMessage(Buffer.from(msgString, encodingType));

    if (!ethUtil.isValidSignature(signature.v, signature.r, signature.s)) {
        throw new Error('Invalid signature provided');
    }
    if (!ethUtil.isValidAddress(account)) {
        throw new Error('Invalid address provided');
    }

    const publicKey = ethUtil.ecrecover(msgHash, signature.v, signature.r, signature.s);
    // const compressedPubKey = ethUtil.addHexPrefix(
    //     ethCrypto.publicKey.compress(ethUtil.bufferToHex(uncompressedPubKey)),
    // );

    const recoveredAddress = ethUtil.addHexPrefix(ethUtil.bufferToHex(ethUtil.pubToAddress(publicKey)));

    return {
        isValid: recoveredAddress.toLowerCase() === account.toLowerCase(),
        publicKey: ethUtil.bufferToHex(publicKey),
        recoveredAddress,
    };
};

export const requestClientSignature = async (account: string, message: string) => {
    const { web3 } = await getEthereumRpc();
    //const msgHash = ethereumUtils.hashPersonalMessage(Buffer.from(message, encoding));

    // this uses the 'personal_sign' method to sign data
    const signature = await web3.eth.personal.sign(message, account, '');

    return signature;
};

export const getAccountPubKeyRpc = async (account: string) => {
    const { web3 } = await getEthereumRpc();

    const message = 'Sign in to Plasm network';

    const hash = web3.eth.accounts.hashMessage(message);

    // ask the user to sign the message
    // the password parameter is only used for specific wallets (most wallets will prompt the user to provide it)
    const sig = await web3.eth.personal.sign(message, account, '');

    const res = ethUtil.fromRpcSig(sig);

    if (!recoverFromSig(account, message, res).isValid) {
        throw new Error('Invalid signature');
    }

    return recoverPublicKey(res, ethUtil.toBuffer(hash));
};

export const recoverPublicKey = (signature: ethUtil.ECDSASignature, msgHash: Buffer) => {
    const uncompPubKey = ethUtil.ecrecover(msgHash, signature.v, signature.r, signature.s);

    const compressedPubKey = ethUtil.addHexPrefix(
        ethCrypto.publicKey.compress(ethUtil.stripHexPrefix(ethUtil.bufferToHex(uncompPubKey))),
    );

    if (!ethUtil.isValidPublic(uncompPubKey) || !ethUtil.isValidPublic(ethUtil.toBuffer(compressedPubKey), true)) {
        throw new Error('The signature and the message hash does not match');
    }
    return compressedPubKey;
};
