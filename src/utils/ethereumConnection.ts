import Web3 from 'web3';
import * as ethereumUtils from 'ethereumjs-util';
import * as EthCrypto from 'eth-crypto';
import * as EthSigUtil from 'eth-sig-util';

export const isDappInjected = () => {
    return typeof (window as any).ethereum !== 'undefined';
};

/**
 * Requests the client ethereum provider (i.e. browser extensions) to allow this application to access its RPC
 * and assign the wrapped web3 instance to the window global variable.
 * If the client has granted access, this function will return an existing instance of web3.
 */
export const getEthereumRpc = async () => {
    if (window.ethApi) return window.ethApi;
    // Modern dapp browsers...
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
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        const web3 = new Web3(provider);
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

export const requestClientSignature = async (account: string, message: string) => {
    const { web3 } = await getEthereumRpc();

    //const hashedMessage = web3.eth.accounts.hashMessage(message);
    // this uses the 'eth_sign' method to sign data
    const signature = await web3.eth.sign(message, EthSigUtil.normalize(account));
    console.log(signature);
    return signature;
};

export const getAccountPubKey = async (account: string) => {
    const { web3 } = await getEthereumRpc();

    const message = 'Sign in to Plasm network';

    const hash = web3.eth.accounts.hashMessage(message);

    // ask the user to sign the message
    // the password parameter is only used for specific wallets (most wallets will prompt the user to provide it)
    const sig = '0x' + (await web3.eth.personal.sign(message, account, '')).slice(2);

    const res = ethereumUtils.fromRpcSig(sig);

    if (!ethereumUtils.isValidSignature(res.v, res.r, res.s)) {
        throw new Error('Invalid signature');
    }

    const publicKey = ethereumUtils.bufferToHex(
        ethereumUtils.ecrecover(ethereumUtils.toBuffer(hash), res.v, res.r, res.s),
    );

    const compressedPubKey = '0x' + EthCrypto.publicKey.compress(publicKey.replace('0x', ''));

    return compressedPubKey;
};
