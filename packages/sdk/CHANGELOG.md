# CHANGELOG

## [UNRELEASED]

## [1.4.0] - 2022-11-30

feature: upsert wallet in token provider on new client connection

## [1.3.0] - 2022-11-03

- feat: add to request dapps by blockchainType property
- fix yarn.lock

## [1.2.1] - 2022-11-01

- chore: expose dapp id in sdk api

## [1.2.0] - 2022-10-26

- feature: add api for add/remove members in group threads
- feature: add api for rename group threads
- chore: switch dialect rest api to v2

## [1.1.0] - 2022-10-05

- feature: add read/unread messages api for dapp notification feed

## [1.0.0] - 2022-10-05

- stable release

## [1.0.0-beta.5] - 2022-10-05

- chore: remove platform-dependent postinstall

## [1.0.0-beta.4] - 2022-10-03

- fix: eliminate cyclic dependencies

## [1.0.0-beta.3] - 2022-10-03

- feature: make sdk blockchain agnostic

## [0.13.0] - 2022-09-27

- refactor: aggregate strategy null errors

## [0.12.0] - 2022-09-27

- feature: error models for identities created
 
## [0.11.0] - 2022-09-20

- feature: add website, heroUrl and index fields for dapp model

## [0.10.0] - 2022-09-20

- feature: add health check endpoint

## [0.9.0] - 2022-09-15

- feature: support threads with multiple members

## [0.8.1] - 2022-09-14

- feature: add deduplicationId to messages in order to support optimistic messages

## [0.8.0] - 2022-08-25

- feature: support dapp telegram bot configuration

## [0.7.1] - 2022-08-24

- feature: per-thread unread messages count

## [0.7.0] - 2022-08-24

- feature: configurable token lifetime
- feature: summary across all threads (currently: amount of unread messages)
- feature: add identity providers

## [0.6.5] - 2022-08-15

- fix: recover after signing message/tx failed during authentication
- feature: select channels for broadcast/multicast/unicast

## [0.6.4] - 2022-08-11

- feature: expose token provider in sdk info

## [0.6.3] - 2022-08-10

- fix: circular dep after exposing token provider to public api

## [0.6.2] - 2022-08-10

- feat: expose token provider to public api

## [0.6.1] - 2022-08-10

- fix: rethrow errors from facades if all delegates fail

## [0.6.0] - 2022-08-03

- Add push notifications subscriptions.
- Add avatar url for dapps.

## [0.5.1] - 2022-07-29

- Add basic message read receipts: tracking of last read message time.

## [0.4.10] - 2022-07-20

- Show correct error message for all http calls.

## [0.4.9] - 2022-07-20

- Add notification types configuration for dapps.
- Add notification subscriptions querying and configuration for wallets.
- Add notification subscriptions querying for dapp.

## [0.3.1] - 2022-07-21

- chore: invalidate token storages if data is invalid

## [0.3.0] - 2022-07-16

- Support authentication via transaction. Can be used for wallets which doesn't support message signing

## [0.2.1] - 2022-07-13

- Expose correct address id in wallet dapp addresses.

## [0.2.0] - 2022-06-29

- Start collecting changelog.
- Add dapp API for sending messages to multiple dapp user addresses in a fan-out fashion.
- Fix keys serde for local-storage and session-storage encryption key stores.
