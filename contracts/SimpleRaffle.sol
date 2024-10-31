// SPDX-License-Identifier: ISC
pragma solidity ^0.8.27;

contract SimpleRaffle {
    struct Raffle {
        address payable owner;
        uint256 prize;
        uint256 expirationTimestamp;
        uint256 ticketPrice;
        uint256 ticketsSold;
        address payable winner;
        mapping(uint256 => address) tickets;
    }

    uint256 public numRaffles;
    mapping(uint256 => Raffle) public raffles;

    constructor() {
    }

    function createRaffle(uint256 prize, uint256 expirationTimestamp, uint256 ticketPrice) external returns (uint256) {
        require(prize > 0, "Prize value should be greater than 0");
        require(expirationTimestamp > block.timestamp, "Expiration timestamp should be in the future");
        require(ticketPrice > 0, "Ticket price should be greater than 0");
        require(prize > ticketPrice, "Prize value should be greater than ticket price");

        uint256 raffleId = numRaffles;
        numRaffles = raffleId + 1;

        Raffle storage raffle = raffles[raffleId];
        raffle.owner = payable(msg.sender);
        raffle.prize = prize;
        raffle.expirationTimestamp = expirationTimestamp;
        raffle.ticketPrice = ticketPrice;

        return raffleId;
    }

    function enterRaffle(uint256 raffleId) external payable returns (uint256) {
        require(raffleId < numRaffles, "Invalid raffle ID");

        Raffle storage raffle = raffles[raffleId];

        require(msg.value == raffle.ticketPrice, "Invalid ticket price");
        require(block.timestamp < raffle.expirationTimestamp, "Raffle has expired");

        uint256 ticketId = raffle.ticketsSold;
        raffle.ticketsSold = ticketId + 1;

        raffle.tickets[ticketId] = msg.sender;

        return ticketId;
    }

    function pickWinner(uint256 raffleId) public {
        require(raffleId < numRaffles, "Invalid raffle ID");

        Raffle storage raffle = raffles[raffleId];
        uint256 ticketsSold = raffle.ticketsSold;

        require(block.timestamp > raffle.expirationTimestamp, "Raffle has not ended yet");
        require(ticketsSold != 0, "No participants in the raffle");
        require(raffle.winner == address(0), "Winner has already been picked");

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1))));
        uint256 randomNumber = uint256(seed) % ticketsSold;
        raffle.winner = payable(raffle.tickets[randomNumber]);

        uint256 raffleBalance = raffle.ticketPrice * ticketsSold;
        uint256 prize = raffle.prize;
        if (raffleBalance > prize) {
            raffle.winner.transfer(prize);
            raffle.owner.transfer(raffleBalance - prize);
        } else {
            raffle.winner.transfer(raffleBalance);
        }
    }
}
