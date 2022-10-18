import { AptosAccount } from 'aptos';

const aptosAccount = new AptosAccount();

console.log('private key: ' + aptosAccount.toPrivateKeyObject().privateKeyHex);
console.log('address: ' + aptosAccount.address());
