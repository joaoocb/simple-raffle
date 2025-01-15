import {time, loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import {expect} from "chai";
import hre from "hardhat";
import {getAddress, parseGwei, zeroAddress} from "viem";

const ONE_DAY_IN_SECS = 24 * 60 * 60;

describe("SimpleRaffle", function () {
  async function deployRaffle() {
    const [owner, user1] = await hre.viem.getWalletClients();

    const raffleContract = await hre.viem.deployContract("SimpleRaffle", []);

    return {
      raffleContract,
      owner,
      user1,
    };
  }

  async function createRaffle() {
    const {raffleContract, owner, user1} = await loadFixture(deployRaffle);

    const prize = parseGwei("1");
    const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
    const ticketPrice = parseGwei("0.25");

    const raffleId = (await raffleContract.simulate.createRaffle([prize, expirationTimestamp, ticketPrice])).result;

    const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice]);
    await expect(transaction).to.be.fulfilled;

    return {
      raffleContract,
      owner,
      user1,
      prize,
      expirationTimestamp,
      ticketPrice,
      raffleId,
    };
  }

  async function enterRaffle() {
    const {raffleContract, user1, ticketPrice, raffleId} = await loadFixture(createRaffle);

    const ticketId = (await raffleContract.simulate.enterRaffle([raffleId], {value: ticketPrice})).result;

    const transaction = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice});
    await expect(transaction).to.be.fulfilled;

    return {
      raffleContract,
      raffleId,
      ticketId,
    };
  }

  async function getFulfilledRaffle() {
    const {raffleContract, owner, user1, prize, ticketPrice, raffleId} = await loadFixture(createRaffle);

    const [, , user2, user3, user4, user5] = await hre.viem.getWalletClients();

    await raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user3.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user3.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user4.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user4.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user5.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user5.account, value: ticketPrice})

    return {
      raffleContract,
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      prize,
      raffleId,
    };
  }

  async function getUnfulfilledRaffle() {
    const {raffleContract, owner, user1, ticketPrice, raffleId} = await loadFixture(createRaffle);

    const [, , user2] = await hre.viem.getWalletClients();

    await raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice})
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account, value: ticketPrice})

    return {
      raffleContract,
      owner,
      user1,
      user2,
      raffleId,
    };
  }

  describe("Deployment", function () {
    it("Should revert when receiving any Ether amount", async function () {
      const {raffleContract, user1} = await loadFixture(deployRaffle);

      const transaction = user1.sendTransaction({to: raffleContract.address, value: parseGwei("0.005")});
      await expect(transaction).to.be.rejected;
    });
  });

  describe("Raffle Creation", function () {
    it("Should create a raffle with correct parameters", async function () {
      const {
        raffleContract,
        owner,
        prize,
        expirationTimestamp,
        ticketPrice,
        raffleId
      } = await loadFixture(createRaffle);

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[0]).to.equal(getAddress(owner.account.address));
      expect(raffle[1]).to.equal(prize);
      expect(raffle[2]).to.equal(expirationTimestamp);
      expect(raffle[3]).to.equal(ticketPrice);
      expect(raffle[4]).to.equal(0n);
      expect(raffle[5]).to.equal(zeroAddress);
    });

    it("Should fail if prize value is 0", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("0");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0.5");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice]);
      await expect(transaction).to.be.rejectedWith("Prize value should be greater than 0");
    });

    it("Should fail if expirationTimestamp is not in the future", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = 0n;
      const ticketPrice = parseGwei("0.5");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice]);
      await expect(transaction).to.be.rejectedWith("Expiration timestamp should be in the future");
    });

    it("Should fail if ticket price is 0", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice]);
      await expect(transaction).to.be.rejectedWith("Ticket price should be greater than 0");
    });

    it("Should fail if prize value is not greater than ticket price", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("0.5");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("1");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice]);
      await expect(transaction).to.be.rejectedWith("Prize value should be greater than ticket price");
    });
  });

  describe("Enter Raffle", function () {
    it("Should enter a raffle", async function () {
      const {raffleContract, raffleId} = await loadFixture(enterRaffle);

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[4]).to.equal(1n);
    });

    it("Should allow an account to enter a raffle multiple times", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const transaction1 = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice});
      const transaction2 = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice});
      const transaction3 = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice});
      await expect(transaction1).to.be.fulfilled;
      await expect(transaction2).to.be.fulfilled;
      await expect(transaction3).to.be.fulfilled;

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[4]).to.equal(3n);
    });

    it("Should fail when entering an invalid raffle", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const invalidId = raffleId + 1n;
      const transaction = raffleContract.write.enterRaffle([invalidId], {account: user1.account, value: ticketPrice});
      await expect(transaction).to.be.rejectedWith("Invalid raffle ID");

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[4]).to.equal(0n);
    });

    it("Should fail when entering a raffle sending an invalid Ether amount", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const invalidPrice = ticketPrice + parseGwei("0.005");
      const transaction = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: invalidPrice});
      await expect(transaction).to.be.rejectedWith("Invalid value");

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[4]).to.equal(0n);
    });

    it("Should fail when entering an expired raffle", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const transaction = raffleContract.write.enterRaffle([raffleId], {account: user1.account, value: ticketPrice});
      await expect(transaction).to.be.rejectedWith("Raffle has expired");

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[4]).to.equal(0n);
    });
  });

  describe("Pick Winners", function () {
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
        raffleContract,
        user1,
        user2,
        user3,
        user4,
        user5,
        prize,
        raffleId,
      } = await loadFixture(getFulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const addresses = [user1, user2, user3, user4, user5].map(user => getAddress(user.account.address));
      const initialBalances = await getBalances(addresses);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.fulfilled;

      const raffle = await raffleContract.read.raffles([raffleId]);
      expect(raffle[5]).to.not.be.equal(zeroAddress);

      const finalBalances = await getBalances(addresses);
      validateUserBalances(raffle[5], addresses, initialBalances, finalBalances, prize);
    });

    it("Should pick winner even for unfulfilled raffle", async function () {
      const {raffleContract, user1, user2, raffleId} = await loadFixture(getUnfulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const addresses = [user1, user2].map(user => getAddress(user.account.address));
      const initialBalances = await getBalances(addresses);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.fulfilled;

      const raffle = await raffleContract.read.raffles([raffleId]);

      const finalBalances = await getBalances(addresses);
      const raffleBalance = raffle[3] * raffle[4];
      validateUserBalances(raffle[5], addresses, initialBalances, finalBalances, raffleBalance);
    });

    it("Should fail when calling pickWinner of an invalid raffle", async function () {
      const {raffleContract, raffleId} = await loadFixture(getFulfilledRaffle);

      const invalidId = raffleId + 1n;
      await expect(raffleContract.write.pickWinner([invalidId])).to.be.rejectedWith("Invalid raffle ID");
    });

    it("Should fail when calling pickWinner before its end", async function () {
      const {raffleContract, raffleId} = await loadFixture(getFulfilledRaffle);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.rejectedWith("Raffle has not ended yet");
    });

    it("Should fail when calling pickWinner of a raffle with no participants", async () => {
      const {raffleContract, raffleId} = await loadFixture(createRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.rejectedWith("No participants in the raffle");
    });

    it("Should fail when calling pickWinner more than once", async function () {
      const {raffleContract, raffleId} = await loadFixture(getFulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.fulfilled;

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.rejectedWith("Winner has already been picked");
    });
  });
});
