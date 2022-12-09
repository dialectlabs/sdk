import { Chain, Common, Hardfork } from '@ethereumjs/common';
import Web3 from 'web3';
function main() {
  const provider =
    'https://warmhearted-alpha-patron.matic-testnet.discover.quiknode.pro/ca3268ba2e63612c716e28bb71cc502b47e1f623/';
  const web3Provider = new Web3.providers.HttpProvider(provider);
  const web3 = new Web3(web3Provider);
  web3.eth.getBlockNumber().then((result) => {
    console.log('Latest Ethereum Block is ', result);
  });

  const wallet = web3.eth.accounts.create();
  console.log(wallet);
}

main();
