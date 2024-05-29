## Using Trial Accounts in your application


This guide assumes that you have read Trial Accounts' official [documentation](https://docs.keypom.xyz/docs/next/TrialAccounts/introduction) by the [keypom](keypom.xyz) team.

This guide  further expands on how you can use trial accounts in your dApps successfully.

### What do you need?
1. A drop created in the Keypom contract with trial accounts configuration on Near.
2. A service (hosted where ever you like) to distribute keys for this drop. [Find better language here.]
3. A  dApp that has integrated the Keypom Wallet Selector to use trial accounts on this dApp.


---
The way this guide works is that we try to explain all above mentioned steps. How to achieve it manually using single use scripts or near-cli and then explain how different components that we have build makes these steps easy and scalable.(Except the 3 part which is a regular integration.)

1. Before we jump into how to create a trial account drop. You should go through Let's see what they are:
