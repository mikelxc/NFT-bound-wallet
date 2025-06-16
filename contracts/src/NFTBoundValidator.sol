// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IValidator} from "kernel/src/interfaces/IERC7579Modules.sol";
import {PackedUserOperation} from "kernel/src/interfaces/PackedUserOperation.sol";
import {ECDSA} from "solady/utils/ECDSA.sol";
import {ERC721} from "solady/tokens/ERC721.sol";
import {
    SIG_VALIDATION_SUCCESS_UINT,
    SIG_VALIDATION_FAILED_UINT,
    MODULE_TYPE_VALIDATOR,
    ERC1271_MAGICVALUE,
    ERC1271_INVALID
} from "kernel/src/types/Constants.sol";

contract NFTBoundValidator is IValidator {
    address public nftFactory;
    mapping(address => uint256) public walletToTokenId;
    mapping(address => bool) public initialized;

    error InvalidFactory();
    error InvalidWallet();
    error NotNFTOwner();

    modifier onlyFactory() {
        if (msg.sender != nftFactory) revert InvalidFactory();
        _;
    }

    function setFactory(address _factory) external {
        require(nftFactory == address(0), "Factory already set");
        nftFactory = _factory;
    }

    function setWalletTokenId(address wallet, uint256 tokenId) external onlyFactory {
        walletToTokenId[wallet] = tokenId;
    }

    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash)
        external
        payable
        override
        returns (uint256)
    {
        uint256 tokenId = walletToTokenId[userOp.sender];
        
        // Check if this wallet is registered and get the NFT owner
        address nftOwner;
        try ERC721(nftFactory).ownerOf(tokenId) returns (address owner) {
            nftOwner = owner;
        } catch {
            revert InvalidWallet();
        }
        
        if (nftOwner == address(0)) revert NotNFTOwner();

        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(userOpHash);
        
        // Extract the actual signature from the padded format
        // Skip the first 97 bytes of padding, then decode the signature
        bytes memory actualSignature;
        if (userOp.signature.length > 97) {
            bytes memory encodedData = userOp.signature[97:];
            (actualSignature,) = abi.decode(encodedData, (bytes, bytes));
        } else {
            actualSignature = userOp.signature;
        }
        
        address recovered;
        try this.recoverSigner(ethSignedHash, actualSignature) returns (address signer) {
            recovered = signer;
        } catch {
            return SIG_VALIDATION_FAILED_UINT;
        }
        
        if (recovered == nftOwner) {
            return SIG_VALIDATION_SUCCESS_UINT;
        } else {
            return SIG_VALIDATION_FAILED_UINT;
        }
    }

    function isValidSignatureWithSender(address sender, bytes32 hash, bytes calldata signature)
        external
        view
        override
        returns (bytes4)
    {
        uint256 tokenId = walletToTokenId[sender];
        
        address nftOwner;
        try ERC721(nftFactory).ownerOf(tokenId) returns (address owner) {
            nftOwner = owner;
        } catch {
            return ERC1271_INVALID;
        }
        
        if (nftOwner == address(0)) return ERC1271_INVALID;

        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(hash);
        
        address recovered;
        try this.recoverSigner(ethSignedHash, signature) returns (address signer) {
            recovered = signer;
        } catch {
            return ERC1271_INVALID;
        }
        
        if (recovered == nftOwner) {
            return ERC1271_MAGICVALUE;
        } else {
            return ERC1271_INVALID;
        }
    }

    function onInstall(bytes calldata data) external payable override {
        if (initialized[msg.sender]) revert AlreadyInitialized(msg.sender);
        
        // Decode tokenId from installation data
        uint256 tokenId = abi.decode(data, (uint256));
        walletToTokenId[msg.sender] = tokenId;
        initialized[msg.sender] = true;
    }

    function onUninstall(bytes calldata) external payable override {
        if (!initialized[msg.sender]) revert NotInitialized(msg.sender);
        
        delete walletToTokenId[msg.sender];
        delete initialized[msg.sender];
    }

    function isModuleType(uint256 moduleTypeId) external pure override returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    function isInitialized(address smartAccount) external view override returns (bool) {
        return initialized[smartAccount];
    }

    function recoverSigner(bytes32 hash, bytes calldata signature) external view returns (address) {
        return ECDSA.recover(hash, signature);
    }
}