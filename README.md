# Simple Raffle Contract

This project demonstrates a basic implementation of a raffle contract using Solidity. Users can initiate various raffles
and participate by spending a predetermined amount of Ether. A winner is randomly selected after the end of a raffle.

## Features

- **Create Raffle**: Users can create multiple raffles, each with a distinct prize based on the amount of Ether sent
  during creation.
- **Purchase Tickets**: Users can participate in a raffle by purchasing tickets with Ether, increasing their chances of
  winning.
- **Select Winner**: After the raffle's predefined expiration time, anyone can trigger the raffle to select a winner
  randomly.
- **Payout Prize**: The selected winner receives the entire prize after winning the raffle. Raffle's revenue is
  transferred to its owner.

## Getting Started

### Install dependencies

````shell
npm install
````

### Deployment

Build the contract running:

````shell
npm run build
````

Deploy the contract to your desired network using Hardhat:

````shell
npx hardhat ignition deploy ignition/modules/SimpleRaffle.ts --network NETWORK_NAME
````

## Security Considerations

This implementation uses the block timestamp and hash for randomness, which has limitations in terms of security and
predictability.
Always exercise caution and conduct thorough testing before deploying to a live environment.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.

## Disclaimer

This code is provided for educational and demonstration purposes only. It is not audited and should not be used in
production environments without thorough review and security analysis.
