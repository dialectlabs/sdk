import { Connection, PublicKey } from '@solana/web3.js';
import { resolveModuleName } from 'typescript';
import { OnsolIdentityResolver } from '../packages/identity-onsol/src';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);
async function runme() {
    const resolver = new OnsolIdentityResolver(connection);
    const owner = new PublicKey(
        '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
    ).toBase58();
    const identity = await resolver.resolve(owner);
    console.log(identity)

    const domainTld = 'miester.poor';
    const identity2 = await resolver.resolveReverse(domainTld);
    console.log(identity2)
}
runme();