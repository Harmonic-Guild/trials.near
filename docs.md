## Using Trial Accounts in your application


This guide assumes that you have read Trial Accounts' official [documentation](https://docs.keypom.xyz/docs/next/TrialAccounts/introduction) by the [keypom](keypom.xyz) team.

This guide  further expands on how you can use trial accounts in your dApps successfully.

### What do you need?
- A drop created in the Keypom contract with trial accounts configuration on Near.
- A service (hosted where ever you like) to distribute keys for this drop. [Find better language here.]
- A  dApp that has integrated the Keypom Wallet Selector to use trial accounts on this dApp.


---
The way this guide works is that we try to explain all above mentioned steps. How to achieve it manually using use scripts or near-cli and then explain how different components that we have build makes these steps easy and scalable.(Except the 3 part which is a regular integration.)

### Creating a Trial Account Drop on the Keypom contract.

1. To create a Trial Account drop, you need to take a certain number of complex steps. The Keypom SDK however provides you with a simple [createTrialAccountDrop](https://docs.keypom.xyz/docs/next/keypom-sdk/Core/modules#createtrialaccountdrop) function to do all these.
2. We have built a simple [app](https://near.social/harmonic1.near/widget/app?page=create) using bos to achieve this. This reduces the barrier to setup a trial account drop using js scripts.
3. Explain how to use the app below.
4. This app returns you a unique drop_id that you would need in further steps.


### Setting up a simple airdrop service to distribute Trial Accounts

1. In the earlier step, we create an empty drop in the Keypom contract. Meaning it only stores the drop config (in our case trial account config).
2. You can also create key pairs and add public keys to the drop, during the drop creation itself. You would then have to distribute the private keys to these public keys to users yourself.
3. In the past, we have tried this, where we created a drop with 100 keys (for example) and then store the private keys in a database and then distribute using a simple front end. We have seen some classic distributed systems problems here where two users request the DB at the same time and get the same key, one of them claims earlier than the other and then the other one sees "Drop already claimed" error.
4. To overcome this, we came with a system which adds a key to the drop in real time and return the private key to the user in the same request. This saves us from the "Drop already claimed" problem.
5. Our airdrop service, hosts a private key and whenever the `/generate` endpoint is hit:
	- It creates a keypair.
	- Calls the `add_key` function in the Keypom contract with your `drop_id` and the public key just created.
	- Returns users the private key that they can use to claim the drop.
6. Please refer to the Github [repository](https://github.com/Harmonic-Guild/airdrop-service) for the code of the Airdrop service and also for more documentation.


### Integrate Keypom Wallet Selector plugin in your dApp

> We highly recommend you to read the official [documentation](https://docs.keypom.xyz/docs/next/TrialAccounts/Creation/integration#behind-the-scenes) on integrating Keypom selector in your app for enabling use of Trial Accounts. This [Types](https://docs.keypom.xyz/docs/next/keypom-sdk/Selector/welcome#trial-account-specs) documentation is also very helpful.

For your dApp to support login via Trial Accounts you need to integrate keypom wallet selector plugin in your app.
In your `app.js` or the similar file where you are initialising your wallet, add below Keypom plugin as well.

```js
setupKeypom({
  networkId: this.network,
  signInContractId: this.createAccessKeyFor,
  trialAccountSpecs: {
    url: "http://localhost:1234/trial-url#ACCOUNT_ID/SECRET_KEY",
    modalOptions: KEYPOM_OPTIONS
  },
  instantSignInSpecs: {
    url: "http://localhost:1234/instant-url#ACCOUNT_ID/SECRET_KEY/MODULE_ID",
  }
})
```
[See a full example here](https://github.com/keypom/keypom-docs-examples/blob/28444a492c513b8244e25ccaf067ca54f305b090/advanced-tutorials/trial-accounts/guest-book/near-wallet.js#L45-L55).

The way Keypom plugin work is by parsing a trialAccountSpecs.url. For example, when your users visit a URL like `http://localhost:1234/trial-url#v2.keypom.testnet/3HbgYBvVMSfTBpXQ4fSecbPzwup2YkJPipNmT7e2iyw5MfzfMN3rHccsPddWcTGFTehCux7AbmtJiRqd78x4F57g`.

 The Trial Account creator Modal will pop up. It looks like below.

<img width="804" alt="trialAccount" src="https://github.com/Harmonic-Guild/trial-accounts/assets/12672862/98a63fd9-f214-4ca8-b3e8-c0ca0a915811">
