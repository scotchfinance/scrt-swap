# ENG to SCRT Unidirectional Swap Tooling

This set of tools provides a reasonably secure mechanism for burning ENG on Ethereum, and minting
SCRT 1-to-1 on the Enigma chain. 

## Installation

First ensure you are in a new and empty directory.

1. Install the dependencies
   ```js
   yarn
   ```

2. In a new terminal session, run ganache:
    ```
    ganache-cli -d -i 50
    ```

3. In another new terminal session, run the database:
    ```
    docker-compose run --service-ports mongo
    ```
   
4. Compile and migrate the smart contracts:
    ```
    yarn migrate
    ```

5. Run the unit tests (the `yarn test` also migrates)
    ```
    yarn test
    ```

6. Start the leader
    ```
    # Set other environment variables in a .env file in the project root
    ROLE=leader node ./server.js
    ```
   
7. Start multiple operators
    ```
    # Set other environment variables in a .env file in the project root
    ROLE=operator node ./server.js
    ```
   
8. The `client` folder contains a frontend template that gets Web3 and imports the
    `EngSwap` contract. The contract has single `burnFunds(bytes memory _recipient, uint256 _amount)`
    public function. Usage specs and examples can be found in `swap.test.js`.
    When all the components are online, swaps can be tested by calling
    `burnFunds` using Remix or Web3, or buy creating a page in the frontend.

## FAQ

* __How do I use this with the Ganache-CLI?__

    It's as easy as modifying the config file! [Check out our documentation on adding network configurations](http://truffleframework.com/docs/advanced/configuration#networks). Depending on the port you're using, you'll also need to update line 29 of `client/src/utils/getWeb3.js`.

