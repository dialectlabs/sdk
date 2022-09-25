#!/bin/bash

pushd ../packages

pushd identity-cardinal
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd identity-dialect-dapps
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd identity-sns
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd identity-sns
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd sdk
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd blockchain-sdk-solana
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

pushd blockchain-sdk-aptos
rm -rf node_modules yarn.lock lib
yarn --force
yarn build
yarn link
popd

popd

yarn link "@dialectlabs/identity-sns"; yarn link "@dialectlabs/identity-cardinal"; yarn link "@dialectlabs/identity-dialect-dapps"; yarn link "@dialectlabs/sdk"; yarn link "@dialectlabs/blockchain-sdk-solana"; yarn link "@dialectlabs/blockchain-sdk-aptos"
