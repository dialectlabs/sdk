// Considerations
// 1. Smart message should encapsulate all possible actions, including link and sign transaction - this is needed to be interoperable in different clients
// 2. Multiple actions should be later supported (e.g. both link and sign transaction), based on mockups e.g. https://www.figma.com/file/YMrtyevM6MlWYDZBO2fLb4/Use-Case-Examples?type=design&node-id=1-820&mode=dev
// 3. Single smart message should be produced if multiple actions exist, we should forbid using multiple tx-services in a context of single actionable notif
import { DappMessageActionType, type SmartMessageAction } from '@dialectlabs/sdk/src';
import type { DappMessages } from '../../sdk/src/';
// @ts-ignore

const dappMessages = (1 as DappMessages);
const buyNftSmartMessage: SmartMessageAction = {
  type: DappMessageActionType.SMART_MESSAGE,
  smartMessage: {
    transactionServiceId: 'tensor-nft-buy',
    transactionParams: {
      collectionId: 'foo',
      mintAddress: 'bar',
      owner: 'foo',
      price: 'foo',
      priceWithFeeAndRoyalty: 'foo',
    },
  },

};
const tokenTransferSmartMessage: SmartMessageAction = {
  type: DappMessageActionType.SMART_MESSAGE,
  smartMessage: {
    transactionServiceId: 'tensor-nft-buy',
    transactionParams: {
      collectionId: 'foo',
      mintAddress: 'bar',
      owner: 'foo',
      price: 'foo',
      priceWithFeeAndRoyalty: 'foo',
    },
  },
};
// Examples:
//  1. SENDING SIGN_TRANSACTION ACTIONS, including possible multiple actions
// a) W/O TX_SERVICE_ID NOT ALLOWED
dappMessages.send({
  actionsV3: {
    type: DappMessageActionType.SMART_MESSAGE,
    smartMessage: {
      transactionParams: {
        payer: 'foo',
        payee: 'bar',
        amount: 'foo',
        links: [{
          label: 'foo',
          url: 'foo',
        }],
      },
    },
  },
  message: 'foo',
});
// b) multiple tx services not allowed
dappMessages.send({
  actionsV3: {
    serviceId: 'foo',
    actions: [
      buyNftSmartMessage,
    ],
  },
  message: 'foo',
});
// d) SINGLE TX_SERVICE ID ALLOWED
dappMessages.send({
  actionsV3: buyNftSmartMessage,
  message: 'foo',
});dappMessages.send({
  actionsV3: tokenTransferSmartMessage,
  message: 'foo',
});


// 2. SENDING LINK ACTIONS
// a) MULTIPLE W/O TX_SERVICE_ID ARE  NOT ALLOWED
dappMessages.send({
  actionsV3: {
    actions: [{
      type: DappMessageActionType.LINK,
      label: '',
      url: 'd',
    }, {
      type: DappMessageActionType.LINK,
      label: '',
      url: 'd',
    }],
  },
  message: 'foo',
});// b) SINGLE link ALLOWED
dappMessages.send({
  actionsV3: {
    actions: [{
      type: DappMessageActionType.LINK,
      label: 'foo',
      url: 'foo',
    }],
  },
  message: 'foo',
});


// 3. SENDING MIXED ACTIONS
dappMessages.send({
  actionsV3: {
    actions: [{
      type: DappMessageActionType.LINK,
      label: 'foo',
      url: 'foo',
    }],
  },
  message: 'foo',
});
