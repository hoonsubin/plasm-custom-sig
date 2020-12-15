import { ApiPromise } from '@polkadot/api';
import Web3 from 'web3';

export * from './ethereumConnection';
export * from './polkadotConnection';

declare global {
    interface Window {
        plasm?: ApiPromise;
        ethApi?: { web3: Web3; account: string };
    }
}
