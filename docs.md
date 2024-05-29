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
