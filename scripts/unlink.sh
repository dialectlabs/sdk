#!/bin/bash
yarn unlink "@dialectlabs/identity-sns"; yarn unlink "@dialectlabs/identity-cardinal"; yarn unlink "@dialectlabs/identity-dialect-dapps"; yarn unlink "@dialectlabs/sdk"; yarn unlink "@dialectlabs/blockchain-sdk-solana"; yarn unlink "@dialectlabs/blockchain-sdk-aptos"

pushd ../packages

pushd identity-cardinal
yarn unlink
popd

pushd identity-dialect-dapps
yarn unlink
popd

pushd identity-sns
yarn unlink
popd

pushd identity-sns
yarn unlink
popd

pushd sdk
yarn unlink
popd

pushd blockchain-sdk-solana
yarn unlink
popd

pushd blockchain-sdk-aptos
yarn unlink
popd

popd

