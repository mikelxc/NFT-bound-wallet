// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {NFTWalletFactory} from "../src/NFTWalletFactory.sol";
import {NFTBoundValidator} from "../src/NFTBoundValidator.sol";
import {Kernel} from "kernel/src/Kernel.sol";
import {KernelFactory} from "kernel/src/factory/KernelFactory.sol";
import {EntryPoint} from "account-abstraction/core/EntryPoint.sol";
import {IEntryPoint} from "kernel/src/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "kernel/src/interfaces/PackedUserOperation.sol";
import {ECDSA} from "solady/utils/ECDSA.sol";
import {SIG_VALIDATION_SUCCESS_UINT, SIG_VALIDATION_FAILED_UINT, ERC1271_MAGICVALUE, ERC1271_INVALID, MODULE_TYPE_VALIDATOR, MODULE_TYPE_HOOK} from "kernel/src/types/Constants.sol";

contract NFTBoundValidatorTest is Test {
    NFTWalletFactory public factory;
    NFTBoundValidator public validator;
    Kernel public kernelImpl;
    KernelFactory public kernelFactory;
    EntryPoint public entryPoint;
    
    address public user;
    uint256 public userPrivateKey;
    address public anotherUser;
    uint256 public anotherUserPrivateKey;
    
    uint256 constant MINTING_FEE = 0.01 ether;

    function setUp() public {
        (user, userPrivateKey) = makeAddrAndKey("user");
        (anotherUser, anotherUserPrivateKey) = makeAddrAndKey("anotherUser");
        
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
        
        // No need to set factory anymore - validator is self-contained
        
        vm.deal(user, 10 ether);
        vm.deal(anotherUser, 10 ether);
    }

    function testOnInstallInitializesValidator() public {
        address mockWallet = makeAddr("mockWallet");
        
        // Test onInstall with valid data
        vm.prank(mockWallet);
        validator.onInstall(abi.encode(address(factory), uint256(1)));
        
        // Verify initialization
        assertTrue(validator.isInitialized(mockWallet));
        
        // Check storage
        (address nftContract, uint256 tokenId) = validator.nftBoundValidatorStorage(mockWallet);
        assertEq(nftContract, address(factory));
        assertEq(tokenId, 1);
    }

    function testValidatePluginDataWithValidSignature() public {
        // Mint a wallet
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Create a mock UserOperation
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: wallet,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 21000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: ""
        });
        
        bytes32 userOpHash = keccak256("test");
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(userOpHash);
        
        // Sign with user's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Use signature directly (simplified validation)
        userOp.signature = signature;
        
        vm.prank(wallet);
        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, SIG_VALIDATION_SUCCESS_UINT);
    }

    function testValidatePluginDataWithInvalidWallet() public {
        address fakeWallet = makeAddr("fakeWallet");
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: fakeWallet,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 21000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: ""
        });
        
        bytes32 userOpHash = keccak256("test");
        
        // This should revert because the wallet is not initialized
        vm.prank(fakeWallet);
        vm.expectRevert();
        validator.validateUserOp(userOp, userOpHash);
    }

    function testIsValidSignature() public {
        // Mint a wallet
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        bytes32 hash = keccak256("test message");
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(hash);
        
        // Sign with user's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.prank(wallet);
        bytes4 result = validator.isValidSignatureWithSender(wallet, hash, signature);
        assertEq(result, ERC1271_MAGICVALUE);
        
        // Test with wrong signature
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(anotherUserPrivateKey, ethSignedHash);
        bytes memory wrongSignature = abi.encodePacked(r2, s2, v2);
        
        vm.prank(wallet);
        bytes4 wrongResult = validator.isValidSignatureWithSender(wallet, hash, wrongSignature);
        assertEq(wrongResult, ERC1271_INVALID);
    }

    function testValidatorWorksAfterNFTTransfer() public {
        // Mint a wallet
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Transfer NFT to another user
        vm.prank(user);
        factory.transferFrom(user, anotherUser, tokenId);
        
        // Original user should no longer be able to sign
        bytes32 hash = keccak256("test message");
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(hash);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.prank(wallet);
        bytes4 result = validator.isValidSignatureWithSender(wallet, hash, signature);
        assertEq(result, ERC1271_INVALID);
        
        // New owner should be able to sign
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(anotherUserPrivateKey, ethSignedHash);
        bytes memory newSignature = abi.encodePacked(r2, s2, v2);
        
        vm.prank(wallet);
        bytes4 newResult = validator.isValidSignatureWithSender(wallet, hash, newSignature);
        assertEq(newResult, ERC1271_MAGICVALUE);
    }

    function testOnUninstall() public {
        // Mint a wallet first
        vm.prank(user);
        (uint256 tokenId, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Verify wallet is initialized
        assertTrue(validator.isInitialized(wallet));
        (address nftContract, uint256 storedTokenId) = validator.nftBoundValidatorStorage(wallet);
        assertEq(nftContract, address(factory));
        assertEq(storedTokenId, tokenId);
        
        // Call onUninstall from the wallet
        vm.prank(wallet);
        validator.onUninstall("");
        
        // Verify wallet data is cleared
        assertFalse(validator.isInitialized(wallet));
        (address clearedContract, uint256 clearedTokenId) = validator.nftBoundValidatorStorage(wallet);
        assertEq(clearedContract, address(0));
        assertEq(clearedTokenId, 0);
    }

    function testOnUninstallFailsIfNotInitialized() public {
        address fakeWallet = makeAddr("fakeWallet");
        
        vm.prank(fakeWallet);
        vm.expectRevert(abi.encodeWithSignature("NotInitialized(address)", fakeWallet));
        validator.onUninstall("");
    }

    function testOnInstallFailsIfAlreadyInitialized() public {
        // Mint a wallet first
        vm.prank(user);
        (, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Try to call onInstall again - should fail
        vm.prank(wallet);
        vm.expectRevert(abi.encodeWithSignature("AlreadyInitialized(address)", wallet));
        validator.onInstall(abi.encode(address(factory), uint256(1)));
    }

    function testIsModuleType() public {
        // Should return true for validator and hook module types
        assertTrue(validator.isModuleType(MODULE_TYPE_VALIDATOR));
        assertTrue(validator.isModuleType(MODULE_TYPE_HOOK));
        
        // Should return false for other module types
        assertFalse(validator.isModuleType(0)); // Invalid type
        assertFalse(validator.isModuleType(2)); // Executor type
        assertFalse(validator.isModuleType(999)); // Random type
    }

    function testValidateUserOpWithNonExistentNFT() public {
        // Create a mock wallet and initialize validator with non-existent token
        address fakeWallet = makeAddr("fakeWallet");
        
        // Initialize validator with non-existent NFT
        vm.prank(fakeWallet);
        validator.onInstall(abi.encode(address(factory), uint256(999))); // Non-existent token ID
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: fakeWallet,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 21000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: ""
        });
        
        bytes32 userOpHash = keccak256("test");
        
        // This should revert when trying to get owner of non-existent NFT
        vm.prank(fakeWallet);
        vm.expectRevert();
        validator.validateUserOp(userOp, userOpHash);
    }

    function testValidateUserOpWithShortSignature() public {
        // Mint a wallet
        vm.prank(user);
        (, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Create a UserOperation with short signature (no padding)
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: wallet,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 21000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: ""
        });
        
        bytes32 userOpHash = keccak256("test");
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(userOpHash);
        
        // Sign with user's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Use short signature directly (no padding)
        userOp.signature = signature;
        
        vm.prank(wallet);
        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, SIG_VALIDATION_SUCCESS_UINT);
    }

    function testIsValidSignatureWithInvalidSignature() public {
        // Mint a wallet
        vm.prank(user);
        (, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        bytes32 hash = keccak256("test message");
        bytes memory invalidSignature = hex"1234567890"; // Invalid signature
        
        vm.prank(wallet);
        bytes4 result = validator.isValidSignatureWithSender(wallet, hash, invalidSignature);
        assertEq(result, ERC1271_INVALID);
    }

    function testIsValidSignatureWithNonExistentWallet() public {
        address fakeWallet = makeAddr("fakeWallet");
        
        // Initialize wallet with non-existent NFT
        vm.prank(fakeWallet);
        validator.onInstall(abi.encode(address(factory), uint256(999))); // Non-existent token ID
        
        bytes32 hash = keccak256("test message");
        bytes memory signature = hex"1234567890";
        
        // This should revert when trying to get owner of non-existent NFT
        vm.prank(fakeWallet);
        vm.expectRevert();
        validator.isValidSignatureWithSender(fakeWallet, hash, signature);
    }

    function testPreCheckValidatesNFTOwner() public {
        // Mint a wallet
        vm.prank(user);
        (, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Test preCheck with correct owner
        vm.prank(wallet);
        bytes memory result = validator.preCheck(user, 0, "");
        assertEq(result, hex"");
        
        // Test preCheck with wrong sender
        vm.prank(wallet);
        vm.expectRevert("NFTBoundValidator: sender is not NFT owner");
        validator.preCheck(anotherUser, 0, "");
    }

    function testValidateUserOpWithFailedSignatureRecovery() public {
        // Mint a wallet
        vm.prank(user);
        (, address wallet) = factory.mintWallet{value: MINTING_FEE}(user);
        
        // Create a UserOperation with malformed signature that will cause ECDSA.recover to fail
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: wallet,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(uint256(100000) << 128 | uint256(100000)),
            preVerificationGas: 21000,
            gasFees: bytes32(uint256(1 gwei) << 128 | uint256(1 gwei)),
            paymasterAndData: "",
            signature: hex"1234" // Invalid signature that will cause recovery to fail
        });
        
        bytes32 userOpHash = keccak256("test");
        
        vm.prank(wallet);
        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, SIG_VALIDATION_FAILED_UINT);
    }

    function testPostCheckDoesNothing() public {
        // Test that postCheck executes without reverting
        vm.prank(makeAddr("wallet"));
        validator.postCheck("");
        
        // Should not revert and do nothing
        assertTrue(true);
    }
}