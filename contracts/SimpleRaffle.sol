// SPDX-License-Identifier: ISC
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleRaffle is ReentrancyGuard {
    struct Raffle {
        address payable owner;
        uint256 prize;
        uint256 expirationTimestamp;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 soldTickets;
        address payable winner;
        mapping(uint256 => address) tickets;
    }

    event RaffleCreated(uint256 indexed raffleId, address indexed owner);
    event TicketPurchased(uint256 indexed raffleId, uint256 ticketId, address participant);
    event WinnerPicked(uint256 indexed raffleId, address indexed winner);

    uint256 public numRaffles;
    mapping(uint256 => Raffle) public raffles;

    constructor() {
    }

    function createRaffle(uint256 prize, uint256 expirationTimestamp, uint256 ticketPrice, uint256 totalTickets)
        external
        returns (uint256)
    {
        require(prize > 0, "Prize value should be greater than 0");
        require(expirationTimestamp > block.timestamp, "Expiration timestamp should be in the future");
        require(ticketPrice > 0, "Ticket price should be greater than 0");
        require(prize > ticketPrice, "Prize value should be greater than ticket price");
        require(totalTickets > 0, "Total tickets should be greater than 0");

        uint256 raffleId = numRaffles;
        numRaffles = raffleId + 1;

        Raffle storage raffle = raffles[raffleId];
        raffle.owner = payable(msg.sender);
        raffle.prize = prize;
        raffle.expirationTimestamp = expirationTimestamp;
        raffle.ticketPrice = ticketPrice;
        raffle.totalTickets = totalTickets;

        emit RaffleCreated(raffleId, msg.sender);

        return raffleId;
    }

    function enterRaffle(uint256 raffleId) external payable returns (uint256) {
        require(raffleId < numRaffles, "Invalid raffle ID");

        Raffle storage raffle = raffles[raffleId];

        require(msg.value == raffle.ticketPrice, "Invalid value");
        require(block.timestamp < raffle.expirationTimestamp, "Raffle has expired");
        require(raffle.soldTickets < raffle.totalTickets, "Raffle sold out");
        require(msg.sender != raffle.owner, "Owner can not enter raffle");

        uint256 ticketId = raffle.soldTickets;
        raffle.soldTickets = ticketId + 1;

        raffle.tickets[ticketId] = msg.sender;

        emit TicketPurchased(raffleId, ticketId, msg.sender);

        return ticketId;
    }

    function pickWinner(uint256 raffleId) public nonReentrant {
        require(raffleId < numRaffles, "Invalid raffle ID");

        Raffle storage raffle = raffles[raffleId];
        uint256 soldTickets = raffle.soldTickets;

        require(block.timestamp > raffle.expirationTimestamp, "Raffle has not ended yet");
        require(soldTickets != 0, "No participants in the raffle");
        require(raffle.winner == address(0), "Winner has already been picked");

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1))));
        uint256 randomNumber = uint256(seed) % soldTickets;
        raffle.winner = payable(raffle.tickets[randomNumber]);

        uint256 raffleBalance = raffle.ticketPrice * soldTickets;
        uint256 prize = raffle.prize;
        if (raffleBalance > prize) {
            raffle.winner.transfer(prize);
            raffle.owner.transfer(raffleBalance - prize);
        } else {
            raffle.winner.transfer(raffleBalance);
        }

        emit WinnerPicked(raffleId, raffle.winner);
    }
}
