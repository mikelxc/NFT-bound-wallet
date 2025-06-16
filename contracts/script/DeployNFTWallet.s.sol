// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {NFTWalletFactory} from "../src/NFTWalletFactory.sol";
import {NFTBoundValidator} from "../src/NFTBoundValidator.sol";
import {Kernel} from "kernel/src/Kernel.sol";
import {KernelFactory} from "kernel/src/factory/KernelFactory.sol";
import {IEntryPoint} from "kernel/src/interfaces/IEntryPoint.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EntryPoint (or use existing one)
        IEntryPoint entryPoint;
        
        // Check if EntryPoint is already deployed on the network
        address entryPointAddress = vm.envOr("ENTRYPOINT_ADDRESS", address(0));
        if (entryPointAddress != address(0)) {
            entryPoint = IEntryPoint(payable(entryPointAddress));
            console.log("Using existing EntryPoint at:", entryPointAddress);
        } else {
            entryPoint = IEntryPoint(0x0000000071727De22E5E9d8BAf0edAc6f37da032);
            console.log("Using canonical EntryPoint at:", address(entryPoint));
        }
        
        // Deploy Kernel implementation
        Kernel kernelImpl = new Kernel(entryPoint);
        console.log("Deployed Kernel implementation at:", address(kernelImpl));
        
        // Deploy KernelFactory
        KernelFactory kernelFactory = new KernelFactory(address(kernelImpl));
        console.log("Deployed KernelFactory at:", address(kernelFactory));
        
        // Deploy NFTBoundValidator
        NFTBoundValidator validator = new NFTBoundValidator();
        console.log("Deployed NFTBoundValidator at:", address(validator));
        
        // Deploy NFTWalletFactory
        string memory name = vm.envOr("NFT_NAME", string("NFT Bound Account"));
        string memory symbol = vm.envOr("NFT_SYMBOL", string("NBA"));
        
        NFTWalletFactory factory = new NFTWalletFactory(
            kernelFactory,
            address(validator),
            name,
            symbol
        );
        console.log("Deployed NFTWalletFactory at:", address(factory));
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("EntryPoint:", address(entryPoint));
        console.log("Kernel Implementation:", address(kernelImpl));
        console.log("KernelFactory:", address(kernelFactory));
        console.log("NFTBoundValidator:", address(validator));
        console.log("NFTWalletFactory:", address(factory));
        console.log("NFT Name:", name);
        console.log("NFT Symbol:", symbol);
        console.log("Minting Fee:", factory.mintingFee());
    }
}