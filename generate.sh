set -e

if [ $# -lt 2 ]; then
  echo "Usage: ./generate.sh <service-name> <network-name>"
  exit 1
fi

service=$1
network=$2

keypairs_dir=/Users/tsmbl/projects/dialect/keypairs
private_key_file="${keypairs_dir}/${service}-${network}-keypair.private"
passphrase_file="${keypairs_dir}/${service}-${network}-keypair.passphrase"
public_key_file="${keypairs_dir}/${service}-${network}-keypair.public"

devnet_rpc_url=https://dialect.devnet.rpcpool.com/ee21d5f582c150119dd6475765b3

yes '' | solana-keygen new --outfile "$private_key_file" > "$passphrase_file"
public_key=$(solana-keygen pubkey "$private_key_file")
echo "$public_key" > "$public_key_file"
[[ $network == "devnet" ]] && solana airdrop 1 "$public_key" -u $devnet_rpc_url
solana balance "$public_key" -u $devnet_rpc_url
