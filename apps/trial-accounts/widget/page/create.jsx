const wasm = VM.require("jass-build.near/widget/trialAccountWasm");
const contract = "v2.keypom.near";

const parseNearAmount = (nearAmount) => {
  // YoctoNEAR per NEAR (1 NEAR = 10^24 YoctoNEAR)
  //console.log(nearAmount);
  const nearToYocto = new Big("1000000000000000000000000");
  //console.log(nearAmount ? new Big(nearAmount).times(nearToYocto).toFixed() : "0");
  return nearAmount ? new Big(nearAmount).times(nearToYocto).toFixed() : "0";
};

const [callableContracts, setCallableContracts] = useState("");
const [maxAttachableDepositNear, setMaxAttachableDepositNear] = useState("");
const [dropId, setDropId] = useState(null);

const handleCallableContractChange = (e) => {
  setCallableContracts(e.target.value);
  //creare callable method array on the basis of contracts length
  const contracts = e.target.value.split(",").map((item) => item.trim());
  setCallableMethodsArrays(contracts.map(() => ""));
};

const handleMaxAttachableDepositNearChange = (e) => {
  setMaxAttachableDepositNear(e.target.value);
};

//const [maxAttachableYoctoPerContract, setMaxAttachableYoctoPerContract] = useState("1");
//const [callableMethods, setCallableMethods] = useState("");
const [callableMethodsArrays, setCallableMethodsArrays] = useState([]);

const handleCallableMethodsInput = (index, e) => {
  const newCallableMethodsArrays = [...callableMethodsArrays];
  newCallableMethodsArrays[index] = e.target.value;
  setCallableMethodsArrays(newCallableMethodsArrays);
};

const [startingBalance, setStartingBalance] = useState("");
const [trialEndFloor, setTrialEndFloor] = useState("");
const [repayAmount, setRepayAmount] = useState("");

const PARAM_START = "|kP|";
const PARAM_STOP = "|kS|";

const wrapTxnParamsForTrial = (params) => {
  let newParams = {}; // Initialize newParams inside the function
  Object.entries(params).forEach(([k, v]) => {
    if (k === "args" && typeof v !== "string") {
      v = JSON.stringify(v);
    }
    if (Array.isArray(v)) v = v.join();
    newParams[PARAM_START + k] = v + PARAM_STOP;
  });
  return newParams;
};

const DROP_CONFIG = {
  // How many claims can each key have.
  uses_per_key: 1,

  // Should the drop be automatically deleted when all the keys are used? This is defaulted to false and
  // Must be overwritten
  delete_on_empty: true,

  // When this drop is deleted and it is the owner's *last* drop, automatically withdraw their balance.
  auto_withdraw: true,

  // Minimum block timestamp that keys can be used. If None, keys can be used immediately
  // Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
  start_timestamp: null,

  // How often can a key be used
  // Measured in number of non-leap-nanoseconds since January 1, 1970 0:00:00 UTC.
  throttle_timestamp: null,

  // If claim is called, refund the deposit to the owner's balance. If None, default to false.
  on_claim_refund_deposit: null,

  // Can the access key only call the claim method_name? Default to both method_name callable
  claim_permission: null,

  // Root account that all sub-accounts will default to. If None, default to the global drop root.
  drop_root: null,
};

const deployTrialAccount = () => {
  const startingBalanceYocto = parseNearAmount(startingBalance);
  const trialEndFloorYocto = parseNearAmount(trialEndFloor);

  const maxDepositArray = maxAttachableDepositNear.split(", ").map((deposit) => deposit.trim());
  const maxAttachableYoctoPerContract = maxDepositArray.map((deposit) => {
    if (deposit == "*") return "*";
    return parseNearAmount(deposit);
  });

  //Before you pass callableContract, callableMethods and to create_drop
  //You need to add the mapping contract there too.
  // Mapping contract - ('v1.mapping.keypom.near'); ////testnet: 'v1.mapping.keypom.testnet',
  // function - "set"
  // attachableDeposit - "0.002"
  const attachableForMapping = parseNearAmount("0.002"); // put the equivent yocto amount

  // Generate the proper args for setup:
  let actualContracts = callableContracts + ",v1.mapping.keypom.near";

  let actualAmounts = maxAttachableYoctoPerContract.join(",") + "," + attachableForMapping;
  console.log(actualAmounts);

  let transformedMethods = callableMethodsArrays.map((methodArray) => {
    return methodArray.split(", ").map((method) => method.trim());
  });
  //joining different methods from different contracts.
  //And adding "set", for mapping contract
  let actualMethods = transformedMethods.map((method) => method.join(":")).join(",") + ",set";

  //Take the storage cost into consideration for the attached deposit and trial end floor
  const storageCost = parseNearAmount("0.37"); //Deposit for contract state, put in yocto

  const attachedDeposit = new Big(startingBalanceYocto).plus(new Big(storageCost)).toFixed();
  trialEndFloorYocto = new Big(attachedDeposit).minus(new Big(trialEndFloorYocto)).toFixed();

  //take this input
  const repayAmountYocto = parseNearAmount(repayAmount);
  //Repay to drop creator for now.
  const repayTo = context.accountId;

  const fcData = {
    methods: [
      [
        {
          receiver_id: "near",
          method_name: "create_account_advanced",
          attached_deposit: attachedDeposit,
          args: JSON.stringify({
            new_account_id: "INSERT_NEW_ACCOUNT",
            options: {
              contract_bytes: wasm.contract_bytes,
              limited_access_keys: [
                {
                  public_key: "INSERT_TRIAL_PUBLIC_KEY",
                  allowance: "0",
                  receiver_id: "INSERT_NEW_ACCOUNT",
                  method_names: "execute,create_account_and_claim",
                },
              ],
            },
          }),
          user_args_rule: "UserPreferred",
        },
        {
          receiver_id: "",
          method_name: "setup",
          attached_deposit: "0",
          args: JSON.stringify(
            wrapTxnParamsForTrial({
              contracts: actualContracts,
              amounts: actualAmounts,
              methods: actualMethods,
              funder: repayTo,
              repay: repayAmountYocto,
              floor: trialEndFloorYocto,
            })
          ),
          receiver_to_claimer: true,
        },
      ],
    ],
  };

  //to-do Return drop-id to the user.
  // In future create a page to show all current drops of a user and maybe its config as well.
  const drop_id = Date.now().toString();
  setDropId(drop_id);

  const createDropArgs = {
    drop_id: drop_id,
    public_keys: [],
    deposit_per_use: "0", // I don't know was this zero but we take this input from users
    config: DROP_CONFIG,
    //metadata,//unique identifer, don't need it for now I guess.
    required_gas: "150000000000000",
    fc: fcData,
  };

  //TO-DO Deposit how much.
  // Keypom gives a complicated way to  calculate the storage needed for creating a drop.
  // We should implement in the future.
  // For now 0.37 is the cost of storing the wasm and another 0.18 for drop config.
  // Try increasing this if it fails.
  const deposit = parseNearAmount(0.55);
  Near.call(contract, "create_drop", createDropArgs, 100000000000000, deposit);
};

const ContentContainer = styled.div`
  background-color: #ebeaea;
`;

return (
  <>
    <ContentContainer>
      <div className="d-flex overflow-hidden">
        <div className="py-4 flex-1 d-lg-flex justify-content-center h-100 overflow-auto">
          <div className="max-w-lg flex-1 mx-auto px-4 text-secondary">
            <div>
              <h3 className="text-dark display-4 font-weight-semibold">
                Create Trials for your dApps
              </h3>
              <p className="mt-3">Configure your unique trial experience powered by Keypom.</p>
            </div>
            {context.accountId ? (
              <div className="mt-3 pb-lg-5">
                <div className="form-group">
                  <label className="font-weight-medium">Callable Contract</label>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-right`}>
                        Contracts that the Trial Accounts are allowed to access. Comma separated
                        values if more than one contract.
                      </Tooltip>
                    }
                  >
                    <input
                      type="text"
                      placeholder="social.near, bob.near"
                      value={callableContracts}
                      onChange={handleCallableContractChange}
                      className="form-control mt-2"
                    />
                  </OverlayTrigger>
                </div>
                <div className="form-group">
                  <label className="font-weight-medium">Max Attachable Deposit</label>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-right`}>
                        How much maximum deposit Trial Accounts are allowed to attach to function
                        calls.
                      </Tooltip>
                    }
                  >
                    <input
                      type="text"
                      value={maxAttachableDepositNear}
                      onChange={handleMaxAttachableDepositNearChange}
                      placeholder="0.1, 0.2 (comma separated deposit values)"
                      className="form-control mt-2"
                    />
                  </OverlayTrigger>
                </div>
                {callableMethodsArrays.map((methods, index) => (
                  <div key={index} className="form-group">
                    <label className="font-weight-medium">
                      Callable Methods for Contract {index + 1}
                    </label>
                    <OverlayTrigger
                      placement="right"
                      overlay={
                        <Tooltip id={`tooltip-right`}>
                          Define functions for each callable contract that Trial Accounts are
                          allowed to access.
                        </Tooltip>
                      }
                    >
                      <input
                        type="text"
                        value={methods}
                        onChange={(e) => handleCallableMethodsInput(index, e)}
                        placeholder="set,get (comma separated method names)"
                        className="form-control mt-2"
                      />
                    </OverlayTrigger>
                  </div>
                ))}
                <div className="form-group">
                  <label className="font-weight-medium">Starting Balance</label>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-right`}>
                        Starting Balance that you want send to the Trial Accounts. It won't be like
                        a regular airdrop cause they can't use anything other than your dApp.
                      </Tooltip>
                    }
                  >
                    <input
                      type="text"
                      placeholder="0.1"
                      onChange={(e) => setStartingBalance(e.target.value)}
                      className="form-control mt-2"
                    />
                  </OverlayTrigger>
                </div>
                <div className="form-group">
                  <label className="font-weight-medium">Trial End Floor</label>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-right`}>
                        After using this much NEAR, the Trial would be ended and the users will have
                        to make a full/regular account.
                      </Tooltip>
                    }
                  >
                    <input
                      type="text"
                      placeholder="0.01"
                      onChange={(e) => setTrialEndFloor(e.target.value)}
                      className="form-control mt-2"
                    />
                  </OverlayTrigger>
                </div>
                <div className="form-group">
                  <label className="font-weight-medium">Repay Amount</label>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-right`}>
                        Repay amount that the trial accounts have to pay to the funder to get a
                        regular account and also preserve the assets from their trial. Beta feature.
                        Needs better flow.
                      </Tooltip>
                    }
                  >
                    <input
                      type="text"
                      placeholder="0.01"
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="form-control mt-2"
                    />
                  </OverlayTrigger>
                </div>

                <OverlayTrigger
                  // key={placement}
                  placement="right"
                  overlay={
                    <Tooltip id={`tooltip-right`}>
                      Calls the Keypom Contract and creats a Drop. Please save the Drop ID returned
                      below.
                    </Tooltip>
                  }
                >
                  <button
                    onClick={async () => {
                      deployTrialAccount();
                    }}
                    className="btn btn-dark w-100 mt-3"
                  >
                    Create Drop
                  </button>
                </OverlayTrigger>
                {/* <button
                  onClick={async () => {
                    deployTrialAccount();
                  }}
                  className="btn btn-dark w-100 mt-3"
                >
                  Create Drop
                </button> */}
                {dropId && <p>Drop ID: {dropId}</p>}
              </div>
            ) : (
              <h2 className="text-dark display-4 font-weight-semibold">
                Please sign in with your account
              </h2>
            )}
          </div>
        </div>
      </div>
    </ContentContainer>
  </>
);
