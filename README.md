# Simple ERC20 Raffle Contract

This project demonstrates a basic implementation of a raffle contract using Solidity and an ERC20 token. Users can enter the raffle by spending a specified amount of tokens, and the winner is randomly selected using the blockhash of a future block.

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
npx hardhat ignition deploy ignition/modules/Raffle.ts --network NETWORK_NAME
````

### Usage

Usage instructions here...

## Security Considerations

This implementation uses the block hash for randomness, which has limitations in terms of security and predictability.
Always exercise caution and conduct thorough testing before deploying to a live environment.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.

## Disclaimer:

This code is provided for educational and demonstration purposes only. It is not audited and should not be used in production environments without thorough review and security analysis.
