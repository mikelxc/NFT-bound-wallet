// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "solady/tokens/ERC721.sol";
import {LibClone} from "solady/utils/LibClone.sol";
import {LibString} from "solady/utils/LibString.sol";
import {Base64} from "solady/utils/Base64.sol";
import {Ownable} from "solady/auth/Ownable.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {Kernel} from "kernel/src/Kernel.sol";
import {KernelFactory} from "kernel/src/factory/KernelFactory.sol";
import {IHook} from "kernel/src/interfaces/IERC7579Modules.sol";
import {ValidationId} from "kernel/src/core/ValidationManager.sol";
import {ValidatorLib} from "kernel/src/utils/ValidationTypeLib.sol";
import {NFTBoundValidator} from "./NFTBoundValidator.sol";
import {INFTWalletFactory} from "./interfaces/INFTWalletFactory.sol";
import {HOOK_MODULE_NOT_INSTALLED} from "kernel/src/types/Constants.sol";

contract NFTWalletFactory is ERC721, Ownable, INFTWalletFactory {
    using LibString for uint256;
    using LibString for address;

    uint256 private _nextTokenId = 0;
    uint256 public mintingFee = 0.01 ether;
    KernelFactory public immutable _kernelFactory;
    address public immutable nftBoundValidator;
    
    string private _name;
    string private _symbol;
    
    mapping(uint256 => address) public tokenIdToWallet;
    mapping(address => uint256) public walletToTokenId;

    error InsufficientFee();
    error DeploymentFailed();
    error InitializationFailed();

    constructor(
        KernelFactory kernelFactory_,
        address _nftBoundValidator,
        string memory name_,
        string memory symbol_
    ) {
        _kernelFactory = kernelFactory_;
        nftBoundValidator = _nftBoundValidator;
        _initializeOwner(msg.sender);
        _name = name_;
        _symbol = symbol_;
    }

    function mintWallet(address to) external payable returns (uint256 tokenId, address wallet) {
        if (msg.value < mintingFee) revert InsufficientFee();
        
        tokenId = _nextTokenId++;
        
        _mint(to, tokenId);
        
        // Create ValidationId for the NFTBoundValidator
        ValidationId rootValidator = ValidatorLib.validatorToIdentifier(NFTBoundValidator(nftBoundValidator));
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSignature(
            "initialize(bytes21,address,bytes,bytes,bytes[])",
            rootValidator,
            IHook(HOOK_MODULE_NOT_INSTALLED), // No hook needed
            abi.encode(tokenId), // validator data (tokenId)
            "", // hook data (empty)
            new bytes[](0) // initConfig (empty)
        );
        
        bytes32 salt = keccak256(abi.encodePacked(tokenId, address(this)));
        
        wallet = _kernelFactory.createAccount(initData, salt);
        
        tokenIdToWallet[tokenId] = wallet;
        walletToTokenId[wallet] = tokenId;
        
        emit WalletCreated(tokenId, wallet, to);
        
        return (tokenId, wallet);
    }

    function getWalletAddress(uint256 tokenId) public view returns (address) {
        // Create ValidationId for the NFTBoundValidator
        ValidationId rootValidator = ValidatorLib.validatorToIdentifier(NFTBoundValidator(nftBoundValidator));
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSignature(
            "initialize(bytes21,address,bytes,bytes,bytes[])",
            rootValidator,
            IHook(HOOK_MODULE_NOT_INSTALLED),
            abi.encode(tokenId),
            "",
            new bytes[](0)
        );
        
        bytes32 salt = keccak256(abi.encodePacked(tokenId, address(this)));
        return _kernelFactory.getAddress(initData, salt);
    }

    function kernelFactory() external view returns (address) {
        return address(_kernelFactory);
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        
        address wallet = tokenIdToWallet[tokenId];
        if (wallet == address(0)) {
            wallet = getWalletAddress(tokenId);
        }
        
        string memory svg = generateSVG(tokenId);
        uint256 balance = wallet.balance;
        
        string memory json = string(abi.encodePacked(
            '{',
                '"name":"NBA #', tokenId.toString(), '",',
                '"description":"This NFT represents ownership of an NFT-Bound Smart Account (NBA) built on Kernel v3.3. The owner of this NFT has full control over the associated wallet. Transfer this NFT to transfer wallet control instantly.",',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                '"external_url":"https://github.com/your-repo/nft-wallet",',
                '"background_color":"667eea",',
                '"attributes":[',
                    '{"trait_type":"Wallet Address","value":"', wallet.toHexString(), '"},',
                    '{"trait_type":"ETH Balance","value":', formatEtherForJson(balance), ',"display_type":"number"},',
                    '{"trait_type":"Token ID","value":', tokenId.toString(), ',"display_type":"number"},',
                    '{"trait_type":"Account Type","value":"Smart Contract Wallet"},',
                    '{"trait_type":"Kernel Version","value":"v3.3"},',
                    '{"trait_type":"Validator","value":"NFT-Bound"},',
                    '{"trait_type":"Chain ID","value":', block.chainid.toString(), ',"display_type":"number"}',
                ']',
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function generateSVG(uint256 tokenId) internal view returns (string memory) {
        address wallet = tokenIdToWallet[tokenId];
        if (wallet == address(0)) {
            wallet = getWalletAddress(tokenId);
        }
        
        uint256 balance = wallet.balance;
        string memory walletStr = wallet.toHexString();
        string memory truncatedWallet = string(abi.encodePacked(
            LibString.slice(walletStr, 0, 6),
            "...",
            LibString.slice(walletStr, 38, 42)
        ));
        
        return string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            generateDefs(balance, tokenId),
            generateBackground(),
            generateGlassCard(),
            generateDynamicElement(balance),
            generateText(tokenId, truncatedWallet, balance),
            generateDecorations(balance, tokenId),
            '</svg>'
        ));
    }
    
    function generateDefs(uint256 balance, uint256 tokenId) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1">',
                        '<animate attributeName="stop-color" values="#667eea;#764ba2;#667eea" dur="10s" repeatCount="indefinite"/>',
                    '</stop>',
                    '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1">',
                        '<animate attributeName="stop-color" values="#764ba2;#667eea;#764ba2" dur="10s" repeatCount="indefinite"/>',
                    '</stop>',
                '</linearGradient>',
                '<linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />',
                    '<stop offset="50%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />',
                '</linearGradient>',
                generateActivityGradient(balance),
                generateBalanceFilter(balance),
                generateRarityFilter(tokenId),
            '</defs>'
        ));
    }
    
    function generateBackground() internal pure returns (string memory) {
        return '<rect width="400" height="400" fill="url(#bg)"/>';
    }
    
    function generateGlassCard() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="30" y="30" width="340" height="340" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>',
            '<rect x="30" y="30" width="340" height="340" rx="20" fill="url(#glassGradient)" opacity="0.5"/>'
        ));
    }
    
    function generateActivityGradient(uint256 balance) internal pure returns (string memory) {
        if (balance == 0) {
            return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#4F46E5;stop-opacity:0.8"/><stop offset="100%" style="stop-color:#4F46E5;stop-opacity:0.3"/></radialGradient>';
        } else if (balance <= 0.1 ether) {
            return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#7C3AED;stop-opacity:0.9"/><stop offset="100%" style="stop-color:#7C3AED;stop-opacity:0.4"/></radialGradient>';
        } else if (balance <= 1 ether) {
            return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#DC2626;stop-opacity:1"/><stop offset="100%" style="stop-color:#DC2626;stop-opacity:0.5"/></radialGradient>';
        } else {
            return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1"/><stop offset="100%" style="stop-color:#F59E0B;stop-opacity:0.6"/></radialGradient>';
        }
    }
    
    function generateBalanceFilter(uint256 balance) internal pure returns (string memory) {
        if (balance >= 10 ether) {
            return '<filter id="shimmer"><feGaussianBlur stdDeviation="1" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        } else if (balance >= 1 ether) {
            return '<filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        }
        return '';
    }
    
    function generateRarityFilter(uint256 tokenId) internal pure returns (string memory) {
        if (tokenId <= 100) {
            return '<filter id="golden"><feColorMatrix values="1.2 0.8 0.2 0 0.1 0.8 1.1 0.3 0 0.1 0.3 0.4 1.0 0 0 0 0 0 1 0"/></filter>';
        } else if (tokenId <= 1000) {
            return '<filter id="silver"><feColorMatrix values="1.1 1.1 1.1 0 0 1.1 1.1 1.1 0 0 1.1 1.1 1.1 0 0 0 0 0 1 0"/></filter>';
        }
        return '';
    }
    
    function generateDynamicElement(uint256 balance) internal pure returns (string memory) {
        if (balance == 0) {
            // Dormant crystal (static)
            return string(abi.encodePacked(
                '<polygon points="200,160 220,180 200,200 180,180" fill="url(#activityGradient)" opacity="0.8"/>',
                '<polygon points="200,165 215,180 200,195 185,180" fill="rgba(255,255,255,0.3)"/>'
            ));
        } else if (balance <= 0.1 ether) {
            // Pulsing orb
            return string(abi.encodePacked(
                '<circle cx="200" cy="180" r="18" fill="url(#activityGradient)">',
                    '<animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite"/>',
                    '<animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>',
                '</circle>',
                '<circle cx="200" cy="180" r="12" fill="rgba(255,255,255,0.4)">',
                    '<animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite"/>',
                '</circle>'
            ));
        } else if (balance <= 1 ether) {
            // Active nexus with rotating rings
            return string(abi.encodePacked(
                '<g transform-origin="200 180">',
                    '<animateTransform attributeName="transform" type="rotate" values="0 200 180;360 200 180" dur="4s" repeatCount="indefinite"/>',
                    '<circle cx="200" cy="180" r="25" fill="none" stroke="url(#activityGradient)" stroke-width="3"/>',
                    '<circle cx="200" cy="180" r="18" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>',
                '</g>',
                '<circle cx="200" cy="180" r="10" fill="url(#activityGradient)"/>'
            ));
        } else {
            // Energized portal with particle effects
            return string(abi.encodePacked(
                '<circle cx="200" cy="180" r="28" fill="url(#activityGradient)" opacity="0.6">',
                    '<animate attributeName="r" values="28;35;28" dur="1.5s" repeatCount="indefinite"/>',
                '</circle>',
                '<g>',
                    '<animateTransform attributeName="transform" type="rotate" values="0 200 180;360 200 180" dur="3s" repeatCount="indefinite"/>',
                    '<circle cx="225" cy="180" r="3" fill="white" opacity="0.8"/>',
                    '<circle cx="200" cy="155" r="2" fill="white" opacity="0.6"/>',
                    '<circle cx="175" cy="180" r="3" fill="white" opacity="0.8"/>',
                    '<circle cx="200" cy="205" r="2" fill="white" opacity="0.6"/>',
                '</g>'
            ));
        }
    }
    
    function generateText(uint256 tokenId, string memory truncatedWallet, uint256 balance) internal pure returns (string memory) {
        string memory balanceFilter = balance >= 1 ether ? ' filter="url(#glow)"' : '';
        string memory rarityFilter = tokenId <= 100 ? ' filter="url(#golden)"' : (tokenId <= 1000 ? ' filter="url(#silver)"' : '');
        
        return string(abi.encodePacked(
            '<text x="50" y="80" font-family="monospace" font-size="28" font-weight="bold" fill="white"', rarityFilter, '>',
                'NBA #', tokenId.toString(),
            '</text>',
            '<text x="50" y="100" font-family="monospace" font-size="11" fill="rgba(255,255,255,0.6)">',
                'NFT-BOUND SMART ACCOUNT',
            '</text>',
            '<text x="50" y="130" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.8)">',
                truncatedWallet,
            '</text>',
            '<text x="50" y="330" font-family="monospace" font-size="16" fill="rgba(255,255,255,0.9)"', balanceFilter, '>',
                unicode"⟡ ", formatEther(balance), ' ETH',
            '</text>'
        ));
    }
    
    function generateDecorations(uint256 balance, uint256 tokenId) internal pure returns (string memory) {
        string memory cornerAccents = string(abi.encodePacked(
            '<path d="M30 60 L30 30 L60 30" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>',
            '<path d="M340 60 L370 60 L370 30 L340 30" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>',
            '<path d="M30 340 L30 370 L60 370" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>',
            '<path d="M340 370 L370 370 L370 340" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>'
        ));
        
        string memory particles = '';
        if (balance >= 10 ether || isSpecialTokenId(tokenId)) {
            particles = string(abi.encodePacked(
                '<circle r="1.5" fill="white" opacity="0.6">',
                    '<animateMotion dur="6s" repeatCount="indefinite" path="M70,70 Q200,50 330,70 Q200,90 70,70"/>',
                '</circle>',
                '<circle r="1" fill="white" opacity="0.4">',
                    '<animateMotion dur="8s" repeatCount="indefinite" path="M330,330 Q200,310 70,330 Q200,350 330,330"/>',
                '</circle>'
            ));
        }
        
        return string(abi.encodePacked(cornerAccents, particles));
    }
    
    function isSpecialTokenId(uint256 tokenId) internal pure returns (bool) {
        if (tokenId < 10) return false;
        if (tokenId < 100) {
            return (tokenId / 10) == (tokenId % 10);
        }
        if (tokenId < 1000) {
            uint256 first = tokenId / 100;
            uint256 last = tokenId % 10;
            return first == last;
        }
        return tokenId % 1000 == 0 || tokenId % 500 == 0;
    }

    function formatEther(uint256 weiAmount) internal pure returns (string memory) {
        if (weiAmount == 0) return "0.0";
        
        uint256 eth = weiAmount / 1 ether;
        uint256 remainder = weiAmount % 1 ether;
        
        if (remainder == 0) {
            return string(abi.encodePacked(eth.toString(), ".0"));
        }
        
        uint256 decimals = remainder / 1e15; // 3 decimal places
        return string(abi.encodePacked(eth.toString(), ".", decimals.toString()));
    }

    function formatEtherForJson(uint256 weiAmount) internal pure returns (string memory) {
        // For JSON attributes, use raw wei as number for precision
        return (weiAmount / 1e15).toString(); // Convert to milliether for readability
    }


    function setMintingFee(uint256 _newFee) external onlyOwner {
        mintingFee = _newFee;
        emit MintingFeeUpdated(_newFee);
    }

    function withdraw() external onlyOwner {
        SafeTransferLib.safeTransferETH(owner(), address(this).balance);
    }

    function contractURI() public pure returns (string memory) {
        string memory json = string(abi.encodePacked(
            '{',
                '"name":"Wallet NFTs",',
                '"description":"A collection of NFTs where each token represents ownership of a smart contract wallet built on Kernel v3.3. Transfer the NFT to transfer wallet control.",',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(_getCollectionSvg())), '",',
                '"external_link":"https://github.com/your-repo/nft-wallet",',
                '"seller_fee_basis_points":0,',
                '"fee_recipient":"0x0000000000000000000000000000000000000000"',
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _getCollectionSvg() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
                    '<stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />',
                    '<stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />',
                '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            '<text x="200" y="150" fill="white" font-family="Arial,sans-serif" font-size="36" font-weight="bold" text-anchor="middle">',
            'NBA Collection',
            '</text>',
            '<text x="200" y="200" fill="white" font-family="Arial,sans-serif" font-size="16" text-anchor="middle" opacity="0.8">',
            'NFT-Bound Smart Accounts',
            '</text>',
            '<text x="200" y="250" fill="white" font-family="Arial,sans-serif" font-size="14" text-anchor="middle" opacity="0.6">',
            'Built on Kernel v3.3',
            '</text>',
            '</svg>'
        ));
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(INFTWalletFactory).interfaceId || super.supportsInterface(interfaceId);
    }
}