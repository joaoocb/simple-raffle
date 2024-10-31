# Simple Raffle Contract

This project demonstrates a basic implementation of a raffle contract using Solidity. Users can initiate various raffles and participate by spending a predetermined amount of Ether. A winner is randomly selected after the end of a raffle.

## Getting Started

### Install dependencies

````shell
npm install
````

### Deployment

Build the contract running:
````shell
npx hardhat compile
````

Deploy the contract to your desired network using Hardhat:
````shell
npx hardhat ignition deploy ignition/modules/SimpleRaffle.ts --network NETWORK_NAME
````

## Security Considerations

This implementation uses the block timestamp and hash for randomness, which has limitations in terms of security and predictability.
Always exercise caution and conduct thorough testing before deploying to a live environment.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.

## Disclaimer

This code is provided for educational and demonstration purposes only. It is not audited and should not be used in production environments without thorough review and security analysis.
