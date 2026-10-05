// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MTGToken (Morgan Treasure BEP-20 Token)
 * @author Morgan Treasure Protocol Architecture Team
 * @notice Official BEP-20 Utility & Governance Token for BNB Smart Chain (BSC)
 * 
 * SPECIFICATIONS:
 * - Token Name: Morgan Treasure
 * - Symbol: MTG
 * - Decimals: 18
 * - Total / Initial Supply: 100,000,000 MTG (100 Million)
 * - Base Presale Price: $0.25 USDT per MTG
 * - Standard: BEP-20 / ERC-20 with Mint, Burn, Pause & Hot-Wallet Operator permissions
 * - Hybrid Integration: Compatible with PHP Backend API & Hot-Wallet automated disbursement
 */

interface IBEP20 {
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
    function getOwner() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address _owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Ownable: initial owner is the zero address");
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

contract MTGToken is Context, IBEP20, Ownable, Pausable {
    string private constant _NAME = "Morgan Treasure";
    string private constant _SYMBOL = "MTG";
    uint8 private constant _DECIMALS = 18;

    uint256 private _totalSupply;
    uint256 public constant MAX_SUPPLY = 500_000_000 * 10**18; // Max 500M Cap

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Authorized Hot-Wallet Operators (PHP Backend API hot wallet for disbursements)
    mapping(address => bool) public isOperator;

    event OperatorUpdated(address indexed operator, bool indexed status);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    modifier onlyOperatorOrOwner() {
        require(msg.sender == owner() || isOperator[msg.sender], "MTG: Caller not authorized operator");
        _;
    }

    constructor(
        address initialHolder,
        address initialOperator
    ) Ownable(msg.sender) {
        require(initialHolder != address(0), "Invalid initial holder");
        
        // Initial Supply: 100,000,000 MTG
        uint256 initialSupply = 100_000_000 * 10**_DECIMALS;
        _totalSupply = initialSupply;
        _balances[initialHolder] = initialSupply;

        if (initialOperator != address(0)) {
            isOperator[initialOperator] = true;
            emit OperatorUpdated(initialOperator, true);
        }

        emit Transfer(address(0), initialHolder, initialSupply);
    }

    // --- BEP-20 Standard Interface ---
    function name() public pure override returns (string memory) {
        return _NAME;
    }

    function symbol() public pure override returns (string memory) {
        return _SYMBOL;
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function getOwner() external view override returns (address) {
        return owner();
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address tokenOwner, address spender) public view override returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public override whenNotPaused returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "BEP20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        _transfer(sender, recipient, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "BEP20: decreased allowance below zero");
        unchecked {
            _approve(_msgSender(), spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    // --- Minting & Burning (Hybrid API / Hot-Wallet Integration) ---

    /**
     * @notice Mint new tokens (e.g. for presale orders processed via PHP API)
     */
    function mint(address to, uint256 amount) external onlyOperatorOrOwner whenNotPaused returns (bool) {
        require(to != address(0), "BEP20: mint to zero address");
        require(_totalSupply + amount <= MAX_SUPPLY, "BEP20: max cap exceeded");

        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
        emit TokensMinted(to, amount);
        return true;
    }

    /**
     * @notice Burn tokens from caller balance
     */
    function burn(uint256 amount) external whenNotPaused returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }

    /**
     * @notice Burn tokens from an account with allowance
     */
    function burnFrom(address account, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[account][_msgSender()];
        require(currentAllowance >= amount, "BEP20: burn amount exceeds allowance");
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
        return true;
    }

    // --- Operator Management ---
    function setOperator(address operator, bool status) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        isOperator[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    // --- Pause Controls ---
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Internal Helpers ---
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "BEP20: transfer from zero address");
        require(recipient != address(0), "BEP20: transfer to zero address");
        require(_balances[sender] >= amount, "BEP20: transfer amount exceeds balance");

        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "BEP20: approve from zero address");
        require(spender != address(0), "BEP20: approve to zero address");

        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "BEP20: burn from zero address");
        require(_balances[account] >= amount, "BEP20: burn amount exceeds balance");

        _balances[account] -= amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
        emit TokensBurned(account, amount);
    }
}
