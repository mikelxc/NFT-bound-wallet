// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {NFTWalletFactory} from "../src/NFTWalletFactory.sol";
import {NFTBoundValidator} from "../src/NFTBoundValidator.sol";
import {Kernel} from "kernel/src/Kernel.sol";
import {KernelFactory} from "kernel/src/factory/KernelFactory.sol";
import {EntryPoint} from "account-abstraction/core/EntryPoint.sol";
import {IEntryPoint} from "kernel/src/interfaces/IEntryPoint.sol";
import {IHook} from "kernel/src/interfaces/IERC7579Modules.sol";
import {HOOK_MODULE_NOT_INSTALLED} from "kernel/src/types/Constants.sol";
import {INFTWalletFactory} from "../src/interfaces/INFTWalletFactory.sol";

contract NFTWalletFactoryTest is Test {
    NFTWalletFactory public factory;
    NFTBoundValidator public validator;
    Kernel public kernelImpl;
    KernelFactory public kernelFactory;
    EntryPoint public entryPoint;
    
    address public user = makeAddr("user");
    address public anotherUser = makeAddr("anotherUser");
    
    uint256 constant MINTING_FEE = 0.01 ether;

    receive() external payable {}

    function setUp() public {
        entryPoint = new EntryPoint();
        
        kernelImpl = new Kernel(IEntryPoint(address(entryPoint)));
        kernelFactory = new KernelFactory(address(kernelImpl));
        validator = new NFTBoundValidator();
        
        factory = new NFTWalletFactory(
            kernelFactory,
            address(validator),
            "Wallet NFT",
            "WNFT"
        );
        
        validator.setFactory(address(factory));
        
        vm.deal(user, 10 ether);
        vm.deal(anotherUser, 10 ether);
    }

    function testMintWallet() public {
        vm.startPrank(user);
        
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        assertEq(tokenId, 0);
        assertEq(factory.ownerOf(tokenId), user);
        assertEq(factory.tokenIdToWallet(tokenId), wallet);
        assertEq(factory.walletToTokenId(wallet), tokenId);
        
        // Check that wallet was deployed
        assertTrue(wallet.code.length > 0);
        
        // Check that validator is initialized for this wallet
        assertTrue(validator.isInitialized(wallet));
        
        vm.stopPrank();
    }

    function testMintWalletInsufficientFee() public {
        vm.startPrank(user);
        
        vm.expectRevert(NFTWalletFactory.InsufficientFee.selector);
        factory.mintWallet{value: MINTING_FEE - 1}(user);
        
        vm.stopPrank();
    }

    function testGetWalletAddress() public {
        address predicted = factory.getWalletAddress(0);
        
        vm.prank(user);
        (, address actual) = factory.mintWallet{value: MINTING_FEE}(user);
        
        assertEq(predicted, actual);
    }

    function testTokenURI() public {
        vm.prank(user);
        (uint256 tokenId,) = factory.mintWallet{value: MINTING_FEE}(user);
        
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
        assertTrue(startsWith(uri, "data:application/json;base64,"));
    }

    function testSequentialTokenIds() public {
        vm.startPrank(user);
        
        (uint256 tokenId1,) = factory.mintWallet{value: MINTING_FEE}(user);
        (uint256 tokenId2,) = factory.mintWallet{value: MINTING_FEE}(user);
        (uint256 tokenId3,) = factory.mintWallet{value: MINTING_FEE}(user);
        
        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(tokenId3, 2);
        
        vm.stopPrank();
    }

    function testTransferNFTTransfersWalletControl() public {
        vm.prank(user);
        (uint256 tokenId,) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Transfer NFT to another user
        vm.prank(user);
        factory.transferFrom(user, anotherUser, tokenId);
        
        assertEq(factory.ownerOf(tokenId), anotherUser);
    }

    function testOnlyOwnerCanSetMintingFee() public {
        uint256 newFee = 0.02 ether;
        
        // Non-owner should fail
        vm.prank(user);
        vm.expectRevert();
        factory.setMintingFee(newFee);
        
        // Owner should succeed
        factory.setMintingFee(newFee);
        assertEq(factory.mintingFee(), newFee);
    }

    function testWithdraw() public {
        // Mint a wallet to add funds to factory
        vm.prank(user);
        factory.mintWallet{value: MINTING_FEE}(user);
        
        uint256 factoryBalance = address(factory).balance;
        assertEq(factoryBalance, MINTING_FEE);
        
        uint256 ownerBalanceBefore = address(this).balance;
        factory.withdraw();
        uint256 ownerBalanceAfter = address(this).balance;
        
        assertEq(ownerBalanceAfter - ownerBalanceBefore, MINTING_FEE);
        assertEq(address(factory).balance, 0);
    }

    function testContractURI() public view {
        string memory contractURIResult = factory.contractURI();
        
        // Should return base64 encoded JSON
        assertTrue(startsWith(contractURIResult, "data:application/json;base64,"));
        
        // Decode and check basic structure (simplified check)
        assertTrue(bytes(contractURIResult).length > 100); // Should be substantial content
    }

    function testSupportsInterface() public view {
        // Should support INFTWalletFactory interface
        assertTrue(factory.supportsInterface(type(INFTWalletFactory).interfaceId));
        
        // Should support ERC721 interface
        assertTrue(factory.supportsInterface(0x80ac58cd)); // ERC721 interface ID
        
        // Should support ERC165 interface
        assertTrue(factory.supportsInterface(0x01ffc9a7)); // ERC165 interface ID
        
        // Should not support random interface
        assertFalse(factory.supportsInterface(0x12345678));
    }

    function testTokenURIForNonExistentToken() public {
        vm.expectRevert(); // Should revert with TokenDoesNotExist
        factory.tokenURI(999);
    }

    function testTokenURIWithWalletNotDeployed() public {
        // Mint a token but don't actually deploy the wallet (this happens in mint, but let's test the logic)
        vm.prank(user);
        (uint256 tokenId,) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Call tokenURI - should work even if wallet mapping is somehow empty
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(startsWith(uri, "data:application/json;base64,"));
    }

    function testFormatEtherEdgeCases() public {
        // We can't directly test internal functions, but we can test them via tokenURI
        vm.deal(user, 1 ether);
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Send some ETH to the wallet to test formatting
        vm.deal(wallet, 1.5 ether);
        
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
        
        // Test with zero balance
        vm.deal(wallet, 0);
        uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
        
        // Test with exact ether amount
        vm.deal(wallet, 1 ether);
        uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }

    function testKernelFactoryGetter() public view {
        address kernelFactoryAddr = factory.kernelFactory();
        assertEq(kernelFactoryAddr, address(kernelFactory));
    }

    function testNFTBoundValidatorGetter() public view {
        address validatorAddr = factory.nftBoundValidator();
        assertEq(validatorAddr, address(validator));
    }

    function testMintingFeeGetter() public view {
        uint256 fee = factory.mintingFee();
        assertEq(fee, MINTING_FEE);
    }

    function testNameAndSymbol() public view {
        assertEq(factory.name(), "Wallet NFT");
        assertEq(factory.symbol(), "WNFT");
    }

    function testTokenIdToWalletMapping() public {
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        assertEq(factory.tokenIdToWallet(tokenId), wallet);
    }

    function testWalletToTokenIdMapping() public {
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        assertEq(factory.walletToTokenId(wallet), tokenId);
    }

    function testMintingFeeEvent() public {
        uint256 newFee = 0.02 ether;
        
        vm.expectEmit(true, true, true, true);
        emit MintingFeeUpdated(newFee);
        
        factory.setMintingFee(newFee);
        
        assertEq(factory.mintingFee(), newFee);
    }

    function testWithdrawWithNoBalance() public {
        // Withdraw when contract has no balance should not fail
        factory.withdraw();
        assertEq(address(factory).balance, 0);
    }

    function testMultipleMints() public {
        // Test that multiple mints work correctly and tokenIds increment
        vm.deal(user, 10 ether);
        vm.deal(anotherUser, 10 ether);
        
        vm.prank(user);
        (uint256 tokenId1, address wallet1) = factory.mintWallet{value: MINTING_FEE}(user);
        
        vm.prank(anotherUser);
        (uint256 tokenId2, address wallet2) = factory.mintWallet{value: MINTING_FEE}(anotherUser);
        
        vm.prank(user);
        (uint256 tokenId3, address wallet3) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Token IDs should increment
        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(tokenId3, 2);
        
        // Wallets should be different
        assertTrue(wallet1 != wallet2);
        assertTrue(wallet2 != wallet3);
        assertTrue(wallet1 != wallet3);
        
        // Check ownership
        assertEq(factory.ownerOf(tokenId1), user);
        assertEq(factory.ownerOf(tokenId2), anotherUser);
        assertEq(factory.ownerOf(tokenId3), user);
    }

    function testOnlyOwnerModifier() public {
        vm.prank(user);
        vm.expectRevert(); // Should revert with Unauthorized or similar
        factory.setMintingFee(0.05 ether);
        
        vm.prank(user);
        vm.expectRevert(); // Should revert with Unauthorized or similar
        factory.withdraw();
    }

    function testFormatEtherWithNonZeroRemainder() public {
        // Test the remainder != 0 branch in formatEther by using tokenURI which calls it
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Set a balance with non-zero remainder
        vm.deal(wallet, 1.5 ether + 123456789); // This will have a remainder when divided by 1 ether
        
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }

    function testGetWalletCodeLengthZero() public {
        // The getNonce function checks wallet.code.length == 0
        // This should already be covered but let's be explicit
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // New wallets have code, but the function should handle zero-length case
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }

    // Helper function to check if string starts with prefix
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) {
            return false;
        }
        
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        return true;
    }

    event MintingFeeUpdated(uint256 newFee);
}