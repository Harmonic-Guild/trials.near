
## Using Trial Accounts in your application


This guide assumes that you have read Trial Accounts' official [documentation](https://docs.keypom.xyz/docs/next/TrialAccounts/introduction) by the [keypom](keypom.xyz) team.

This page is rendered from the Github Doc [here](https://github.com/Harmonic-Guild/trials.near/blob/main/docs.md). Sometimes this page does not render all element accurately, so you can refer to Github directly.

This guide further expands on how you can use trial accounts in your dApps successfully.

### What do you need?
- A drop created in the Keypom contract with trial accounts configuration on Near.
- An airdrop service to distribute the keys for this drop. You could use the service headless or could integrate it in your UI, where your app calls the airdrop service.
- A  dApp that has integrated the Keypom Wallet Selector to enable the use of trial accounts.


---
The way this guide works is that we try to explain all above mentioned steps. How to achieve them manually using JS scripts or near-cli and then explain how different components that we have build makes these steps easy and scalable.

### Creating a Trial Account Drop on the Keypom contract.

1. To create a Trial Account drop, you need to take a certain number of complex steps. Although the Keypom SDK provides you with a [createTrialAccountDrop](https://docs.keypom.xyz/docs/next/keypom-sdk/Core/modules#createtrialaccountdrop) function to do all this, you would need to execute the JS script on your system.
2. To make it easier, we have built a simple [app](https://near.social/harmonic1.near/widget/app?page=create) using bos to achieve this. This reduces the barrier to setup a JS environment to create trial account drops.
3. This app returns you a unique `drop_id` that you would need in further steps.

#### How to use the Create app.

1. Create App helps you create a trial account drop. This drop is essentially calling the Keypom Contract with trial account config. Trial Accounts are powered by a very small no-std smart contract. While creating a trial account drop you need to attach the wasm for this contract. The Create App simplifies this with an easy to use UI.
2. Different fields:
    - `Callable Contracts`: Input comma separated smart contract addresses that you want your Trial Account to have access to. You can input multiple addresses.
		Example - `social.near, mintbase1.near`
	- `Max Attachable Deposit`: Input comma separated values for Deposit in NEAR that your Trial Accounts can use while calling your allowed Contracts.
	- `Callable Methods`: For every comma separated values you put for Callable Contracts, you will get an Input field for defining the methods your Trial Account can access. Write the methods you want in a comma separated manner.  You can also put '*' if you want to access all methods.
	- `Starting Balance` : This is the amount of NEAR you want the Trial Account to have when the Trial starts.
	- `Trial End Floor` :  Once the Trial Account has spent more than this amount (in $NEAR), the trial is over and the exit conditions must be met.
	- `Repay Amount` : How much $NEAR should be paid back to the funder in order to unlock the trial account. This feature still needs a better flow. How should trial accounts buy NEAR to pay back the funder? We do not recommend using it at the moment.

3. When you click on Create Drop, you will be asked to sign the transaction that calls the Keypom contract. This will also show you the unique `drop_id` of your drop. You can also access the drop_id from the explorer.
	Keep the drop_id with you as would need it to distribute airdrops using it later.


### Setting up a simple airdrop service to distribute Trial Accounts

1. In the earlier step, we create an empty drop in the Keypom contract. Meaning it only stores the drop config (in our case trial account config).
2. You can also create key pairs and add public keys to the drop, during the drop creation itself. You would then have to distribute the private keys to these public keys to users yourself.
3. In the past, we have tried this, where we created a drop with 100 keys (for example) and then store the private keys in a database and then distribute using a simple front end. We have seen some classic distributed systems problems here where two users request the DB at the same time and get the same key, one of them claims earlier than the other and then the other one sees "Drop already claimed" error.
4. To overcome this, we came up with a system which adds a key to the drop in real time and return the private key to the user in the same request. This saves us from the "Drop already claimed" problem.
5. Our airdrop service, hosts a private key and whenever the `/generate` endpoint is hit:
	- It creates a new keypair.
	- Calls the `add_key` function in the Keypom contract with your `drop_id`(the drop_id returned from the Create App) and the public key just created.
	- Returns the private key that they can be used to claim the drop.
6. Please refer to the Github [repository](https://github.com/Harmonic-Guild/airdrop-service) for the code of the Airdrop service and also for more documentation.


### Integrate Keypom Wallet Selector plugin in your dApp

> We highly recommend you read the official [documentation](https://docs.keypom.xyz/docs/next/TrialAccounts/Creation/integration#behind-the-scenes) on integrating Keypom selector in your app for enabling use of Trial Accounts. This [Types](https://docs.keypom.xyz/docs/next/keypom-sdk/Selector/welcome#trial-account-specs) documentation is also very helpful.

For your dApp to support login via Trial Accounts, you need to integrate keypom wallet selector plugin in your app.
In your `app.js` or the similar file where you are initializing your wallet, add below Keypom plugin as well.

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

The way the Keypom plugin work is by parsing a trialAccountSpecs.url. For example, when your users visit a URL like `http://localhost:1234/trial-url#v2.keypom.testnet/3HbgYBvVMSfTBpXQ4fSecbPzwup2YkJPipNmT7e2iyw5MfzfMN3rHccsPddWcTGFTehCux7AbmtJiRqd78x4F57g`.

 The Trial Account creator Modal will pop up. It looks like [this](https://github.com/Harmonic-Guild/trial-accounts/assets/12672862/98a63fd9-f214-4ca8-b3e8-c0ca0a915811).

 Now you can user create a Near Account and they get instantly logged in.
