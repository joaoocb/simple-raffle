import {time, loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import {expect} from "chai";
import hre from "hardhat";
import {getAddress, parseGwei} from "viem";

const ONE_DAY_IN_SECS = 24 * 60 * 60;

describe("Raffle", function () {
  async function deployOneDayRaffle() {
    const prize = parseGwei("1");
    const ticketPrice = parseGwei("0.5");
    const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);

    const [owner, user1] = await hre.viem.getWalletClients();

    const raffle = await hre.viem.deployContract("Raffle", [prize, ticketPrice, expirationTimestamp]);

    return {
      raffle,
      owner,
      user1,
      prize,
      ticketPrice,
      expirationTimestamp,
    };
  }

  describe("Deployment", function () {
    it("Should set the right prize", async function () {
      const {raffle, prize} = await loadFixture(deployOneDayRaffle);

      expect(await raffle.read.prize()).to.equal(prize);
    });

    it("Should set the right ticketPrice", async function () {
      const {raffle, ticketPrice} = await loadFixture(deployOneDayRaffle);

      expect(await raffle.read.ticketPrice()).to.equal(ticketPrice);
    });

    it("Should set the right expirationTimestamp", async function () {
      const {raffle, expirationTimestamp} = await loadFixture(deployOneDayRaffle);

      expect(await raffle.read.expirationTimestamp()).to.equal(expirationTimestamp);
    });

    it("Should set the right owner", async function () {
      const {raffle, owner} = await loadFixture(deployOneDayRaffle);

      expect(await raffle.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should fail if expirationTimestamp is not in the future", async function () {
      const latestTime = BigInt(await time.latest());

      const raffle = hre.viem.deployContract("Raffle", [0n, 0n, latestTime]);

      await expect(raffle).to.be.rejectedWith("Expiration timestamp should be in the future");
    });
  });

  describe("Enter Raffle", function () {
    it("Should enter a raffle", async function () {
      const {raffle, user1, ticketPrice} = await loadFixture(deployOneDayRaffle);

      await expect(raffle.write.enterRaffle({account: user1.account, value: ticketPrice})).to.be.fulfilled;
      expect(await raffle.read.ticketsSold()).to.equal(1n);
    });

    it("Should enter a raffle by transferring Ether", async function () {
      const {raffle, user1, ticketPrice} = await loadFixture(deployOneDayRaffle);

      await expect(user1.sendTransaction({to: raffle.address, value: ticketPrice})).to.be.fulfilled;
      expect(await raffle.read.ticketsSold()).to.equal(1n);
    });

    it("Should enter a raffle multiple times", async function () {
      const {raffle, user1, ticketPrice} = await loadFixture(deployOneDayRaffle);

      await expect(raffle.write.enterRaffle({account: user1.account, value: ticketPrice})).to.be.fulfilled;
      await expect(raffle.write.enterRaffle({account: user1.account, value: ticketPrice})).to.be.fulfilled;
      await expect(raffle.write.enterRaffle({account: user1.account, value: ticketPrice})).to.be.fulfilled;
      expect(await raffle.read.ticketsSold()).to.equal(3n);
    });

    it("Should fail when sending an invalid Ether amount", async function () {
      const {raffle, user1} = await loadFixture(deployOneDayRaffle);

      const transaction = raffle.write.enterRaffle({account: user1.account, value: parseGwei("0.005")});

      await expect(transaction).to.be.rejectedWith("Invalid ticket price");
      expect(await raffle.read.ticketsSold()).to.equal(0n);
    });

    it("Should fail when transferring an invalid Ether amount", async function () {
      const {raffle, user1} = await loadFixture(deployOneDayRaffle);

      const transaction = user1.sendTransaction({to: raffle.address, value: parseGwei("0.005")});

      await expect(transaction).to.be.rejectedWith("Invalid ticket price");
      expect(await raffle.read.ticketsSold()).to.equal(0n);
    });


    it("Should fail when entering an expired raffle", async function () {
      const {raffle, user1, ticketPrice} = await loadFixture(deployOneDayRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const transaction = raffle.write.enterRaffle({account: user1.account, value: ticketPrice});

      await expect(transaction).to.be.rejectedWith("Raffle has expired");
      expect(await raffle.read.ticketsSold()).to.equal(0n);
    });
  });

  describe("Pick Winners", function () {
    async function deployFulfilledRaffle() {
      const {raffle, owner, prize, ticketPrice} = await loadFixture(deployOneDayRaffle);

      const [, user1, user2, user3, user4, user5] = await hre.viem.getWalletClients();

      await raffle.write.enterRaffle({account: user1.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user1.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user2.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user2.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user3.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user3.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user4.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user4.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user5.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user5.account, value: ticketPrice})

      return {
        raffle,
        owner,
        user1,
        user2,
        user3,
        user4,
        user5,
        prize,
      };
    }

    async function deployUnfulfilledRaffle() {
      const {raffle, owner, prize, ticketPrice} = await loadFixture(deployOneDayRaffle);

      const [, user1, user2] = await hre.viem.getWalletClients();

      await raffle.write.enterRaffle({account: user1.account, value: ticketPrice})
      await raffle.write.enterRaffle({account: user2.account, value: ticketPrice})

      return {
        raffle,
        owner,
        user1,
        user2,
        prize,
      };
    }

    async function getBalances(addresses: `0x${string}`[]) {
      const publicClient = await hre.viem.getPublicClient();

      const balances = [];
      for (const address of addresses) {
        balances.push(await publicClient.getBalance({address}));
      }

      return balances;
    }

    function validateUserBalances(
      winner: `0x${string}`,
      addresses: `0x${string}`[],
      initialBalances: bigint[],
      finalBalances: bigint[],
      prize: bigint
    ) {
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] === winner) {
          expect(finalBalances[i]).to.equal(initialBalances[i] + prize);
        } else {
          expect(finalBalances[i]).to.equal(initialBalances[i]);
        }
      }
    }

    it("Should pick winner and distribute funds", async function () {
      const {
        raffle,
        user1,
        user2,
        user3,
        user4,
        user5,
        prize
      } = await loadFixture(deployFulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const addresses = [user1, user2, user3, user4, user5].map(user => getAddress(user.account.address));
      const initialBalances = await getBalances(addresses);

      await expect(raffle.write.pickWinner()).to.be.fulfilled;

      const winner = await raffle.read.winner();

      const finalBalances = await getBalances(addresses);
      validateUserBalances(winner, addresses, initialBalances, finalBalances, prize);
    });

    it("Should pick winner even for unfulfilled raffle", async function () {
      const {raffle, user1, user2, prize} = await loadFixture(deployUnfulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const addresses = [user1, user2].map(user => getAddress(user.account.address));
      const initialBalances = await getBalances(addresses);

      await expect(raffle.write.pickWinner()).to.be.fulfilled;

      const winner = await raffle.read.winner();

      const finalBalances = await getBalances(addresses);

      validateUserBalances(winner, addresses, initialBalances, finalBalances, prize);
    });

    it("Should revert if pickWinner is called before the raffle ends", async () => {
      const {raffle} = await loadFixture(deployOneDayRaffle);

      await expect(raffle.write.pickWinner()).to.be.rejectedWith("Raffle has not ended yet");
    });

    it("Should revert if there are no participants", async () => {
      const {raffle} = await loadFixture(deployOneDayRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);
      await expect(raffle.write.pickWinner()).to.be.rejectedWith("No participants in the raffle");
    });

    it("Should run pickWinner only once", async function () {
      const {raffle} = await loadFixture(deployFulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);
      await expect(raffle.write.pickWinner()).to.be.fulfilled;

      await expect(raffle.write.pickWinner()).to.be.rejectedWith("Winner has already been picked");
    });
  });
});
