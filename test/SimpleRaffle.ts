import {loadFixture, time} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import {expect} from "chai";
import hre from "hardhat";
import {getAddress, maxUint256, parseGwei, zeroAddress} from "viem";

const ONE_DAY_IN_SECS = 24 * 60 * 60;

describe("SimpleRaffle", function () {
  async function deployRaffle() {
    const [, owner, user1] = await hre.viem.getWalletClients();

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

    const args: [bigint, bigint, bigint, bigint] = [prize, expirationTimestamp, ticketPrice, maxUint256];
    const options = {account: owner.account.address};

    const raffleId = (await raffleContract.simulate.createRaffle(args, options)).result;
    const transaction = raffleContract.write.createRaffle(args, options);
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

    const options = {account: user1.account.address, value: ticketPrice};

    const ticketId = (await raffleContract.simulate.enterRaffle([raffleId], options)).result;
    const transaction = raffleContract.write.enterRaffle([raffleId], options);
    await expect(transaction).to.be.fulfilled;

    return {
      raffleContract,
      user1,
      raffleId,
      ticketId,
    };
  }

  async function getFulfilledRaffle() {
    const {raffleContract, owner, user1, prize, ticketPrice, raffleId} = await loadFixture(createRaffle);

    const [, , , user2, user3, user4, user5] = await hre.viem.getWalletClients();

    await raffleContract.write.enterRaffle([raffleId], {account: user1.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user1.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user3.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user3.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user4.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user4.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user5.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user5.account.address, value: ticketPrice});

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

    const [, , , user2] = await hre.viem.getWalletClients();

    await raffleContract.write.enterRaffle([raffleId], {account: user1.account.address, value: ticketPrice});
    await raffleContract.write.enterRaffle([raffleId], {account: user2.account.address, value: ticketPrice});

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
      expect(raffle[4]).to.equal(maxUint256);
      expect(raffle[5]).to.equal(zeroAddress);
    });

    it("Should fail if prize value is 0", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("0");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0.5");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice, maxUint256]);
      await expect(transaction).to.be.rejectedWith("Prize value should be greater than 0");
    });

    it("Should fail if expirationTimestamp is not in the future", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = 0n;
      const ticketPrice = parseGwei("0.5");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice, maxUint256]);
      await expect(transaction).to.be.rejectedWith("Expiration timestamp should be in the future");
    });

    it("Should fail if ticket price is 0", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice, maxUint256]);
      await expect(transaction).to.be.rejectedWith("Ticket price should be greater than 0");
    });

    it("Should fail if prize value is not greater than ticket price", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("0.5");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("1");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice, maxUint256]);
      await expect(transaction).to.be.rejectedWith("Prize value should be greater than ticket price");
    });

    it("Should fail if total tickets is 0", async function () {
      const {raffleContract} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0.5");

      const transaction = raffleContract.write.createRaffle([prize, expirationTimestamp, ticketPrice, 0n]);
      await expect(transaction).to.be.rejectedWith("Total tickets should be greater than 0");
    });
  });

  describe("Enter Raffle", function () {
    it("Should enter a raffle", async function () {
      const {raffleContract, user1, raffleId, ticketId} = await loadFixture(enterRaffle);

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(1n);
      expect(ticketId).to.equal(soldTickets - 1n);

      const ticketOwner = await raffleContract.read.getTicketOwner([raffleId, ticketId]);
      expect(ticketOwner).to.equal(getAddress(user1.account.address));
    });

    it("Should allow an account to enter a raffle multiple times", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const options = {account: user1.account.address, value: ticketPrice};

      const transaction1 = raffleContract.write.enterRaffle([raffleId], options);
      const transaction2 = raffleContract.write.enterRaffle([raffleId], options);
      const transaction3 = raffleContract.write.enterRaffle([raffleId], options);
      await expect(transaction1).to.be.fulfilled;
      await expect(transaction2).to.be.fulfilled;
      await expect(transaction3).to.be.fulfilled;

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(3n);
    });

    it("Should fail when entering an invalid raffle", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const invalidId = raffleId + 1n;

      const options = {account: user1.account.address, value: ticketPrice};

      const transaction = raffleContract.write.enterRaffle([invalidId], options);
      await expect(transaction).to.be.rejectedWith("Invalid raffle ID");

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(0n);
    });

    it("Should fail when entering a raffle sending an invalid Ether amount", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      const invalidPrice = ticketPrice + parseGwei("0.005");

      const options = {account: user1.account.address, value: invalidPrice};

      const transaction = raffleContract.write.enterRaffle([raffleId], options);
      await expect(transaction).to.be.rejectedWith("Invalid value");

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(0n);
    });

    it("Should fail when entering an expired raffle", async function () {
      const {raffleContract, raffleId, user1, ticketPrice} = await loadFixture(createRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const options = {account: user1.account.address, value: ticketPrice};

      const transaction = raffleContract.write.enterRaffle([raffleId], options);
      await expect(transaction).to.be.rejectedWith("Raffle has expired");

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(0n);
    });

    it("Should fail when entering a sold out raffle", async function () {
      const {raffleContract, owner, user1} = await loadFixture(deployRaffle);

      const prize = parseGwei("1");
      const expirationTimestamp = BigInt((await time.latest()) + ONE_DAY_IN_SECS);
      const ticketPrice = parseGwei("0.5");
      const totalTickets = 5n;

      const args: [bigint, bigint, bigint, bigint] = [prize, expirationTimestamp, ticketPrice, totalTickets];

      const raffleId = (await raffleContract.simulate.createRaffle(args, {account: owner.account.address})).result;
      await raffleContract.write.createRaffle(args);

      const options = {account: user1.account.address, value: ticketPrice};

      for (let i = 0; i < totalTickets; i++) {
        const transaction = raffleContract.write.enterRaffle([raffleId], options);
        await expect(transaction).to.be.fulfilled;
      }

      const transaction = raffleContract.write.enterRaffle([raffleId], options);
      await expect(transaction).to.be.rejectedWith("Raffle sold out");
    });

    it("Should fail if owner enters the raffle", async function () {
      const {raffleContract, raffleId, owner, ticketPrice} = await loadFixture(createRaffle);

      const options = {account: owner.account.address, value: ticketPrice};

      const transaction = raffleContract.write.enterRaffle([raffleId], options);
      await expect(transaction).to.be.rejectedWith("Owner can not enter raffle");

      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);
      expect(soldTickets).to.equal(0n);
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

      const [,,,,, winner] = await raffleContract.read.raffles([raffleId]);
      expect(winner).to.not.be.equal(zeroAddress);

      const finalBalances = await getBalances(addresses);
      validateUserBalances(winner, addresses, initialBalances, finalBalances, prize);
    });

    it("Should pick winner even for unfulfilled raffle", async function () {
      const {raffleContract, user1, user2, raffleId} = await loadFixture(getUnfulfilledRaffle);

      await time.increase(ONE_DAY_IN_SECS + 1);

      const addresses = [user1, user2].map(user => getAddress(user.account.address));
      const initialBalances = await getBalances(addresses);

      await expect(raffleContract.write.pickWinner([raffleId])).to.be.fulfilled;

      const [,,, ticketPrice,, winner] = await raffleContract.read.raffles([raffleId]);
      const soldTickets = await raffleContract.read.getSoldTickets([raffleId]);

      const finalBalances = await getBalances(addresses);
      const raffleBalance = ticketPrice * soldTickets;
      validateUserBalances(winner, addresses, initialBalances, finalBalances, raffleBalance);
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
