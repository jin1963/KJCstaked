let web3;
let contract;
let token;
let user;

window.addEventListener("load", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(stakingABI, contractAddress);
    token = new web3.eth.Contract(erc20ABI, tokenAddress);

    document.getElementById("connectWallet").onclick = connectWallet;
    document.getElementById("stakeButton").onclick = stake;
    document.getElementById("claimReward").onclick = claim;
    document.getElementById("unstakeButton").onclick = unstake;
  } else {
    alert("MetaMask or compatible wallet not found.");
  }
});

async function connectWallet() {
  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    user = accounts[0];

    const chainIdHex = await ethereum.request({ method: "eth_chainId" });
    if (parseInt(chainIdHex, 16) !== chainId) {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    }

    document.getElementById("status").innerHTML = `✅ Connected:<br>${user}`;
    loadStake();
  } catch (err) {
    console.error(err);
  }
}

async function stake() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");

  const stakeAmount = web3.utils.toWei(amount, "ether");

  try {
    await token.methods.approve(contractAddress, stakeAmount).send({ from: user });
    await contract.methods.stake(stakeAmount).send({ from: user });
    alert("✅ Staked successfully");
    loadStake();
  } catch (e) {
    console.error("Stake error:", e);
    alert("❌ Staking failed");
  }
}

async function loadStake() {
  try {
    const stake = await contract.methods.stakes(user).call();

    if (stake.amount == 0) {
      document.getElementById("stakeData").innerHTML = "<p>No stake found</p>";
      return;
    }

    const amount = web3.utils.fromWei(stake.amount, "ether");
    const startTime = new Date(stake.startTime * 1000).toLocaleString();
    const nextClaim = new Date((parseInt(stake.lastClaimTime) + 15 * 86400) * 1000).toLocaleString();

    document.getElementById("stakedAmount").innerText = amount;
    document.getElementById("startTime").innerText = startTime;
    document.getElementById("nextClaim").innerText = nextClaim;
  } catch (err) {
    console.error("Load stake failed:", err);
  }
}

async function claim() {
  try {
    await contract.methods.claimReward().send({ from: user });
    alert("✅ Claimed successfully");
    loadStake();
  } catch (err) {
    console.error("Claim failed:", err);
    alert("❌ Claim failed");
  }
}

async function unstake() {
  try {
    await contract.methods.unstake().send({ from: user });
    alert("✅ Unstaked successfully");
    loadStake();
  } catch (err) {
    console.error("Unstake failed:", err);
    alert("❌ Unstake failed");
  }
}
