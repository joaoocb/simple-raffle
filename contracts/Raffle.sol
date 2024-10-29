// SPDX-License-Identifier: ISC
pragma solidity ^0.8.27;

contract Raffle {
    uint256 public prize;
    uint256 public ticketPrice;
    uint256 public ticketsSold;
    uint256 public expirationTimestamp;
    address payable public owner;
    address payable public winner;
    mapping(uint256 => address) private tickets;

    constructor(uint256 _prize, uint256 _ticketPrice, uint256 _expirationTimestamp) {
        require(block.timestamp < _expirationTimestamp, "Expiration timestamp should be in the future");

        prize = _prize;
        ticketPrice = _ticketPrice;
        expirationTimestamp = _expirationTimestamp;
        owner = payable(msg.sender);
    }

    receive() external payable {
        enterRaffle();
    }

    function enterRaffle() public payable {
        require(msg.value == ticketPrice, "Invalid ticket price");
        require(block.timestamp < expirationTimestamp, "Raffle has expired");

        tickets[ticketsSold++] = msg.sender;
    }

    function pickWinner() public {
        require(block.timestamp > expirationTimestamp, "Raffle has not ended yet");
        require(ticketsSold != 0, "No participants in the raffle");
        require(winner == address(0), "Winner has already been picked");

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1))));
        uint256 randomNumber = uint256(seed) % ticketsSold;
        winner = payable(tickets[randomNumber]);

        uint256 balance = address(this).balance;
        if (balance > prize) {
            winner.transfer(prize);
        } else {
            winner.transfer(balance);
        }

        balance = address(this).balance;
        if (balance > 0) {
            owner.transfer(balance);
        }
    }
}
